"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchLearningGoal,
  updateLearningGoal,
  type LearningGoal,
} from "@/features/auth/lib/account-client";

export interface LearningGoalInput {
  targetScore: number;
  dailyMinutes: number;
  targetDate: string | null;
}

export function useLearningGoal() {
  const [goal, setGoal] = useState<LearningGoal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Lỗi TẢI (không biết đã có mục tiêu hay chưa) khác lỗi LƯU (hiện trong hộp thoại).
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const submitting = useRef(false);

  useEffect(() => {
    let active = true;
    // Trạng thái đang tải ban đầu là `true`; `refreshGoal` đặt lại trước khi tăng token.
    void fetchLearningGoal().then((result) => {
      if (!active) return;
      if (result.success) {
        setGoal(result.data);
        setLoadError(null);
      } else {
        setLoadError(result.error.message);
      }
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, [reloadToken]);

  const refreshGoal = useCallback(() => {
    setIsLoading(true);
    setLoadError(null);
    setReloadToken((value) => value + 1);
  }, []);

  const openModal = useCallback(() => {
    setSaveError(null);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setSaveError(null);
    setIsModalOpen(false);
  }, []);

  const saveGoal = useCallback(
    async (input: LearningGoalInput): Promise<boolean> => {
      if (submitting.current) return false; // chống bấm đúp khi yêu cầu đang bay
      submitting.current = true;
      setIsSubmitting(true);
      setSaveError(null);
      const result = await updateLearningGoal(input);
      submitting.current = false;
      setIsSubmitting(false);
      if (result.success) {
        setGoal(result.data);
        setIsModalOpen(false);
        return true;
      }
      setSaveError(result.error.message);
      return false;
    },
    []
  );

  return {
    goal,
    isLoading,
    loadError,
    isSubmitting,
    saveError,
    isModalOpen,
    openModal,
    closeModal,
    saveGoal,
    refreshGoal,
  };
}
