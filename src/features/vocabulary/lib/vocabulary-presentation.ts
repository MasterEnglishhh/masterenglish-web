export const partOfSpeechLabels: Record<string, string> = {
  NOUN: "Danh từ",
  VERB: "Động từ",
  ADJECTIVE: "Tính từ",
  ADVERB: "Trạng từ",
  PRONOUN: "Đại từ",
  PREPOSITION: "Giới từ",
  CONJUNCTION: "Liên từ",
  DETERMINER: "Từ hạn định",
  INTERJECTION: "Thán từ",
  NUMERAL: "Số từ",
  PHRASE: "Cụm từ",
};

export function vocabularyPageNumber(value: string | null): number {
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 0 ? number : 0;
}
