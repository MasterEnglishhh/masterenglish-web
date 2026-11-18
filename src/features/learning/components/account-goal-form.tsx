"use client";

import { useEffect, useState, type FormEvent } from "react";
import { fieldError, StatusLine, type SaveStatus } from "@/components/save-status";
import { fetchLearningGoal, updateLearningGoal } from "../lib/goal-client";
import { toLocalIsoDate, validateGoalInput } from "../lib/goal-validation";

type Status = SaveStatus;

/** Thẻ mục tiêu học trong trang tài khoản (`/learn/account`). */
export function AccountGoalForm() {
  const [loaded, setLoaded] = useState(false);
  // Không biết đã có mục tiêu hay chưa: không mở form rỗng (dễ lưu đè mục tiêu đang có).
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [targetScore, setTargetScore] = useState("");
  const [dailyMinutes, setDailyMinutes] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  useEffect(() => {
    let active = true;
    void fetchLearningGoal().then((result) => {
      if (!active) return;
      if (!result.success) setLoadError(result.error.message);
      else {
        setLoadError(null);
        if (result.data) {
          setTargetScore(String(result.data.targetScore));
          setDailyMinutes(String(result.data.dailyMinutes));
          setTargetDate(result.data.targetDate ?? "");
        }
      }
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, [reloadToken]);

  function retryLoad() {
    setLoaded(false);
    setLoadError(null);
    setReloadToken((value) => value + 1);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const validation = validateGoalInput({
      targetScore: targetScore === "" ? Number.NaN : Number(targetScore),
      dailyMinutes: dailyMinutes === "" ? Number.NaN : Number(dailyMinutes),
      targetDate,
    });
    if (!validation.ok) {
      const fieldErrors = Object.fromEntries(
        Object.entries(validation.errors).filter(([, message]) => Boolean(message))
      ) as Record<string, string>;
      return setStatus({
        kind: "error",
        error: {
          status: 400,
          message: "Vui lòng kiểm tra lại các trường được đánh dấu.",
          fieldErrors,
        },
      });
    }
    setStatus({ kind: "saving" });
    const result = await updateLearningGoal(validation.value);
    if (!result.success) return setStatus({ kind: "error", error: result.error });
    setTargetScore(String(result.data.targetScore));
    setDailyMinutes(String(result.data.dailyMinutes));
    setTargetDate(result.data.targetDate ?? "");
    setStatus({ kind: "saved", message: "Đã lưu mục tiêu học tập." });
  }

  return (
    <form className="account-card auth-form" onSubmit={onSubmit} noValidate>
      <h2>Mục tiêu học tập</h2>
      {!loaded ? (
        <p role="status">Đang tải mục tiêu...</p>
      ) : loadError ? (
        <div role="alert">
          <p className="account-status account-status-error">{loadError}</p>
          <button className="button button-dark auth-submit" type="button" onClick={retryLoad}>
            Thử lại
          </button>
        </div>
      ) : (
        <>
          <div className="account-row">
            <div className="auth-field">
              <label htmlFor="goal-score">Điểm TOEIC mục tiêu</label>
              <input id="goal-score" type="number" min={10} max={990} step={5} required value={targetScore} onChange={(e) => setTargetScore(e.target.value)} aria-invalid={Boolean(fieldError(status, "targetScore"))} />
              {fieldError(status, "targetScore") && <small className="auth-error" role="alert">{fieldError(status, "targetScore")}</small>}
            </div>
            <div className="auth-field">
              <label htmlFor="goal-minutes">Số phút mỗi ngày</label>
              <input id="goal-minutes" type="number" min={5} max={240} required value={dailyMinutes} onChange={(e) => setDailyMinutes(e.target.value)} aria-invalid={Boolean(fieldError(status, "dailyMinutes"))} />
              {fieldError(status, "dailyMinutes") && <small className="auth-error" role="alert">{fieldError(status, "dailyMinutes")}</small>}
            </div>
          </div>
          <div className="auth-field">
            <label htmlFor="goal-date">Ngày thi dự kiến (không bắt buộc)</label>
            <input id="goal-date" type="date" min={toLocalIsoDate()} value={targetDate} onChange={(e) => setTargetDate(e.target.value)} aria-invalid={Boolean(fieldError(status, "targetDate"))} />
            {fieldError(status, "targetDate") && <small className="auth-error" role="alert">{fieldError(status, "targetDate")}</small>}
          </div>
          <StatusLine status={status} />
          <button className="button button-dark auth-submit" type="submit" disabled={status.kind === "saving" || !targetScore || !dailyMinutes} aria-busy={status.kind === "saving"}>
            {status.kind === "saving" ? "Đang lưu..." : "Lưu mục tiêu"}
          </button>
        </>
      )}
    </form>
  );
}
