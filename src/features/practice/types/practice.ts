export type AttemptStatus = "IN_PROGRESS" | "SUBMITTED" | "ABANDONED";
export type Category = "GRAMMAR" | "VOCABULARY" | "TOEIC";
export type StartAttemptInput = {
  source:
    | { type: "PRACTICE_SET"; practiceSetId: string }
    | { type: "GRAMMAR_TOPIC"; topicId: string }
    | { type: "MIXED_GRAMMAR"; topicIds: string[] };
  questionCount?: number;
  mode?: "PRACTICE";
};
export interface Source {
  type: "GRAMMAR_TOPIC" | "MIXED_GRAMMAR" | "PRACTICE_SET";
  practiceSetId: string | null;
  topicIds: string[];
}
export interface MaterialRef {
  materialKey: string;
  anchor: string | null;
}
export interface Material {
  materialKey: string;
  materialType:
    "AUDIO" | "IMAGE" | "RICH_TEXT" | "CHAT" | "TABLE" | "TRANSCRIPT";
  position: number;
  mediaUrl: string | null;
  body: Record<string, unknown>;
}
export interface PracticeGroup {
  groupSnapshotId: string;
  ordinal: number;
  partNumber: number;
  groupType: string;
  title: string | null;
  speakerCount: number | null;
  materials: Material[];
}
export interface Question {
  snapshotId: string;
  ordinal: number;
  displayNumber: number;
  groupSnapshotId: string | null;
  partNumber: number | null;
  questionKind: string;
  optionDisplay: "TEXT" | "LABEL_ONLY";
  prompt: string | null;
  blankKey: string | null;
  insertSentence: string | null;
  refs: MaterialRef[];
  materials: Material[];
  options: { optionId: string; label: string; body: string | null }[];
}
export interface SavedAnswer {
  selectedOptionId: string | null;
  version: number;
}
export interface ActiveAttempt {
  id: string;
  category: Category;
  attemptMode: "PRACTICE";
  status: AttemptStatus;
  source: Source;
  totalCount: number;
  startedAt: string;
  lastActiveAt: string;
  deadlineAt: string | null;
  groups: PracticeGroup[];
  questions: Question[];
  savedAnswers: Record<string, SavedAnswer>;
}
export interface SaveAnswerInput {
  selectedOptionId: string | null;
  expectedVersion: number;
}
export interface SaveAnswerResponse {
  snapshotId: string;
  selectedOptionId: string | null;
  version: number;
  answeredAt: string | null;
}
export interface ResultSummary {
  totalCount: number;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  accuracyPercent: number;
  listeningCorrect: number | null;
  readingCorrect: number | null;
  partBreakdown: {
    partNumber: number;
    totalCount: number;
    correctCount: number;
    wrongCount: number;
    unansweredCount: number;
  }[];
  submittedAt: string;
  effectiveFinishedAt: string;
  submitReason: "MANUAL" | "TIME_LIMIT";
  durationSeconds: number;
}
export interface AttemptSubmit {
  attemptId: string;
  status: "SUBMITTED";
  result: ResultSummary;
  resultsUrl: string;
}
export interface ReviewQuestion extends Question {
  answer: { selectedOptionId: string | null; isCorrect: boolean };
  review: {
    correctOptionId: string;
    correctOptionLabel: string;
    explanation: string | null;
    evidence: MaterialRef[];
    optionTranscripts: {
      label: string;
      speaker: string | null;
      text: string;
    }[];
    promptTranscript: { speaker: string | null; text: string } | null;
  };
}
export interface AttemptResult {
  id: string;
  category: Category;
  attemptMode: "PRACTICE";
  status: "SUBMITTED";
  source: Source;
  result: ResultSummary;
  groups: (PracticeGroup & { reviewMaterials: Material[] })[];
  questions: ReviewQuestion[];
}
export interface PracticeSet {
  id: string;
  category: Category;
  title: string;
  partNumber: number | null;
  difficulty: "EASY" | "MEDIUM" | "HARD" | null;
  selectionMode: "FIXED" | "DYNAMIC";
  questionCount: number | null;
  groupCount: number;
  timeLimitSeconds: number | null;
}
export interface PracticeSetDetail extends PracticeSet {
  description: string | null;
  partBreakdown: {
    partNumber: number;
    section: string;
    title: string;
    description: string;
    questionCount: number | null;
    groupCount: number | null;
  }[];
}
export interface AttemptHistory {
  id: string;
  category: Category;
  sourceType: Source["type"];
  sourceSetId: string | null;
  topicIds: string[];
  status: AttemptStatus;
  totalCount: number;
  correctCount: number | null;
  score: number | null;
  startedAt: string;
  submittedAt: string | null;
}
