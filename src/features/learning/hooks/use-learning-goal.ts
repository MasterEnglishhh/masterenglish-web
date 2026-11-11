"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchLearningGoal,
  updateLearningGoal,
  type LearningGoalDto,
  type UpdateLearningGoalPayload,
} from "../lib/goal-client";

export function useLearningGoal() {
  const [goal, setGoal] = useState<LearningGoalDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadGoal = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchLearningGoal();
      if (res.success) {
        setGoal(res.data);
      } else {
        setError(res.error.message);
      }
    } catch {
      setError("Không thể tải thông tin mục tiêu học tập.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGoal();
  }, [loadGoal]);

  const saveGoal = async (payload: UpdateLearningGoalPayload): Promise<boolean> => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await updateLearningGoal(payload);
      if (res.success) {
        setGoal(res.data);
        setIsModalOpen(false);
        return true;
      } else {
        setError(res.error.message);
        return false;
      }
    } catch {
      setError("Không thể cập nhật mục tiêu học tập.");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    goal,
    isLoading,
    isSubmitting,
    error,
    isModalOpen,
    setIsModalOpen,
    saveGoal,
    refreshGoal: loadGoal,
  };
}
