import { requestJson } from "../../../lib/http.ts";
import { toUserResult, type UserResult } from "../../../lib/user-result.ts";
import { isRecord } from "../../../lib/api-validation.ts";

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
const isGoal = (v: unknown) => isRecord(v) && typeof v.targetScore === "number" && Number.isFinite(v.targetScore)
  && typeof v.dailyMinutes === "number" && Number.isFinite(v.dailyMinutes)
  && (v.targetDate === null || (typeof v.targetDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v.targetDate) && Number.isFinite(Date.parse(v.targetDate))));

/** Resolves to `null` data when the learner has not set a goal yet (404). */
export async function fetchLearningGoal(): Promise<
  GoalResult<LearningGoal | null>
> {
  const result = toUserResult(
    await requestJson<LearningGoal>(GOAL_PATH, { validate: isGoal }),
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
      validate: isGoal,
      body: {
        targetScore: goal.targetScore,
        dailyMinutes: goal.dailyMinutes,
        targetDate: goal.targetDate || null,
      },
    }),
    fieldLabels
  );
}
