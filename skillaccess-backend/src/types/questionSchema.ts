export type QuestionLevel = "beginner" | "intermediate" | "advanced";
export type QuestionType =
  | "mcq"
  | "mcqmulti"
  | "findAnswer"
  | "descriptive"
  | "video"
  | "coding"
  | "prompt";

export interface AIQuestion {
  question?: string;
  passage?: string;
  instructions?: string;
  expectedAnswer?: string;
  answersByLanguage?: {
    python: string;
    java: string;
    cpp: string;
  };
  title: string;
  duration: number; // previously "string"
  subject: string;
  level: QuestionLevel;
  type: QuestionType;
  totalMarks: number;
  options?: { text: string; isCorrect: boolean }[]; // for mcq types
  answer?: string;
  answers?: string[];
  expectedOutputDescription?: string; // for prompt type
}
