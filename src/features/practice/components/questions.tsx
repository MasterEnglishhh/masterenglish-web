"use client";

import { Materials, materialId } from "./materials";
import type {
  Material,
  MaterialRef,
  PracticeGroup,
  Question,
  ReviewQuestion,
} from "../types/practice";

function References({
  refs,
  question,
  group,
  label,
}: {
  refs: MaterialRef[];
  question: Question;
  group?: PracticeGroup;
  label: string;
}) {
  if (!refs.length) return null;
  return (
    <div className="practice-references">
      <span>{label}: </span>
      {refs.map((ref, i) => {
        const scope = question.materials.some(
          (m) => m.materialKey === ref.materialKey
        )
          ? question.snapshotId
          : (group?.groupSnapshotId ?? question.snapshotId);
        return (
          <a
            key={i}
            href={`#${materialId(scope, ref.materialKey, ref.anchor)}`}
          >
            {ref.materialKey}
            {ref.anchor ? ` / ${ref.anchor}` : ""}
          </a>
        );
      })}
    </div>
  );
}

function QuestionCard({
  question,
  group,
  selected,
  disabled,
  onSelect,
  review,
}: {
  question: Question;
  group?: PracticeGroup;
  selected: string | null;
  disabled?: boolean;
  onSelect?: (id: string, selected: string | null) => void;
  review?: ReviewQuestion;
}) {
  return (
    <article
      className="glass-card practice-question"
      id={`question-${question.snapshotId}`}
    >
      <div className="practice-question-heading">
        <h3>
          Câu {question.displayNumber}
          {question.partNumber ? ` · Part ${question.partNumber}` : ""}
        </h3>
        {review && (
          <strong
            className={
              review.answer.isCorrect ? "practice-correct" : "practice-wrong"
            }
          >
            {review.answer.selectedOptionId === null
              ? "Chưa trả lời"
              : review.answer.isCorrect
                ? "Trả lời đúng"
                : "Chưa đúng"}
          </strong>
        )}
      </div>
      <Materials materials={question.materials} scope={question.snapshotId} />
      {question.prompt && <p className="practice-prompt">{question.prompt}</p>}
      {question.blankKey && (
        <p>
          Chọn đáp án cho chỗ trống <strong>{question.blankKey}</strong>.
        </p>
      )}
      {question.insertSentence && (
        <blockquote className="practice-insert-sentence">
          Câu cần chèn: <strong>{question.insertSentence}</strong>
        </blockquote>
      )}
      <References
        refs={question.refs}
        question={question}
        group={group}
        label="Học liệu tham chiếu"
      />
      <fieldset
        className="practice-options"
        disabled={disabled || Boolean(review)}
      >
        <legend className="sr-only">Đáp án câu {question.displayNumber}</legend>
        {question.options.map((option) => (
          <label
            key={option.optionId}
            className={`practice-option ${selected === option.optionId ? "selected" : ""} ${review?.review.correctOptionId === option.optionId ? "correct" : ""}`}
          >
            <input
              type="radio"
              name={`answer-${question.snapshotId}`}
              checked={selected === option.optionId}
              value={option.optionId}
              onChange={() => onSelect?.(question.snapshotId, option.optionId)}
            />
            <strong>{option.label}</strong>
            <span>{option.body ?? `Phương án ${option.label}`}</span>
            {review?.review.correctOptionId === option.optionId && (
              <small>Đáp án đúng</small>
            )}
          </label>
        ))}
      </fieldset>
      {!review && (
        <button
          type="button"
          className="btn-ghost btn-sm"
          disabled={disabled || selected === null}
          onClick={() => onSelect?.(question.snapshotId, null)}
        >
          Bỏ lựa chọn
        </button>
      )}
      {review && (
        <div className="practice-explanation">
          <h4>Đáp án đúng: {review.review.correctOptionLabel}</h4>
          {review.review.explanation && <p>{review.review.explanation}</p>}
          {review.review.promptTranscript && (
            <p>
              <strong>
                Câu hỏi nghe · {review.review.promptTranscript.speaker}:{" "}
              </strong>
              {review.review.promptTranscript.text}
            </p>
          )}
          {!!review.review.optionTranscripts.length && (
            <>
              <h4>Nội dung các phương án</h4>
              <ul>
                {review.review.optionTranscripts.map((t) => (
                  <li key={t.label}>
                    <strong>
                      {t.label}
                      {t.speaker ? ` · ${t.speaker}` : ""}:{" "}
                    </strong>
                    {t.text}
                  </li>
                ))}
              </ul>
            </>
          )}
          <References
            refs={review.review.evidence}
            question={question}
            group={group}
            label="Dẫn chứng"
          />
        </div>
      )}
    </article>
  );
}

export function Questions({
  groups,
  questions,
  selected = {},
  disabled,
  onSelect,
  review = false,
}: {
  groups: (PracticeGroup & { reviewMaterials?: Material[] })[];
  questions: Question[];
  selected?: Record<string, string | null>;
  disabled?: boolean;
  onSelect?: (id: string, option: string | null) => void;
  review?: boolean;
}) {
  const render = (q: Question, group?: PracticeGroup) => (
    <QuestionCard
      key={q.snapshotId}
      question={q}
      group={group}
      selected={
        review
          ? (q as ReviewQuestion).answer.selectedOptionId
          : (selected[q.snapshotId] ?? null)
      }
      disabled={disabled}
      onSelect={onSelect}
      review={review ? (q as ReviewQuestion) : undefined}
    />
  );
  const grouped = new Map(groups.map((g) => [g.groupSnapshotId, g]));
  const displayed = new Set<string>();
  return (
    <div className="practice-question-list">
      {questions.map((q) => {
        const group = q.groupSnapshotId
          ? grouped.get(q.groupSnapshotId)
          : undefined;
        if (!group) return render(q);
        if (displayed.has(group.groupSnapshotId)) return null;
        displayed.add(group.groupSnapshotId);
        return (
          <section
            key={group.groupSnapshotId}
            className="practice-group"
            aria-label={group.title ?? `Nhóm Part ${group.partNumber}`}
          >
            <div className="glass-card practice-group-material">
              <h2>
                {group.title ??
                  `Part ${group.partNumber} · Nhóm ${group.ordinal}`}
              </h2>
              {group.speakerCount && <p>{group.speakerCount} người nói</p>}
              <Materials
                materials={group.materials}
                scope={group.groupSnapshotId}
              />
              {review && (
                <Materials
                  materials={group.reviewMaterials ?? []}
                  scope={group.groupSnapshotId}
                  review
                />
              )}
            </div>
            {questions
              .filter((item) => item.groupSnapshotId === group.groupSnapshotId)
              .map((item) => render(item, group))}
          </section>
        );
      })}
    </div>
  );
}
