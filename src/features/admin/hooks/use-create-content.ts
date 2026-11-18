"use client";

import { useState, type FormEvent } from "react";
import { createDeckDraft, createWordDraft } from "../lib/admin-client";
import type { ContentType } from "../types/content-ops";

export interface WordDraft {
  lemma: string;
  partOfSpeech: string;
  cefrLevel: string;
  meaningVi: string;
  definitionEn: string;
  ipa: string;
  exampleEn: string;
  exampleVi: string;
}

export interface DeckDraft {
  title: string;
  description: string;
  level: string;
}

const emptyWord: WordDraft = {
  lemma: "",
  partOfSpeech: "NOUN",
  cefrLevel: "B1",
  meaningVi: "",
  definitionEn: "",
  ipa: "",
  exampleEn: "",
  exampleVi: "",
};
const emptyDeck: DeckDraft = { title: "", description: "", level: "B1" };

/** Trạng thái và thao tác lưu của hộp thoại "Soạn nội dung mới" (từ vựng hoặc bộ thẻ). */
export function useCreateContent({
  onCreated,
  onClose,
}: {
  onCreated: () => void;
  onClose: () => void;
}) {
  const [contentType, setContentType] = useState<ContentType>("WORD");
  const [word, setWord] = useState(emptyWord);
  const [deck, setDeck] = useState(emptyDeck);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const patchWord = (patch: Partial<WordDraft>) =>
    setWord((previous) => ({ ...previous, ...patch }));
  const patchDeck = (patch: Partial<DeckDraft>) =>
    setDeck((previous) => ({ ...previous, ...patch }));

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (
      contentType === "WORD" &&
      (!word.lemma.trim() || !word.meaningVi.trim())
    )
      return setError("Vui lòng nhập đầy đủ Từ vựng và Nghĩa tiếng Việt.");
    if (contentType === "DECK" && !deck.title.trim())
      return setError("Vui lòng nhập Tiêu đề bộ thẻ Flashcard.");

    setIsSubmitting(true);
    try {
      const res =
        contentType === "WORD"
          ? await createWordDraft({
              lemma: word.lemma.trim(),
              partOfSpeech: word.partOfSpeech,
              cefrLevel: word.cefrLevel,
              meaningVi: word.meaningVi.trim(),
              definitionEn: word.definitionEn.trim() || undefined,
              ipa: word.ipa.trim() || undefined,
              examplesEn: word.exampleEn.trim()
                ? [word.exampleEn.trim()]
                : undefined,
              examplesVi: word.exampleVi.trim()
                ? [word.exampleVi.trim()]
                : undefined,
            })
          : await createDeckDraft({
              title: deck.title.trim(),
              description: deck.description.trim() || undefined,
              level: deck.level,
            });
      if (res.success) {
        onCreated();
        onClose();
      } else {
        setError(res.error.message);
      }
    } catch {
      setError("Không thể gửi bản thảo. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    contentType,
    setContentType,
    word,
    patchWord,
    deck,
    patchDeck,
    isSubmitting,
    error,
    submit,
  };
}
