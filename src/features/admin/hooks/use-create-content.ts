"use client";

import { useState, type FormEvent } from "react";
import { createDeckDraft, createWordDraft } from "../lib/admin-client";
import type { PublishedSense } from "../lib/content-lookup-client";
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
  canCreateDeck,
}: {
  onCreated: () => void;
  onClose: () => void;
  canCreateDeck: boolean;
}) {
  const [selectedType, setContentType] = useState<ContentType>("WORD");
  const contentType = canCreateDeck ? selectedType : "WORD";
  const [word, setWord] = useState(emptyWord);
  const [deck, setDeck] = useState(emptyDeck);
  const [sourceId, setSourceId] = useState("");
  const [deckSenses, setDeckSenses] = useState<PublishedSense[]>([]);
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
    // Nội dung không có nguồn trích dẫn thì không xuất bản được, và bản thảo không thêm nguồn sau được.
    if (!sourceId) return setError("Vui lòng chọn hoặc thêm nguồn trích dẫn.");
    if (contentType === "DECK" && deckSenses.length === 0)
      return setError("Vui lòng chọn ít nhất một thẻ (nghĩa từ đã xuất bản) cho bộ.");

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
              sourceId,
            })
          : await createDeckDraft({
              title: deck.title.trim(),
              description: deck.description.trim() || undefined,
              level: deck.level,
              wordSenseIds: deckSenses.map((sense) => sense.senseId),
              sourceId,
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
    setContentType: (type: ContentType) => {
      if (type === "WORD" || canCreateDeck) setContentType(type);
    },
    word,
    patchWord,
    deck,
    patchDeck,
    sourceId,
    setSourceId,
    deckSenses,
    addSense: (sense: PublishedSense) =>
      setDeckSenses((previous) =>
        previous.some((item) => item.senseId === sense.senseId) ? previous : [...previous, sense]
      ),
    removeSense: (senseId: string) =>
      setDeckSenses((previous) => previous.filter((item) => item.senseId !== senseId)),
    isSubmitting,
    error,
    submit,
  };
}
