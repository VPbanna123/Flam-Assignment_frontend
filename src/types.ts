export type Flashcard = {
  id: number;
  front: string;
  back: string;
};

export type QuizQuestion = {
  id: number;
  question: string;
  options: [string, string, string, string];
  answer: number; // 0-3
  explanation: string;
};

export type StudySet = {
  topic: string;
  summary: string;
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
};

export type ParseResult =
  | { ok: true; data: StudySet; warnings: string[]; raw: string }
  | { ok: false; error: string; raw: string; snippet?: string };
