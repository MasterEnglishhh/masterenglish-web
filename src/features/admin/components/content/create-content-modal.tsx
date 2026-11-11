"use client";

import { useState } from "react";
import { createDeckDraft, createWordDraft } from "../../lib/admin-client";

interface CreateContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateContentModal({
  isOpen,
  onClose,
  onCreated,
}: CreateContentModalProps) {
  const [contentType, setContentType] = useState<"WORD" | "DECK">("WORD");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Word Form Fields
  const [lemma, setLemma] = useState("");
  const [partOfSpeech, setPartOfSpeech] = useState("NOUN");
  const [cefrLevel, setCefrLevel] = useState("B1");
  const [meaningVi, setMeaningVi] = useState("");
  const [definitionEn, setDefinitionEn] = useState("");
  const [ipa, setIpa] = useState("");
  const [exampleEn, setExampleEn] = useState("");
  const [exampleVi, setExampleVi] = useState("");

  // Deck Form Fields
  const [deckTitle, setDeckTitle] = useState("");
  const [deckDesc, setDeckDesc] = useState("");
  const [deckLevel, setDeckLevel] = useState("B1");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (contentType === "WORD") {
        if (!lemma.trim() || !meaningVi.trim()) {
          setError("Vui lòng nhập đầy đủ Từ vựng và Nghĩa tiếng Việt.");
          setIsSubmitting(false);
          return;
        }

        const res = await createWordDraft({
          lemma: lemma.trim(),
          partOfSpeech,
          cefrLevel,
          meaningVi: meaningVi.trim(),
          definitionEn: definitionEn.trim() || undefined,
          ipa: ipa.trim() || undefined,
          examplesEn: exampleEn.trim() ? [exampleEn.trim()] : undefined,
          examplesVi: exampleVi.trim() ? [exampleVi.trim()] : undefined,
        });

        if (res.success) {
          onCreated();
          onClose();
        } else {
          setError(res.error.message);
        }
      } else {
        if (!deckTitle.trim()) {
          setError("Vui lòng nhập Tiêu đề bộ thẻ Flashcard.");
          setIsSubmitting(false);
          return;
        }

        const res = await createDeckDraft({
          title: deckTitle.trim(),
          description: deckDesc.trim() || undefined,
          level: deckLevel,
        });

        if (res.success) {
          onCreated();
          onClose();
        } else {
          setError(res.error.message);
        }
      }
    } catch {
      setError("Không thể gửi bản thảo. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
      <div className="admin-modal" style={{ maxWidth: 600 }}>
        <div>
          <span className="admin-kicker">SOẠN NỘI DUNG HỌC LIỆU MỚI</span>
          <h2 className="admin-modal-title">Tạo Bản Thảo (Draft v1)</h2>
          <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
            Bản thảo tạo mới sẽ ở trạng thái DRAFT. Sau khi lưu, bạn có thể bấm Thẩm định để nộp duyệt.
          </p>
        </div>

        {error && (
          <div style={{ background: "#fee2e2", border: "1px solid #f87171", color: "#991b1b", padding: "8px 12px", borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            className={contentType === "WORD" ? "btn-3d-lime btn-sm" : "btn-3d-outline btn-sm"}
            onClick={() => setContentType("WORD")}
          >
            Từ vựng (Word)
          </button>
          <button
            type="button"
            className={contentType === "DECK" ? "btn-3d-lime btn-sm" : "btn-3d-outline btn-sm"}
            onClick={() => setContentType("DECK")}
          >
            Bộ thẻ (Flashcard Deck)
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {contentType === "WORD" ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)", display: "block", marginBottom: 4 }}>
                    Từ vựng (Lemma) *
                  </label>
                  <input
                    type="text"
                    required
                    className="admin-search-input"
                    style={{ width: "100%" }}
                    placeholder="ví dụ: persistent"
                    value={lemma}
                    onChange={(e) => setLemma(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)", display: "block", marginBottom: 4 }}>
                    Phiên âm IPA
                  </label>
                  <input
                    type="text"
                    className="admin-search-input"
                    style={{ width: "100%" }}
                    placeholder="ví dụ: /pəˈsɪstənt/"
                    value={ipa}
                    onChange={(e) => setIpa(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)", display: "block", marginBottom: 4 }}>
                    Từ loại
                  </label>
                  <select
                    className="admin-select"
                    style={{ width: "100%" }}
                    value={partOfSpeech}
                    onChange={(e) => setPartOfSpeech(e.target.value)}
                  >
                    <option value="NOUN">Danh từ (NOUN)</option>
                    <option value="VERB">Động từ (VERB)</option>
                    <option value="ADJECTIVE">Tính từ (ADJECTIVE)</option>
                    <option value="ADVERB">Trạng từ (ADVERB)</option>
                    <option value="PREPOSITION">Giới từ (PREPOSITION)</option>
                    <option value="CONJUNCTION">Liên từ (CONJUNCTION)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)", display: "block", marginBottom: 4 }}>
                    Cấp độ CEFR
                  </label>
                  <select
                    className="admin-select"
                    style={{ width: "100%" }}
                    value={cefrLevel}
                    onChange={(e) => setCefrLevel(e.target.value)}
                  >
                    <option value="A1">A1 - Căn bản</option>
                    <option value="A2">A2 - Sơ cấp</option>
                    <option value="B1">B1 - Trung cấp</option>
                    <option value="B2">B2 - Trung cao cấp</option>
                    <option value="C1">C1 - Cao cấp</option>
                    <option value="C2">C2 - Thành thạo</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)", display: "block", marginBottom: 4 }}>
                  Nghĩa tiếng Việt *
                </label>
                <input
                  type="text"
                  required
                  className="admin-search-input"
                  style={{ width: "100%" }}
                  placeholder="ví dụ: Kiên trì, bền bỉ"
                  value={meaningVi}
                  onChange={(e) => setMeaningVi(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)", display: "block", marginBottom: 4 }}>
                  Định nghĩa tiếng Anh
                </label>
                <input
                  type="text"
                  className="admin-search-input"
                  style={{ width: "100%" }}
                  placeholder="ví dụ: Continuing firmly or obstinately in a course of action..."
                  value={definitionEn}
                  onChange={(e) => setDefinitionEn(e.target.value)}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)", display: "block", marginBottom: 4 }}>
                    Ví dụ câu tiếng Anh
                  </label>
                  <input
                    type="text"
                    className="admin-search-input"
                    style={{ width: "100%" }}
                    placeholder="She is a persistent learner."
                    value={exampleEn}
                    onChange={(e) => setExampleEn(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)", display: "block", marginBottom: 4 }}>
                    Dịch nghĩa câu ví dụ
                  </label>
                  <input
                    type="text"
                    className="admin-search-input"
                    style={{ width: "100%" }}
                    placeholder="Cô ấy là một người học kiên trì."
                    value={exampleVi}
                    onChange={(e) => setExampleVi(e.target.value)}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)", display: "block", marginBottom: 4 }}>
                  Tiêu đề bộ thẻ Flashcard *
                </label>
                <input
                  type="text"
                  required
                  className="admin-search-input"
                  style={{ width: "100%" }}
                  placeholder="ví dụ: 600 Từ Vựng TOEIC Căn Bản"
                  value={deckTitle}
                  onChange={(e) => setDeckTitle(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)", display: "block", marginBottom: 4 }}>
                  Mô tả bộ thẻ
                </label>
                <textarea
                  className="admin-search-input"
                  style={{ width: "100%", height: 70, resize: "vertical" }}
                  placeholder="Mô tả nội dung, mục tiêu của bộ thẻ từ vựng..."
                  value={deckDesc}
                  onChange={(e) => setDeckDesc(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)", display: "block", marginBottom: 4 }}>
                  Cấp độ bộ thẻ
                </label>
                <select
                  className="admin-select"
                  style={{ width: "100%" }}
                  value={deckLevel}
                  onChange={(e) => setDeckLevel(e.target.value)}
                >
                  <option value="A1">A1 - Căn bản</option>
                  <option value="A2">A2 - Sơ cấp</option>
                  <option value="B1">B1 - Trung cấp</option>
                  <option value="B2">B2 - Trung cao cấp</option>
                  <option value="C1">C1 - Cao cấp</option>
                </select>
              </div>
            </>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
            <button type="button" className="btn-3d-outline btn-sm" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-3d-lime btn-sm">
              {isSubmitting ? "Đang lưu..." : "Lưu Bản Thảo (Draft)"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
