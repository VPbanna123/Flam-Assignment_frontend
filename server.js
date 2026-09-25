import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';
const GEMINI_MODEL_PRIMARY = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

if (!GROQ_API_KEY && !GEMINI_API_KEY) {
  console.warn('[server] No LLM key set — set GROQ_API_KEY or GEMINI_API_KEY in .env');
} else {
  if (GROQ_API_KEY) console.log(`[server] Groq key present (${GROQ_API_KEY.slice(0, 6)}…) model ${GROQ_MODEL} — will try first`);
  if (GEMINI_API_KEY) console.log(`[server] Gemini key present (${GEMINI_API_KEY.slice(0, 6)}…) model ${GEMINI_MODEL_PRIMARY}`);
  if (GROQ_API_KEY && GROQ_API_KEY.length < 20) console.warn('[server] GROQ_API_KEY looks short');
  if (GEMINI_API_KEY && GEMINI_API_KEY.length < 20) console.warn('[server] GEMINI_API_KEY looks short');
}

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// simple health
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    hasGroqKey: Boolean(GROQ_API_KEY),
    hasGeminiKey: Boolean(GEMINI_API_KEY),
    hasKey: Boolean(GROQ_API_KEY || GEMINI_API_KEY),
    groqModel: GROQ_MODEL,
    geminiModel: GEMINI_MODEL_PRIMARY,
    fallbackModels: {
      groq: ['openai/gpt-oss-20b', 'openai/gpt-oss-120b', 'qwen/qwen3.8-27b'],
      gemini: ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.5-flash-lite', 'gemini-2.5-pro'],
    },
    time: new Date().toISOString(),
  });
});

// --- Gemini prompt builder ---
function buildPrompt(userInput, opts = {}) {
  const count = Math.min(Math.max(Number(opts.count) || 6, 3), 10);
  const quizCount = Math.min(Math.max(Number(opts.quizCount ?? opts.quiz_count ?? 5) || 5, 3), 10);
  const difficulty = opts.difficulty || 'mixed';
  // Strict JSON instruction to minimize malformed output
  return `You are a study assistant. Convert the user's notes/topic into structured study material.

USER INPUT:
"""
${userInput}
"""

INSTRUCTIONS:
- Identify the topic (short title, max 6 words)
- Write a 2-3 sentence summary that captures the core idea
- Generate exactly ${count} flashcards: each has "front" (question/prompt) and "back" (concise answer, 1-2 sentences). Cover key facts, definitions, and one challenging nuance.
- Generate exactly ${quizCount} quiz questions: multiple-choice with 4 options each, exactly one correct answer. Include "explanation" (1 sentence) for why the answer is correct. Difficulty: ${difficulty}. Ensure options are plausible distractors.
- Avoid repeating the same fact across flashcards and quiz.
- Return ONLY valid JSON, no markdown, no code fences, no extra text.

REQUIRED JSON SHAPE (all keys required):
{
  "topic": "string",
  "summary": "string",
  "flashcards": [ { "id": 1, "front": "string", "back": "string" } ],
  "quiz": [ { "id": 1, "question": "string", "options": ["string","string","string","string"], "answer": 0, "explanation": "string" } ]
}

Rules:
- flashcards: array length ${count}, ids 1..${count}
- quiz: array length ${quizCount}, ids 1..${quizCount}, answer is integer 0-3
- All strings non-empty, trimmed
- JSON must be parseable with JSON.parse – no trailing commas, no comments
`;
}

// Timeout helper
function withTimeout(promise, ms, msg = 'Timeout') {
  let id;
  const t = new Promise((_, reject) => { id = setTimeout(() => reject(new Error(msg)), ms); });
  return Promise.race([promise, t]).finally(() => clearTimeout(id));
}

// Fallback model lists
const GEMINI_FALLBACK_MODELS = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.5-flash-lite', 'gemini-2.5-pro', 'gemini-3.5-flash'];
const GROQ_FALLBACK_MODELS = ['openai/gpt-oss-20b', 'openai/gpt-oss-120b', 'qwen/qwen3.8-27b'];
// keep legacy alias
const FALLBACK_MODELS = GEMINI_FALLBACK_MODELS;

async function callGemini(prompt, primaryModel, apiKey) {
  const attempted = [];
  const modelsToTry = [primaryModel, ...FALLBACK_MODELS.filter((m) => m !== primaryModel)];
  let lastError = null;
  let lastData = null;
  let lastStatus = 0;

  for (const model of modelsToTry) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const body = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 3072,
        responseMimeType: 'application/json',
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_NONE' },
      ],
    };

    try {
      const resp = await withTimeout(
        fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
        25000,
        'Gemini request timed out (25s)'
      );
      const data = await resp.json().catch(() => ({}));
      attempted.push({ model, status: resp.status });

      if (resp.ok) {
        return { ok: true, data, model, attempted };
      }

      lastError = data?.error?.message || `Gemini error ${resp.status}`;
      lastData = data;
      lastStatus = resp.status;
      console.error(`[gemini] ${model} → ${resp.status}`, data?.error?.message || JSON.stringify(data).slice(0, 400));

      // Retryable only for model-not-found / unsupported
      const isModelError = resp.status === 404 || resp.status === 400;
      const msgLower = String(lastError).toLowerCase();
      const isModelMsg = msgLower.includes('model') && (msgLower.includes('not found') || msgLower.includes('unsupported') || msgLower.includes('not supported'));
      if (!isModelError && !isModelMsg) {
        // Non-model error: return immediately with useful mapping
        return { ok: false, status: resp.status, error: lastError, data, attempted, model };
      }
      // otherwise continue to next fallback model
    } catch (e) {
      lastError = e.message || String(e);
      lastStatus = 0;
      attempted.push({ model, status: 'exception', error: lastError });
      console.error(`[gemini] ${model} exception`, lastError);
      // network/timeout — try next model as well
      if (!String(lastError).toLowerCase().includes('timed out')) continue;
      // timeout: still try next?
    }
  }
  return { ok: false, status: lastStatus || 502, error: lastError || 'All Gemini models failed', data: lastData, attempted };
}

async function callGroq(prompt, primaryModel, apiKey) {
  const attempted = [];
  const modelsToTry = [primaryModel, ...GROQ_FALLBACK_MODELS.filter((m) => m !== primaryModel)];
  let lastError = null;
  let lastData = null;
  let lastStatus = 0;

  for (const model of modelsToTry) {
    const url = 'https://api.groq.com/openai/v1/chat/completions';
    const body = {
      model,
      messages: [
        { role: 'system', content: 'You are a study assistant. Return ONLY valid JSON matching the required shape. No markdown, no code fences, no extra text.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
    };

    try {
      const resp = await withTimeout(
        fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(body),
        }),
        20000,
        'Groq request timed out (20s)'
      );
      const data = await resp.json().catch(() => ({}));
      attempted.push({ model: `groq:${model}`, status: resp.status });

      if (resp.ok) {
        const content = data?.choices?.[0]?.message?.content;
        if (!content) {
          lastError = 'Groq returned empty content';
          lastData = data;
          lastStatus = 502;
          console.error(`[groq] ${model} empty content`, JSON.stringify(data).slice(0, 400));
          // treat as retryable, try next model
          continue;
        }
        // Wrap to mimic Gemini shape so caller can reuse? But we return rawText directly for Groq.
        return { ok: true, data, model: `groq:${model}`, attempted, raw: content };
      }

      lastError = data?.error?.message || data?.error?.type || `Groq error ${resp.status}`;
      lastData = data;
      lastStatus = resp.status;
      console.error(`[groq] ${model} → ${resp.status}`, data?.error?.message || JSON.stringify(data).slice(0, 400));

      const isModelError = resp.status === 404 || resp.status === 400;
      const msgLower = String(lastError).toLowerCase();
      const isModelMsg = msgLower.includes('model') && (msgLower.includes('not found') || msgLower.includes('decommissioned') || msgLower.includes('unsupported'));
      if (isModelError && isModelMsg) continue; // try next groq model
      if (resp.status === 429 || resp.status >= 500) {
        // rate limit or server overload — try next model, but also mark as retryable for fallback to Gemini
        continue;
      }
      // non-retryable client error — return immediately
      return { ok: false, status: resp.status, error: lastError, data, attempted, model: `groq:${model}` };
    } catch (e) {
      lastError = e.message || String(e);
      lastStatus = 0;
      attempted.push({ model: `groq:${model}`, status: 'exception', error: lastError });
      console.error(`[groq] ${model} exception`, lastError);
    }
  }
  return { ok: false, status: lastStatus || 502, error: lastError || 'All Groq models failed', data: lastData, attempted };
}

app.post('/api/generate', async (req, res) => {
  const started = Date.now();
  const { input, count, quizCount, quiz_count, difficulty } = req.body || {};
  const safeQuizCount = quizCount ?? quiz_count;

  if (!GROQ_API_KEY && !GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Server misconfigured: set GROQ_API_KEY or GEMINI_API_KEY in .env and restart.' });
  }
  if (!input || typeof input !== 'string' || !input.trim()) {
    return res.status(400).json({ error: 'Missing "input": provide pasted notes or a topic.' });
  }
  if (input.length > 8000) {
    return res.status(400).json({ error: 'Input too long (max 8000 chars). Please shorten.' });
  }
  if (input.trim().length < 8) {
    return res.status(400).json({ error: 'Input too short. Please provide more context (at least 8 characters).' });
  }

  const safeCount = Math.min(Math.max(Number(count) || 6, 3), 10);
  const safeQuiz = Math.min(Math.max(Number(safeQuizCount) || 5, 3), 10);
  const prompt = buildPrompt(input, { count: safeCount, quizCount: safeQuiz, difficulty });

  try {
    // --- Try Groq first (fast, low 502) ---
    if (GROQ_API_KEY) {
      console.log(`[server] → Groq ${GROQ_MODEL} (input ${input.length} chars, ${safeCount} cards / ${safeQuiz} quiz, difficulty ${difficulty})`);
      const groqResult = await callGroq(prompt, GROQ_MODEL, GROQ_API_KEY);
      if (groqResult.ok) {
        const rawText = (groqResult.raw || '').trim();
        if (!rawText) {
          console.error('[groq] empty raw despite ok', groqResult);
          // fall through to Gemini as fallback
        } else {
          console.log(`[server] Groq success ${groqResult.model} in ${Date.now() - started}ms`);
          return res.json({ raw: rawText, model: groqResult.model, provider: 'groq', attempted: groqResult.attempted, elapsedMs: Date.now() - started });
        }
      } else {
        console.warn(`[groq] failed → fallback to Gemini if available. Groq error: ${groqResult.error} (status ${groqResult.status}) attempted ${JSON.stringify(groqResult.attempted)}`);
        // If Groq failed but Gemini not available, return Groq error directly
        if (!GEMINI_API_KEY) {
          const status = groqResult.status || 502;
          if (status === 429) return res.status(429).json({ error: 'Groq rate limit — wait ~30s and retry. Add GEMINI_API_KEY as fallback or try again.', retryable: true, attempted: groqResult.attempted, provider: 'groq' });
          if (status === 401 || status === 403) return res.status(500).json({ error: 'Invalid Groq API key. Check GROQ_API_KEY in .env.', retryable: false, attempted: groqResult.attempted });
          return res.status(502).json({ error: groqResult.error || 'Groq request failed', retryable: true, attempted: groqResult.attempted, provider: 'groq' });
        }
        // else continue to Gemini, keeping groq attempts for combined log
        var groqAttempts = groqResult.attempted;
        var groqError = groqResult.error;
      }
    }

    // --- Groq not configured or failed → try Gemini ---
    if (!GEMINI_API_KEY) {
      // No Gemini to fallback to — we already returned Groq error above if Groq was the only provider
      return res.status(500).json({ error: 'No Gemini key configured and Groq failed. Set GROQ_API_KEY or GEMINI_API_KEY in .env.', retryable: false });
    }

    const geminiPrimary = GEMINI_MODEL_PRIMARY;
    console.log(`[server] → Gemini ${geminiPrimary} (input ${input.length} chars, ${safeCount} cards / ${safeQuiz} quiz)`);
    const result = await callGemini(prompt, geminiPrimary, GEMINI_API_KEY);

    if (!result.ok) {
      const status = result.status || 502;
      const errMsg = result.error || 'Gemini request failed';
      const combinedAttempts = [...(typeof groqAttempts !== 'undefined' ? groqAttempts : []), ...result.attempted];
      console.error('[gemini] final failure', { status, errMsg, attempted: result.attempted, groqError: typeof groqError !== 'undefined' ? groqError : undefined });
      if (status === 429) return res.status(429).json({ error: 'Rate limited — wait ~30s and retry, or try shorter input.', retryable: true, attempted: combinedAttempts, provider: 'gemini' });
      if (status === 401 || status === 403) return res.status(500).json({ error: 'Invalid Gemini API key. Check GEMINI_API_KEY in .env.', retryable: false, attempted: combinedAttempts });
      if (status === 404 || status === 400) {
        return res.status(502).json({
          error: `Model error (${result.model || geminiPrimary}): ${errMsg}. Tried: ${combinedAttempts.map((a) => `${a.model}(${a.status})`).join(', ')}`,
          retryable: true,
          attempted: combinedAttempts,
          provider: 'gemini',
        });
      }
      return res.status(502).json({
        error: `${errMsg} (status ${status}). ${status >= 500 ? 'Provider overloaded — retry in a few seconds.' : 'Try rephrasing or shortening input.'}`,
        retryable: status >= 500 || status === 429,
        status,
        attempted: combinedAttempts,
        provider: 'gemini',
      });
    }

    const data = result.data;
    const usedModel = result.model;
    const candidate = data?.candidates?.[0];
    const parts = candidate?.content?.parts || [];
    let rawText = parts.map((p) => p.text || '').join('\n').trim();

    if (!rawText) {
      const blockReason = candidate?.finishReason || data?.promptFeedback?.blockReason || 'unknown';
      const safetyRatings = candidate?.safetyRatings || data?.promptFeedback?.safetyRatings;
      console.error('[gemini] empty response', { blockReason, safetyRatings, data: JSON.stringify(data).slice(0, 800) });
      return res.status(502).json({
        error: `Model returned empty response (reason: ${blockReason}). Try rephrasing as neutral study notes, or shorter input.`,
        raw: rawText,
        blockReason,
        retryable: true,
      });
    }

    const combinedAttempts = [...(typeof groqAttempts !== 'undefined' ? groqAttempts : []), ...result.attempted];
    return res.json({ raw: rawText, model: usedModel, provider: 'gemini', attempted: combinedAttempts, elapsedMs: Date.now() - started });

  } catch (err) {
    console.error('[server] generate failed', err);
    const msg = String(err?.message || 'Server error');
    const isTimeout = msg.toLowerCase().includes('timed out');
    const isNetwork = msg.toLowerCase().includes('fetch') || msg.toLowerCase().includes('network') || msg.toLowerCase().includes('econn') || msg.toLowerCase().includes('etimedout');
    if (isNetwork) {
      return res.status(502).json({ error: 'Network error reaching provider — check internet/DNS or try again.', retryable: true, timeout: isTimeout });
    }
    res.status(isTimeout ? 504 : 500).json({ error: msg || 'Server error', timeout: isTimeout, retryable: isTimeout });
  }
});

// Serve Vite build in production
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  // Express 5: use /*splat for catch-all
  app.get('/*splat', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
} else {
  console.log('[server] dist/ not found – run `npm run build` for production. Dev: use Vite proxy.');
}

app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
  if (GROQ_API_KEY) console.log(`[server] Primary: Groq ${GROQ_MODEL} → fallback Gemini ${GEMINI_MODEL_PRIMARY}`);
  else console.log(`[server] Primary: Gemini ${GEMINI_MODEL_PRIMARY}`);
});
