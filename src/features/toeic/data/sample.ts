import type { ToeicOption, ToeicOptionKey } from "../types/toeic";

export const toeicOptions = [
  { key: "A", text: "complete" },
  { key: "B", text: "completed" },
  { key: "C", text: "completing" },
  { key: "D", text: "completion" },
] as const satisfies readonly ToeicOption[];

export const toeicAnswer: ToeicOptionKey = "B";
