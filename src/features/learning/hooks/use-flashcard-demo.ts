"use client";

import { useState } from "react";
import { flashcards } from "../data/preview";
import type { FlashcardRating } from "../types/flashcard";

export function useFlashcardDemo() {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [ratings, setRatings] = useState<FlashcardRating[]>([]);
  const finished = index >= flashcards.length;

  function flip() {
    if (!finished) setFlipped(value => !value);
  }

  function rate(value: FlashcardRating) {
    if (!flipped || finished) return;
    setRatings(current => [...current, value]);
    setFlipped(false);
    setIndex(current => current + 1);
  }

  function restart() {
    setRatings([]);
    setIndex(0);
    setFlipped(false);
  }

  return {
    cards: flashcards,
    card: flashcards[index] ?? flashcards[0],
    index,
    flipped,
    ratedCount: ratings.length,
    finished,
    flip,
    rate,
    restart,
  };
}
