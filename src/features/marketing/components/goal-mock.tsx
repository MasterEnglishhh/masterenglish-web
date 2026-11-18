"use client";

import { useId, useState } from "react";
import { GOAL_LIMITS } from "../data/content";
import { SampleTag } from "@/components/sample-tag";

/** Bản mô phỏng form mục tiêu cá nhân, đúng ba trường và giới hạn của form thật. Không lưu gì. */
export function GoalMock() {
  const id = useId();
  const [score, setScore] = useState(650);
  const [minutes, setMinutes] = useState(30);
  const [date, setDate] = useState("2027-03-15");

  return (
    <div className="lp-goalmock">
      <SampleTag />
      <label htmlFor={`${id}-score`}>
        Điểm TOEIC mục tiêu <output>{score}</output>
      </label>
      <input
        id={`${id}-score`}
        type="range"
        min={GOAL_LIMITS.minScore}
        max={GOAL_LIMITS.maxScore}
        step={GOAL_LIMITS.stepScore}
        value={score}
        onChange={(e) => setScore(Number(e.target.value))}
      />
      <label htmlFor={`${id}-min`}>
        Số phút mỗi ngày <output>{minutes}</output>
      </label>
      <input
        id={`${id}-min`}
        type="range"
        min={GOAL_LIMITS.minMinutes}
        max={GOAL_LIMITS.maxMinutes}
        step={5}
        value={minutes}
        onChange={(e) => setMinutes(Number(e.target.value))}
      />
      <label htmlFor={`${id}-date`}>Ngày thi dự kiến</label>
      <input id={`${id}-date`} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
    </div>
  );
}
