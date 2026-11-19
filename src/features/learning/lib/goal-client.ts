import { requestJson } from "../../../lib/http.ts";
import { toUserResult, type UserResult } from "../../../lib/user-result.ts";

export interface LearningGoal {
  targetScore: number;
  dailyMinutes: number;
  targetDate: string | null;
  updatedAt?: string;
}

export type GoalResult<T> = UserResult<T>;

const fieldLabels: Record<string, string> = {
  targetScore: "Điểm mục tiêu từ 10 đến 990.",
  dailyMinutes: "Số phút mỗi ngày từ 5 đến 240.",
  targetDate: "Ngày mục tiêu không hợp lệ.",
};

const GOAL_PATH = "/api/v1/users/me/goal";

/** Resolves to `null` data when the learner has not set a goal yet (404). */
export async function fetchLearningGoal(): Promise<
  GoalResult<LearningGoal | null>
> {
  const result = toUserResult(
    await requestJson<LearningGoal>(GOAL_PATH),
    fieldLabels
  );
  if (!result.success && result.error.status === 404)
    return { success: true, data: null };
  return result;
}

export async function updateLearningGoal(
  goal: LearningGoal
): Promise<GoalResult<LearningGoal>> {
  return toUserResult(
    await requestJson<LearningGoal>(GOAL_PATH, {
      method: "PUT",
      body: {
        targetScore: goal.targetScore,
        dailyMinutes: goal.dailyMinutes,
        targetDate: goal.targetDate || null,
      },
    }),
    fieldLabels
  );
}
