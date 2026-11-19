"use client";

import { useState } from "react";
import { useContentSources } from "../../hooks/use-content-sources";
import { DraftField } from "./draft-field";

/** Chọn nguồn trích dẫn của bản thảo hoặc thêm nguồn mới; nội dung không có nguồn thì không xuất bản được. */
export function SourceSelect({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const { sources, isLoading, error, addSource } = useContentSources();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ title: "", licenseCode: "", attribution: "" });
  const [addError, setAddError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!draft.title.trim() || !draft.licenseCode.trim() || !draft.attribution.trim()) {
      setAddError("Nhập đủ tên nguồn, giấy phép và dòng ghi công.");
      return;
    }
    setSaving(true);
    setAddError(null);
    const res = await addSource({
      title: draft.title.trim(),
      sourceType: "EXTERNAL",
      licenseCode: draft.licenseCode.trim(),
      attribution: draft.attribution.trim(),
    });
    setSaving(false);
    if (res.source) {
      onChange(res.source.id);
      setAdding(false);
      setDraft({ title: "", licenseCode: "", attribution: "" });
    } else setAddError(res.error);
  }

  return (
    <>
      <DraftField label="Nguồn trích dẫn *">
        <select
          className="admin-select field-select"
          value={value}
          disabled={isLoading}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">{isLoading ? "Đang tải nguồn..." : "Chọn nguồn trích dẫn"}</option>
          {sources.map((source) => (
            <option key={source.id} value={source.id}>
              {source.title}
              {source.licenseCode ? ` (${source.licenseCode})` : ""}
            </option>
          ))}
        </select>
      </DraftField>
      {error && (
        <p role="alert" className="form-alert-error">
          {error}
        </p>
      )}
      {!adding ? (
        <button type="button" className="btn-ghost btn-sm" onClick={() => setAdding(true)}>
          Thêm nguồn mới
        </button>
      ) : (
        <fieldset className="admin-source-form">
          <legend className="field-label">Nguồn mới</legend>
          <DraftField label="Tên nguồn *">
            <input className="field-input" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          </DraftField>
          <DraftField label="Giấy phép *">
            <input
              className="field-input"
              placeholder="ví dụ: CC-BY, EDITORIAL_CITATION"
              value={draft.licenseCode}
              onChange={(e) => setDraft({ ...draft, licenseCode: e.target.value })}
            />
          </DraftField>
          <DraftField label="Dòng ghi công *">
            <input className="field-input" value={draft.attribution} onChange={(e) => setDraft({ ...draft, attribution: e.target.value })} />
          </DraftField>
          {addError && (
            <p role="alert" className="form-alert-error">
              {addError}
            </p>
          )}
          <div className="admin-form-actions">
            <button type="button" className="btn-ghost btn-sm" disabled={saving} onClick={() => setAdding(false)}>
              Hủy
            </button>
            <button type="button" className="btn-lime btn-sm" disabled={saving} onClick={() => void save()}>
              {saving ? "Đang lưu..." : "Lưu nguồn"}
            </button>
          </div>
        </fieldset>
      )}
    </>
  );
}
