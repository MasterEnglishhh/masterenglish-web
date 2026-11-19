// Quy chuẩn theo masterenglish-api/docs/identity/CONTRACT.md §2.2 (M01.06).
// Backend là nơi quyết định cuối cùng; các hàm này chỉ giúp báo lỗi sớm và nhất quán.

export const GOAL_LIMITS = {
  minScore: 10,
  maxScore: 990,
  scoreStep: 5,
  minMinutes: 5,
  maxMinutes: 240,
} as const;

export interface GoalValues {
  targetScore: number;
  dailyMinutes: number;
  /** `YYYY-MM-DD` hoặc chuỗi rỗng khi không đặt ngày. */
  targetDate: string;
}

export interface GoalFieldErrors {
  targetScore?: string;
  dailyMinutes?: string;
  targetDate?: string;
}

export type GoalValidation =
  | {
      ok: true;
      value: {
        targetScore: number;
        dailyMinutes: number;
        targetDate: string | null;
      };
    }
  | { ok: false; errors: GoalFieldErrors };

interface DateParts {
  year: number;
  month: number;
  day: number;
}

/** Phân tích `YYYY-MM-DD`; trả `null` nếu không phải một ngày có thật (vd. 2027-02-30). */
export function parseIsoDate(value: string): DateParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const check = new Date(Date.UTC(year, month - 1, day));
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  )
    return null;
  return { year, month, day };
}

/**
 * Ngày hiện tại theo giờ ĐỊA PHƯƠNG, dạng `YYYY-MM-DD`.
 * Không dùng `toISOString()`: nó trả ngày UTC nên lệch một ngày trong 7 giờ đầu
 * của ngày ở Việt Nam (UTC+7).
 */
export function toLocalIsoDate(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Số ngày lịch từ hôm nay (giờ địa phương) đến `targetDate`; âm nếu đã qua. */
export function daysUntil(
  targetDate: string,
  now: Date = new Date()
): number | null {
  const target = parseIsoDate(targetDate);
  const today = parseIsoDate(toLocalIsoDate(now));
  if (!target || !today) return null;
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round(
    (Date.UTC(target.year, target.month - 1, target.day) -
      Date.UTC(today.year, today.month - 1, today.day)) /
      msPerDay
  );
}

/**
 * Hiển thị ngày mục tiêu. Dựng ngày theo thành phần địa phương để không bị lệch
 * một ngày như `new Date("YYYY-MM-DD")` (được hiểu là 00:00 UTC).
 */
export function formatGoalDate(targetDate: string): string {
  const parts = parseIsoDate(targetDate);
  if (!parts) return targetDate;
  return new Date(parts.year, parts.month - 1, parts.day).toLocaleDateString(
    "vi-VN"
  );
}

export function validateGoalInput(
  input: GoalValues,
  today: string = toLocalIsoDate()
): GoalValidation {
  const errors: GoalFieldErrors = {};
  const { targetScore, dailyMinutes } = input;
  const targetDate = input.targetDate.trim();

  if (
    !Number.isInteger(targetScore) ||
    targetScore < GOAL_LIMITS.minScore ||
    targetScore > GOAL_LIMITS.maxScore
  ) {
    errors.targetScore = `Điểm TOEIC phải từ ${GOAL_LIMITS.minScore} đến ${GOAL_LIMITS.maxScore}.`;
  } else if (targetScore % GOAL_LIMITS.scoreStep !== 0) {
    errors.targetScore =
      "Điểm mục tiêu phải chia hết cho 5 (ví dụ: 500, 650, 750).";
  }

  if (
    !Number.isInteger(dailyMinutes) ||
    dailyMinutes < GOAL_LIMITS.minMinutes ||
    dailyMinutes > GOAL_LIMITS.maxMinutes
  ) {
    errors.dailyMinutes = `Thời gian học mỗi ngày phải từ ${GOAL_LIMITS.minMinutes} đến ${GOAL_LIMITS.maxMinutes} phút.`;
  }

  if (targetDate) {
    if (!parseIsoDate(targetDate))
      errors.targetDate = "Ngày mục tiêu không hợp lệ.";
    else if (targetDate < today)
      errors.targetDate = "Ngày mục tiêu phải từ hôm nay trở đi.";
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: { targetScore, dailyMinutes, targetDate: targetDate || null },
  };
}
