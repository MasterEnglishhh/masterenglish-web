"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type {
  RatingType,
  ReviewRequest,
  SessionSummary,
  WordSenseCardDto,
} from "../types/vocabulary";
import {
  saveWordSense,
  unsaveWordSense,
  submitReview,
} from "../lib/vocabulary-client";

export interface UseVocabularyPracticeOptions {
  cards: WordSenseCardDto[];
  onCardReviewed?: (updatedCard: WordSenseCardDto) => void;
}
const emptySummary = (): SessionSummary => ({
  totalReviewed: 0,
  againCount: 0,
  hardCount: 0,
  goodCount: 0,
});
const cardKey = (card: WordSenseCardDto) =>
  [card.deckRevisionId, card.wordRevisionId, card.wordSenseId].join(":");

export function useVocabularyPractice({
  cards,
  onCardReviewed,
}: UseVocabularyPracticeOptions) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updates, setUpdates] = useState<Record<string, WordSenseCardDto>>({});
  const [summary, setSummary] = useState<SessionSummary>(emptySummary);
  const [previewOnly, setPreviewOnly] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [requiresReload, setRequiresReload] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const pendingRequest = useRef<ReviewRequest | null>(null);
  const busy = useRef(false);
  const saving = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      alive.current = false;
      controller.current?.abort();
      clearInterval(timer);
    };
  }, []);
  // Derive cards from props and overlay confirmed changes, rather than capturing an empty initial array.
  const localCards = cards.map((card) => updates[cardKey(card)] ?? card);
  const currentCard = localCards[currentIndex] ?? null;
  const isFinished = localCards.length > 0 && currentIndex >= localCards.length;
  const due =
    !currentCard?.progress || Date.parse(currentCard.progress.dueAt) <= now;
  const canRate = !!currentCard && !previewOnly && due && !requiresReload;

  const flip = useCallback(() => {
    if (!busy.current) setFlipped((value) => !value);
  }, []);
  const toggleSave = useCallback(async () => {
    if (!currentCard || busy.current || saving.current) return;
    saving.current = true;
    setIsSaving(true);
    setError(null);
    const updated = { ...currentCard, isSaved: !currentCard.isSaved };
    controller.current = new AbortController();
    const result = updated.isSaved
      ? await saveWordSense(currentCard.wordSenseId, controller.current.signal)
      : await unsaveWordSense(
          currentCard.wordSenseId,
          controller.current.signal
        );
    if (alive.current) {
      if (result.success)
        setUpdates((previous) => ({
          ...previous,
          [cardKey(currentCard)]: updated,
        }));
      else setError(result.error.message);
      setIsSaving(false);
    }
    saving.current = false;
  }, [currentCard]);

  const rate = useCallback(
    async (rating: RatingType) => {
      if (
        !currentCard ||
        busy.current ||
        saving.current ||
        requiresReload ||
        (!pendingRequest.current && (!flipped || !canRate))
      )
        return;
      busy.current = true;
      setIsPending(true);
      setError(null);
      // A response may have been lost after commit: freeze BOTH key and entire payload until reconciled.
      const payload = pendingRequest.current ?? {
        wordSenseId: currentCard.wordSenseId,
        sourceWordId: currentCard.wordId,
        sourceRevisionId: currentCard.wordRevisionId,
        deckId: currentCard.deckId,
        deckRevisionId: currentCard.deckRevisionId,
        rating,
        reviewRequestId: crypto.randomUUID(),
        expectedProgressVersion: currentCard.progress?.version ?? null,
      };
      pendingRequest.current = payload;
      controller.current = new AbortController();
      const result = await submitReview(payload, controller.current.signal);
      if (alive.current) {
        if (result.success) {
          const data = result.data;
          const updated: WordSenseCardDto = {
            ...currentCard,
            progress: {
              repetitions: data.repetitions,
              intervalDays: data.intervalDays,
              easeFactor: data.easeFactor,
              dueAt: data.nextDueAt,
              version: data.progressVersion,
            },
          };
          setUpdates((previous) => ({
            ...previous,
            [cardKey(currentCard)]: updated,
          }));
          onCardReviewed?.(updated);
          setSummary((previous) => ({
            totalReviewed: previous.totalReviewed + 1,
            againCount:
              previous.againCount + (payload.rating === "AGAIN" ? 1 : 0),
            hardCount: previous.hardCount + (payload.rating === "HARD" ? 1 : 0),
            goodCount: previous.goodCount + (payload.rating === "GOOD" ? 1 : 0),
          }));
          pendingRequest.current = null;
          setUncertain(false);
          setFlipped(false);
          setCurrentIndex((index) => index + 1);
        } else {
          setError(result.error.message);
          const unknownOutcome =
            result.error.status === 0 || result.error.status >= 500;
          setUncertain(unknownOutcome);
          if (!unknownOutcome) {
            pendingRequest.current = null;
            setRequiresReload(true);
          }
        }
        setIsPending(false);
      }
      busy.current = false;
    },
    [currentCard, flipped, canRate, requiresReload, onCardReviewed]
  );

  const retry = useCallback(() => {
    if (pendingRequest.current) return rate(pendingRequest.current.rating);
  }, [rate]);
  const restart = useCallback(() => {
    if (busy.current || pendingRequest.current) return;
    setCurrentIndex(0);
    setFlipped(false);
    setError(null);
    setSummary(emptySummary());
    setPreviewOnly(true); // Browsing confirmed cards never advances SRS again.
  }, []);
  const nextPreview = useCallback(() => {
    if (busy.current || pendingRequest.current || canRate || requiresReload)
      return;
    setCurrentIndex((index) => index + 1);
    setFlipped(false);
    setError(null);
  }, [canRate, requiresReload]);

  return {
    currentIndex,
    totalCards: localCards.length,
    currentCard,
    flipped,
    isPending,
    isSaving,
    error,
    isFinished,
    summary,
    flip,
    toggleSave,
    rate,
    retry,
    restart,
    canRate,
    uncertain,
    requiresReload,
    previewOnly,
    nextPreview,
  };
}
