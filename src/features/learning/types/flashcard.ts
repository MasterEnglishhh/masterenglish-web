export type Flashcard = {
  word: string;
  type: string;
  ipa: string;
  meaning: string;
  example: string;
  translation: string;
};

export type FlashcardRating = "Quên" | "Khó" | "Đã nhớ";
