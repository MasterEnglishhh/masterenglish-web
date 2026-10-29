"use client";

import { useState } from "react";
import { toeicAnswer, toeicOptions } from "../data/preview";
import type { ToeicOptionKey } from "../types/toeic";

export function useToeicPractice() {
  const [selected, setSelected] = useState<ToeicOptionKey | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState("");

  function selectOption(value: ToeicOptionKey) {
    if (submitted) return;
    setSelected(value);
    setMessage("");
  }

  function submit() {
    if (!selected) {
      setMessage("Chọn một phương án trước khi xem lời giải.");
      return;
    }
    setSubmitted(true);
    setMessage("");
  }

  function reset() {
    setSelected(null);
    setSubmitted(false);
    setMessage("");
  }

  return {
    options: toeicOptions,
    answer: toeicAnswer,
    selected,
    submitted,
    message,
    isCorrect: selected === toeicAnswer,
    selectOption,
    submit,
    reset,
  };
}
