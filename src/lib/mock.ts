import type { StudySet } from '../types'

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}



export function generateMockStudySet(input: string, count = 6, quizCount = 5): StudySet {
  const normalized = input.trim().slice(0, 120)
  const words = normalized.split(/\s+/).slice(0, 6).join(' ')
  const topic = words.length > 40 ? words.slice(0, 40) + '…' : words || 'Study Notes'
  const h = hash(input)
  const seedTopic = topic.replace(/[^a-zA-Z0-9 ]/g, '').trim() || 'General Knowledge'

  // Build deterministic flashcards from input sentences
  const sentences = input.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean)
  const base = sentences.length ? sentences : [input]

  const flashcards = Array.from({ length: Math.min(Math.max(count, 3), 10) }, (_, i) => {
    const src = base[i % base.length] || `Concept ${i + 1} from ${seedTopic}`
    const front = i === 0 ? `What is the main idea of "${seedTopic}"?` : i === 1 ? `Define a key term from: "${src.slice(0, 60)}"` : `Explain: ${src.slice(0, 80)}${src.length > 80 ? '…' : ''}`
    const back = i === 0 ? `${seedTopic} centers on ${src.slice(0, 110)}.` : i === 1 ? `Key term: "${src.split(' ').slice(0, 4).join(' ')}" — ${src.slice(0, 100)}` : `${src.slice(0, 140)}${src.length > 140 ? '…' : ''}`
    return { id: i + 1, front: front.slice(0, 300), back: back.slice(0, 500) }
  })

  // Quiz templates — deterministic but plausible
  const quizTemplates: Array<{ q: string; opts: [string, string, string, string]; a: number; exp: string }> = [
    {
      q: `Which statement best captures "${seedTopic}"?`,
      opts: [`It focuses on ${base[0]?.slice(0, 38) || 'core principles'}`, 'It is unrelated to the input', 'It only concerns ancient history', 'It has no practical application'],
      a: 0,
      exp: `The input centers on ${base[0]?.slice(0, 50) || seedTopic}.`,
    },
    {
      q: `What detail is explicitly present in the notes?`,
      opts: [base[1]?.slice(0, 36) || 'Key concept A', 'A fabricated detail not in notes', base[2]?.slice(0, 36) || 'Another detail', 'Unrelated trivia'],
      a: h % 2 === 0 ? 0 : 2,
      exp: 'This option is taken directly from your pasted notes.',
    },
    {
      q: `Which inference follows logically from the material?`,
      opts: ['If X then Z must happen', `Because ${seedTopic} implies continuity`, 'Random unrelated cause', 'Opposite of what notes say'],
      a: 1,
      exp: 'It connects premises from the source without adding new facts.',
    },
    {
      q: `Which option is a plausible distractor but incorrect?`,
      opts: ['A near-miss that swaps one term', `Correct: ${base[0]?.slice(0, 30)}`, 'A correct restatement', 'Another correct view'],
      a: 0,
      exp: 'Distractors in this quiz are designed to be plausible.',
    },
    {
      q: `What would be the best follow-up study step?`,
      opts: ['Re-read and self-test on cards', 'Ignore the material', 'Memorize without understanding', 'Skip practice'],
      a: 0,
      exp: 'Active recall via cards + quiz is most effective.',
    },
  ]

  const safeQuizCount = Math.min(Math.max(quizCount, 3), 10)
  // Extend templates if quizCount > 5 by repeating variations
  const extendedTemplates = [...quizTemplates]
  while (extendedTemplates.length < safeQuizCount) {
    const baseIdx = extendedTemplates.length % quizTemplates.length
    const src = quizTemplates[baseIdx]!
    extendedTemplates.push({
      q: `${src.q} (variation ${extendedTemplates.length + 1})`,
      opts: src.opts,
      a: (src.a + extendedTemplates.length) % 4,
      exp: src.exp,
    })
  }
  const quiz = extendedTemplates.slice(0, safeQuizCount).map((t, i) => ({
    id: i + 1,
    question: t.q,
    options: t.opts,
    answer: t.a,
    explanation: t.exp,
  }))

  return {
    topic: seedTopic.slice(0, 80),
    summary: `Mock study set for "${seedTopic}". Input was ${input.length} chars. This demo deck was generated locally (no AI) so you can still preview flashcards and quiz interactions while the AI is unavailable. Paste richer notes and retry Generate when the API recovers.`,
    flashcards,
    quiz,
  }
}