"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { RequireAuth } from "@/features/auth";
import { ErrorState } from "@/components/error-state";
import { EmptyState } from "@/components/empty-state";
import { Pagination } from "@/components/pagination";
import { useApiResource } from "@/lib/use-api-resource";
import { useLearnerNotifications } from "../hooks/use-learner-notifications";
import { fetchReminderHistory } from "../lib/notification-client";
import { NotificationFiltersForm, typeLabels } from "./notification-filters";
import {
  DeliveryOutcomes,
  NotificationTarget,
  NotificationTime,
} from "./notification-details";
import type { NotificationFilters } from "../types/notification";
import "../styles/notifications.css";

export function LearnerNotifications() {
  return (
    <RequireAuth>
      <LearnerContent />
    </RequireAuth>
  );
}
function LearnerContent() {
  const [view, setView] = useState<"feed" | "history">("feed");
  return (
    <main className="learning-content inner-page notification-page">
      <header className="notification-heading">
        <span className="eyebrow">NHỊP HỌC CỦA BẠN</span>
        <h1>Thông báo</h1>
        <p>Cập nhật nội dung mới và theo dõi những lời nhắc học của bạn.</p>
        <Link
          href="/learn/account#notification-preferences"
          className="btn-ghost btn-sm"
        >
          Tùy chọn nhận thông báo
        </Link>
      </header>
      <nav className="notification-tabs" aria-label="Các mục thông báo">
        <button
          type="button"
          className="btn-ghost"
          aria-pressed={view === "feed"}
          onClick={() => setView("feed")}
        >
          Hộp thông báo
        </button>
        <button
          type="button"
          className="btn-ghost"
          aria-pressed={view === "history"}
          onClick={() => setView("history")}
        >
          Lịch sử nhắc học
        </button>
      </nav>
      {view === "feed" ? <NotificationFeed /> : <LearnerReminderHistory />}
    </main>
  );
}
function NotificationFeed() {
  const [filters, setFilters] = useState<NotificationFilters>({ page: 0 });
  const {
    data,
    isLoading,
    error,
    reload,
    markRead,
    markAllRead,
    isMutating,
    actionError,
  } = useLearnerNotifications(filters);
  const busy = isLoading || isMutating;
  return (
    <section aria-labelledby="notification-feed-title" aria-busy={busy}>
      <div className="notification-toolbar">
        <h2 id="notification-feed-title">Hộp thông báo</h2>
        <span role="status">
          {isLoading
            ? "Đang cập nhật số chưa đọc..."
            : data
              ? `${data.count} chưa đọc`
              : "Chưa tải được số chưa đọc"}
        </span>
        <div className="notification-actions">
          <button
            className="btn-ghost btn-sm"
            type="button"
            disabled={busy}
            onClick={reload}
          >
            Tải lại
          </button>
          <button
            type="button"
            className="btn-primary btn-sm"
            disabled={busy || !data || data.count === 0}
            onClick={() => void markAllRead()}
          >
            Đánh dấu tất cả đã đọc
          </button>
        </div>
      </div>
      <NotificationFiltersForm mode="feed" busy={busy} onApply={setFilters} />
      {error && (
        <ErrorState message={error} onRetry={reload} variant="inline" />
      )}
      {actionError && <ErrorState message={actionError} variant="inline" />}
      {isLoading ? (
        <p role="status">Đang tải thông báo...</p>
      ) : data && !error ? (
        <>
          {data.feed.items.length === 0 ? (
            <EmptyState title="Chưa có thông báo phù hợp">
              Lời nhắc và cập nhật mới sẽ xuất hiện ở đây.
            </EmptyState>
          ) : (
            <ul className="notification-list">
              {data.feed.items.map((item) => (
                <li className="glass-card notification-card" key={item.id}>
                  <div className="notification-meta">
                    <span>{typeLabels[item.type]}</span>
                    <span>{item.readAt ? "Đã đọc" : "Chưa đọc"}</span>
                    <NotificationTime value={item.createdAt} />
                  </div>
                  <h3>{item.title}</h3>
                  <p className="notification-body">{item.body}</p>
                  <div className="notification-actions">
                    <NotificationTarget targetUrl={item.targetUrl} />
                    {!item.readAt && (
                      <button
                        type="button"
                        className="btn-ghost btn-sm"
                        disabled={busy}
                        onClick={() => void markRead(item.id)}
                        aria-label={`Đánh dấu đã đọc: ${item.title}`}
                      >
                        Đánh dấu đã đọc
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Pagination
            page={(filters.page ?? 0) + 1}
            totalPages={data.feed.totalPages}
            hasNext={data.feed.hasNext}
            onChange={(page) =>
              setFilters((current) => ({ ...current, page: page - 1 }))
            }
            busy={busy}
            summary={`${data.feed.totalItems} thông báo`}
          />
        </>
      ) : null}
    </section>
  );
}
function LearnerReminderHistory() {
  const [filters, setFilters] = useState<NotificationFilters>({ page: 0 });
  const load = useCallback(
    (signal: AbortSignal) =>
      fetchReminderHistory({ ...filters, size: 20 }, signal),
    [filters]
  );
  const { data, isLoading, error, reload } = useApiResource(load);
  return (
    <section aria-labelledby="reminder-history-title" aria-busy={isLoading}>
      <div className="notification-toolbar">
        <h2 id="reminder-history-title">Lịch sử nhắc học</h2>
        <button
          type="button"
          className="btn-ghost btn-sm"
          disabled={isLoading}
          onClick={reload}
        >
          Tải lại lịch sử
        </button>
      </div>
      <NotificationFiltersForm
        mode="learnerHistory"
        busy={isLoading}
        onApply={setFilters}
      />
      {error && (
        <ErrorState message={error} onRetry={reload} variant="inline" />
      )}
      {isLoading ? (
        <p role="status">Đang tải lịch sử nhắc học...</p>
      ) : data && !error ? (
        <>
          {data.items.length === 0 ? (
            <EmptyState title="Chưa có lịch sử nhắc học phù hợp" />
          ) : (
            <ul className="notification-list">
              {data.items.map((item) => (
                <li
                  className="glass-card notification-card"
                  key={item.notificationId}
                >
                  <div className="notification-meta">
                    <span>{typeLabels[item.type]}</span>
                    <NotificationTime value={item.createdAt} />
                  </div>
                  <h3>{item.title}</h3>
                  <p className="notification-body">{item.body}</p>
                  {item.ruleCode && <p>Quy tắc: {item.ruleCode}</p>}
                  <DeliveryOutcomes deliveries={item.deliveries} />
                  <NotificationTarget targetUrl={item.targetUrl} />
                </li>
              ))}
            </ul>
          )}
          <Pagination
            page={(filters.page ?? 0) + 1}
            totalPages={data.totalPages}
            hasNext={data.hasNext}
            onChange={(page) =>
              setFilters((current) => ({ ...current, page: page - 1 }))
            }
            busy={isLoading}
            summary={`${data.totalItems} lời nhắc`}
          />
        </>
      ) : null}
    </section>
  );
}
