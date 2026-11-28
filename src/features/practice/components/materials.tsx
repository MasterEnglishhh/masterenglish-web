"use client";

import { Fragment, useState, type ReactNode } from "react";
import type { Material } from "../types/practice";
const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const string = (v: unknown) => (typeof v === "string" ? v : "");
export const materialId = (
  scope: string,
  key: string,
  anchor?: string | null
) =>
  ["material", scope, key, ...(anchor ? [anchor] : [])]
    .map(encodeURIComponent)
    .join("-");

function Inlines({ nodes }: { nodes: unknown }) {
  if (!Array.isArray(nodes)) return null;
  return nodes.map((node, i) => {
    if (!record(node)) return null;
    if (node.type === "line_break") return <br key={i} />;
    if (node.type === "blank")
      return (
        <span
          key={i}
          className="material-blank"
          aria-label={`Chỗ trống ${string(node.blank_key)}`}
        >
          ___ ({string(node.blank_key)})
        </span>
      );
    if (node.type === "insert")
      return (
        <strong key={i} className="material-insert">
          [{typeof node.position === "number" ? node.position : "?"}]
        </strong>
      );
    if (node.type !== "text") return null;
    let content: ReactNode = string(node.text);
    if (Array.isArray(node.marks)) {
      if (node.marks.includes("BOLD")) content = <strong>{content}</strong>;
      if (node.marks.includes("ITALIC")) content = <em>{content}</em>;
      if (node.marks.includes("UNDERLINE")) content = <u>{content}</u>;
    }
    return <Fragment key={i}>{content}</Fragment>;
  });
}

function Media({ material }: { material: Material }) {
  const [failed, setFailed] = useState(false);
  const [revision, setRevision] = useState(0);
  if (!material.mediaUrl)
    return <p role="status">Học liệu chưa có đường dẫn phát.</p>;
  return (
    <>
      {material.materialType === "AUDIO" ? (
        <>
          {string(material.body.directions_text) && (
            <p>{string(material.body.directions_text)}</p>
          )}
          <audio
            key={revision}
            controls
            preload="none"
            src={material.mediaUrl}
            onError={() => setFailed(true)}
            aria-label="Nghe học liệu"
          />
        </>
      ) : (
        <>
          {/* The authenticated API redirects to short-lived media; native img preserves this flow. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={revision}
            src={material.mediaUrl}
            alt={string(material.body.alt_text)}
            loading="lazy"
            onError={() => setFailed(true)}
          />
        </>
      )}
      {failed && (
        <div role="alert" className="error-state">
          <span>
            Chưa tải được học liệu. Dịch vụ lưu trữ có thể chưa khả dụng.
          </span>
          <button
            className="btn-ghost btn-sm"
            onClick={() => {
              setFailed(false);
              setRevision((v) => v + 1);
            }}
          >
            Tải lại học liệu
          </button>
        </div>
      )}
    </>
  );
}

function Body({ material, scope }: { material: Material; scope: string }) {
  const body = material.body;
  if (material.materialType === "AUDIO" || material.materialType === "IMAGE")
    return <Media material={material} />;
  if (material.materialType === "TABLE")
    return (
      <div
        className="material-table"
        tabIndex={0}
        role="region"
        aria-label={string(body.title) || "Bảng học liệu"}
      >
        <table>
          <caption>{string(body.title)}</caption>
          <thead>
            <tr>
              {Array.isArray(body.headers) &&
                body.headers.map((h, i) => (
                  <th key={i} scope="col">
                    {string(h)}
                  </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {Array.isArray(body.rows) &&
              body.rows.map((row, i) => (
                <tr key={i}>
                  {Array.isArray(row) &&
                    row.map((cell, j) => <td key={j}>{string(cell)}</td>)}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    );
  if (material.materialType === "CHAT")
    return (
      <>
        <h4>{string(body.title) || "Đoạn hội thoại"}</h4>
        <ol className="material-chat">
          {Array.isArray(body.messages) &&
            body.messages.map(
              (message, i) =>
                record(message) && (
                  <li
                    key={i}
                    id={materialId(
                      scope,
                      material.materialKey,
                      string(message.anchor)
                    )}
                  >
                    <strong>{string(message.author)}</strong>{" "}
                    <small>{string(message.time)}</small>
                    <p>{string(message.text)}</p>
                  </li>
                )
            )}
        </ol>
      </>
    );
  if (material.materialType === "TRANSCRIPT")
    return (
      <>
        <h4>Bản chép lời</h4>
        {Array.isArray(body.segments) &&
          body.segments.map(
            (segment, i) =>
              record(segment) && (
                <p key={i}>
                  {segment.type === "speech" ? (
                    <>
                      <strong>{string(segment.speaker)}: </strong>
                      {string(segment.text)}
                    </>
                  ) : segment.type === "pause" ? (
                    <em>
                      Nghỉ{" "}
                      {typeof segment.seconds === "number"
                        ? segment.seconds
                        : ""}{" "}
                      giây
                    </em>
                  ) : null}
                </p>
              )
          )}
      </>
    );
  return (
    <>
      {string(body.title) && <h4>{string(body.title)}</h4>}
      {record(body.header) && (
        <dl className="material-header">
          {Object.entries(body.header).map(([key, value]) => (
            <div key={key}>
              <dt>
                {(
                  {
                    from: "Từ",
                    to: "Đến",
                    cc: "Cc",
                    subject: "Tiêu đề",
                    date: "Ngày",
                  } as Record<string, string>
                )[key] ?? key}
              </dt>
              <dd>{string(value)}</dd>
            </div>
          ))}
        </dl>
      )}
      {Array.isArray(body.blocks) &&
        body.blocks.map((block, i) => {
          if (!record(block)) return null;
          if (block.type === "heading")
            return (
              <h4 key={i}>
                <Inlines nodes={block.inlines} />
              </h4>
            );
          if (block.type === "paragraph")
            return (
              <p key={i}>
                <Inlines nodes={block.inlines} />
              </p>
            );
          if (block.type === "list" && Array.isArray(block.items)) {
            const items = block.items.map(
              (item, j) =>
                record(item) && (
                  <li key={j}>
                    <Inlines nodes={item.inlines} />
                  </li>
                )
            );
            return block.ordered ? (
              <ol key={i}>{items}</ol>
            ) : (
              <ul key={i}>{items}</ul>
            );
          }
          return null;
        })}
    </>
  );
}

export function Materials({
  materials,
  scope,
  review = false,
}: {
  materials: Material[];
  scope: string;
  review?: boolean;
}) {
  return (
    <div className="practice-materials">
      {materials
        .filter((m) => review || m.materialType !== "TRANSCRIPT")
        .toSorted((a, b) => a.position - b.position)
        .map((m) => (
          <section
            className="practice-material"
            id={materialId(scope, m.materialKey)}
            key={m.materialKey}
            aria-label={`Học liệu ${m.materialKey}`}
          >
            <Body material={m} scope={scope} />
            {typeof m.body.caption === "string" && (
              <p className="material-caption">{m.body.caption}</p>
            )}
          </section>
        ))}
    </div>
  );
}
