"use client";

import { useState, type FormEvent } from "react";
import type { LearningGoal } from "../lib/goal-client";
import {
  toLocalIsoDate,
  validateGoalInput,
  type GoalFieldErrors,
} from "../lib/goal-validation";
import type { LearningGoalInput } from "./use-learning-goal";

/**
 * Trạng thái của biểu mẫu sửa mục tiêu: giá trị đang nhập, lỗi từng trường và thao tác gửi.
 * Chưa có mục tiêu thì bắt đầu từ 650 điểm, 30 phút mỗi ngày, không đặt ngày.
 */
export function useGoalForm(
  goal: LearningGoal | null,
  onSave: (input: LearningGoalInput) => Promise<boolean>
) {
  const [targetScore, setTargetScore] = useState<number>(
    goal?.targetScore ?? 650
  );
  const [dailyMinutes, setDailyMinutes] = useState<number>(
    goal?.dailyMinutes ?? 30
  );
  const [targetDate, setTargetDate] = useState<string>(goal?.targetDate ?? "");
  const [errors, setErrors] = useState<GoalFieldErrors>({});
  const todayStr = toLocalIsoDate();

  async function submit(event: FormEvent) {
    event.preventDefault();
    const result = validateGoalInput(
      { targetScore, dailyMinutes, targetDate },
      todayStr
    );
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    // Thành công: hook đóng hộp thoại; thất bại: giữ lại để hiện `serverError`.
    await onSave(result.value);
  }

  return {
    targetScore,
    setTargetScore,
    dailyMinutes,
    setDailyMinutes,
    targetDate,
    setTargetDate,
    errors,
    todayStr,
    submit,
  };
}
