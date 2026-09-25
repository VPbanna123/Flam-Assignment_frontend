import type { StudySet, ParseResult, Flashcard, QuizQuestion } from '../types';

// --- sanitize & extract JSON ---
function stripCodeFences(s: string): string {
  let t = s.trim();
  // remove ```json ... ``` or ``` ... ```
  if (t.startsWith('```')) {
    // find first newline after opening fence, last fence
    const firstNl = t.indexOf('\n');
    const lastFence = t.lastIndexOf('```');
    if (firstNl !== -1 && lastFence > firstNl) {
      t = t.slice(firstNl + 1, lastFence).trim();
    } else {
      t = t.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
    }
  }
  return t;
}

function extractJsonObject(s: string): string {
  let t = stripCodeFences(s);
  // If still not starting with {, try to find first { and last }
  if (!t.startsWith('{')) {
    const first = t.indexOf('{');
    const last = t.lastIndexOf('}');
    if (first !== -1 && last !== -1 && last > first) {
      t = t.slice(first, last + 1);
    }
  }
  return t;
}

function tryAutoFix(jsonStr: string): string {
  let s = jsonStr;
  // Remove trailing commas before } or ]
  s = s.replace(/,\s*([}\]])/g, '$1');
  // Fix smart quotes
  s = s.replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'");
  // Remove // comments and /* */ (naively)
  s = s.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  // If json uses single quotes for keys/strings, convert (simple heuristic)
  // Only if it looks like single-quoted JSON and double-quote parse will fail
  // We'll try double-quote parse first before this; caller will attempt both.
  return s;
}

function tryParseJsonLoose(raw: string): { parsed: unknown; used: string } | { error: string } {
  const extracted = extractJsonObject(raw);
  const candidates: string[] = [];
  candidates.push(extracted);
  candidates.push(tryAutoFix(extracted));
  // Try fixing single quotes -> double quotes (risky, but help for small models)
  const singleToDouble = tryAutoFix(extracted).replace(/'([^']*)'/g, (_, p1: string) => `"${p1.replace(/"/g, '\\"')}"`);
  if (singleToDouble !== extracted) candidates.push(singleToDouble);

  for (const c of candidates) {
    try {
      const parsed = JSON.parse(c);
      return { parsed, used: c };
    } catch {
      // continue
    }
  }
  return { error: 'JSON.parse failed for all repair attempts' };
}

// --- validation ---
export function validateStudySet(obj: unknown): { ok: true; data: StudySet; warnings: string[] } | { ok: false; error: string } {
  const warnings: string[] = [];
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return { ok: false, error: 'Root must be an object' };
  }
  const o = obj as Record<string, unknown>;

  // topic
  if (typeof o.topic !== 'string' || !o.topic.trim()) return { ok: false, error: 'Missing or empty "topic"' };
  const topic = o.topic.trim().slice(0, 80);
  // summary
  if (typeof o.summary !== 'string' || !o.summary.trim()) return { ok: false, error: 'Missing or empty "summary"' };
  const summary = o.summary.trim().slice(0, 600);

  // flashcards
  if (!Array.isArray(o.flashcards)) return { ok: false, error: '"flashcards" must be an array' };
  const flashcards: Flashcard[] = [];
  for (let i = 0; i < o.flashcards.length; i++) {
    const f = o.flashcards[i] as Record<string, unknown>;
    if (!f || typeof f.front !== 'string' || !f.front.trim() || typeof f.back !== 'string' || !f.back.trim()) {
      warnings.push(`Flashcard #${i + 1} skipped (missing front/back)`);
      continue;
    }
    flashcards.push({
      id: Number(f.id) || i + 1,
      front: String(f.front).trim().slice(0, 300),
      back: String(f.back).trim().slice(0, 500),
    });
  }
  if (flashcards.length < 2) return { ok: false, error: `Too few valid flashcards (${flashcards.length}/2+ required)` };
  if (flashcards.length < 3) warnings.push(`Only ${flashcards.length} flashcards (expected 3-10)`);

  // de-duplicate ids
  flashcards.forEach((c, idx) => (c.id = idx + 1));

  // quiz
  if (!Array.isArray(o.quiz)) return { ok: false, error: '"quiz" must be an array' };
  const quiz: QuizQuestion[] = [];
  for (let i = 0; i < o.quiz.length; i++) {
    const q = o.quiz[i] as Record<string, unknown>;
    if (!q || typeof q.question !== 'string' || !q.question.trim()) {
      warnings.push(`Quiz #${i + 1} skipped (missing question)`);
      continue;
    }
    if (!Array.isArray(q.options) || q.options.length !== 4) {
      warnings.push(`Quiz #${i + 1} skipped (options must be 4)`);
      continue;
    }
    const opts = q.options.map((op) => (typeof op === 'string' ? op.trim() : ''));
    if (opts.some((op) => !op)) {
      warnings.push(`Quiz #${i + 1} skipped (empty option)`);
      continue;
    }
    const ans = Number(q.answer);
    if (!Number.isInteger(ans) || ans < 0 || ans > 3) {
      warnings.push(`Quiz #${i + 1} skipped (answer must be 0-3)`);
      continue;
    }
    if (typeof q.explanation !== 'string' || !q.explanation.trim()) {
      warnings.push(`Quiz #${i + 1} has no explanation – added fallback`);
    }
    quiz.push({
      id: Number(q.id) || i + 1,
      question: String(q.question).trim().slice(0, 400),
      options: opts.slice(0, 4) as [string, string, string, string],
      answer: ans,
      explanation: (typeof q.explanation === 'string' && q.explanation.trim() ? q.explanation.trim() : 'No explanation provided.').slice(0, 500),
    });
  }
  if (quiz.length < 2) return { ok: false, error: `Too few valid quiz questions (${quiz.length}/2+ required)` };
  if (quiz.length < 3) warnings.push(`Only ${quiz.length} quiz questions (expected 3-5)`);
  quiz.forEach((q, idx) => (q.id = idx + 1));

  // check for duplicate flashcard fronts
  const seen = new Set<string>();
  for (const f of flashcards) {
    const key = f.front.toLowerCase();
    if (seen.has(key)) warnings.push(`Duplicate flashcard prompt: "${f.front.slice(0, 40)}"`);
    seen.add(key);
  }

  return { ok: true, data: { topic, summary, flashcards, quiz }, warnings };
}

export function parseStudySet(raw: string): ParseResult {
  if (!raw || !raw.trim()) {
    return { ok: false, error: 'Model returned empty output.', raw };
  }
  // If raw is already JSON-looking but includes preamble, extract
  const loose = tryParseJsonLoose(raw);
  if ('error' in loose) {
    const snippet = raw.slice(0, 800);
    return {
      ok: false,
      error: `Malformed JSON: could not parse. The model did not return valid JSON.`,
      raw,
      snippet,
    };
  }
  const validation = validateStudySet(loose.parsed);
  if (!validation.ok) {
    return {
      ok: false,
      error: `Wrong shape: ${validation.error}`,
      raw,
      snippet: JSON.stringify(loose.parsed, null, 2).slice(0, 1000),
    };
  }
  return { ok: true, data: validation.data, warnings: validation.warnings, raw: loose.used };
}

// For UI: quick check if raw looks truncated
export function isLikelyTruncated(raw: string): boolean {
  const t = raw.trim();
  // unbalanced braces/brackets or ends without closing
  const openBraces = (t.match(/{/g) || []).length;
  const closeBraces = (t.match(/}/g) || []).length;
  const endsWithPunct = /[}\]"']\s*$/.test(t);
  return openBraces !== closeBraces || !endsWithPunct;
}
