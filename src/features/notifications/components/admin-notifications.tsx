"use client";

import { useCallback, useState } from "react";
import { useAuthSession } from "@/features/auth";
import { ErrorState } from "@/components/error-state";
import { EmptyState } from "@/components/empty-state";
import { Pagination } from "@/components/pagination";
import { useApiResource } from "@/lib/use-api-resource";
import {
  fetchAdminDeliveries,
  fetchAdminReminderHistory,
} from "../lib/notification-client";
import {
  NotificationFiltersForm,
  channelLabels,
  statusLabels,
  typeLabels,
} from "./notification-filters";
import { DeliveryOutcomes, NotificationTime } from "./notification-details";
import { ReminderRules } from "./reminder-rules";
import type { NotificationFilters } from "../types/notification";
import "../styles/notifications.css";

export function AdminNotifications() {
  const { user, isLoading, error, refreshSession } = useAuthSession();
  if (isLoading)
    return <p role="status">Đang kiểm tra quyền quản trị thông báo...</p>;
  if (error) return <ErrorState message={error} onRetry={refreshSession} />;
  if (!user?.roles.includes("SYSTEM_ADMIN"))
    return (
      <div className="glass-card notification-card" role="alert">
        <h1>Quản trị thông báo</h1>
        <p>Chỉ tài khoản có quyền SYSTEM_ADMIN được truy cập chức năng này.</p>
      </div>
    );
  return <AdminContent key={user.id} />;
}
function AdminContent() {
  const [view, setView] = useState<"deliveries" | "rules" | "history">(
    "deliveries"
  );
  return (
    <div className="notification-page">
      <header className="admin-heading">
        <span className="admin-kicker">GIÁM SÁT & NHẮC HỌC</span>
        <h1 className="admin-title">
          Quản trị <em>thông báo</em>
        </h1>
        <p className="admin-description">
          Theo dõi các lần gửi, điều chỉnh quy tắc và tra cứu lịch sử nhắc học.
        </p>
      </header>
      <nav
        className="notification-tabs"
        aria-label="Các mục quản trị thông báo"
      >
        <button
          type="button"
          className="btn-ghost"
          aria-pressed={view === "deliveries"}
          onClick={() => setView("deliveries")}
        >
          Các lần gửi
        </button>
        <button
          type="button"
          className="btn-ghost"
          aria-pressed={view === "rules"}
          onClick={() => setView("rules")}
        >
          Quy tắc
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
      {view === "deliveries" ? (
        <AdminDeliveries />
      ) : view === "rules" ? (
        <ReminderRules />
      ) : (
        <AdminHistory />
      )}
    </div>
  );
}

function AdminDeliveries() {
  const [filters, setFilters] = useState<NotificationFilters>({ page: 0 });
  const load = useCallback(
    (signal: AbortSignal) =>
      fetchAdminDeliveries({ ...filters, size: 20 }, signal),
    [filters]
  );
  const { data, error, isLoading, reload } = useApiResource(load);
  return (
    <section aria-labelledby="admin-deliveries-title" aria-busy={isLoading}>
      <div className="notification-toolbar">
        <h2 id="admin-deliveries-title">Các lần gửi</h2>
        <button
          type="button"
          className="btn-ghost btn-sm"
          disabled={isLoading}
          onClick={reload}
        >
          Tải lại các lần gửi
        </button>
      </div>
      <NotificationFiltersForm
        mode="deliveries"
        busy={isLoading}
        onApply={setFilters}
      />
      {error && (
        <ErrorState message={error} onRetry={reload} variant="inline" />
      )}
      {isLoading ? (
        <p role="status">Đang tải các lần gửi...</p>
      ) : data && !error ? (
        <>
          {data.items.length === 0 ? (
            <EmptyState title="Chưa có lần gửi phù hợp" />
          ) : (
            <ul className="notification-list">
              {data.items.map((item) => (
                <li className="glass-card notification-card" key={item.id}>
                  <div className="notification-meta">
                    <span>{typeLabels[item.type]}</span>
                    <strong>{statusLabels[item.status]}</strong>
                    <span>{channelLabels[item.channel]}</span>
                  </div>
                  <h3>{item.attemptCount} lần thử</h3>
                  <dl className="notification-facts">
                    <div>
                      <dt>Người dùng</dt>
                      <dd>{item.userId}</dd>
                    </div>
                    <div>
                      <dt>Thông báo</dt>
                      <dd>{item.notificationId}</dd>
                    </div>
                    <div>
                      <dt>Mã lần gửi</dt>
                      <dd>{item.id}</dd>
                    </div>
                    <div>
                      <dt>Tạo lúc</dt>
                      <dd>
                        <NotificationTime value={item.createdAt} />
                      </dd>
                    </div>
                    <div>
                      <dt>Cập nhật lúc</dt>
                      <dd>
                        <NotificationTime value={item.updatedAt} />
                      </dd>
                    </div>
                  </dl>
                  {item.lastFailureCode && (
                    <p>Mã lỗi: {item.lastFailureCode}</p>
                  )}
                  {item.nextRetryAt && (
                    <p>
                      Thử lại dự kiến:{" "}
                      <NotificationTime value={item.nextRetryAt} />
                    </p>
                  )}
                  {item.sentAt && (
                    <p>
                      Đã gửi: <NotificationTime value={item.sentAt} />
                    </p>
                  )}
                  {item.finishedAt && (
                    <p>
                      Kết thúc: <NotificationTime value={item.finishedAt} />
                    </p>
                  )}
                  {item.providerMessageId && (
                    <p>Mã nhà cung cấp: {item.providerMessageId}</p>
                  )}
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
            summary={`${data.totalItems} lần gửi`}
          />
        </>
      ) : null}
    </section>
  );
}

function AdminHistory() {
  const [filters, setFilters] = useState<NotificationFilters>({ page: 0 });
  const load = useCallback(
    (signal: AbortSignal) =>
      fetchAdminReminderHistory({ ...filters, size: 20 }, signal),
    [filters]
  );
  const { data, error, isLoading, reload } = useApiResource(load);
  return (
    <section
      aria-labelledby="admin-reminder-history-title"
      aria-busy={isLoading}
    >
      <div className="notification-toolbar">
        <h2 id="admin-reminder-history-title">Lịch sử nhắc học</h2>
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
        mode="adminHistory"
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
                    <strong>{typeLabels[item.type]}</strong>
                    <span>{item.readAt ? "Đã đọc" : "Chưa đọc"}</span>
                    <NotificationTime value={item.createdAt} />
                  </div>
                  <dl className="notification-facts">
                    <div>
                      <dt>Người dùng</dt>
                      <dd>{item.userId}</dd>
                    </div>
                    <div>
                      <dt>Thông báo</dt>
                      <dd>{item.notificationId}</dd>
                    </div>
                    {item.reminderRuleCode && (
                      <div>
                        <dt>Quy tắc</dt>
                        <dd>{item.reminderRuleCode}</dd>
                      </div>
                    )}
                    {item.reminderRuleId && (
                      <div>
                        <dt>UUID quy tắc</dt>
                        <dd>{item.reminderRuleId}</dd>
                      </div>
                    )}
                  </dl>
                  <DeliveryOutcomes deliveries={item.deliveries} />
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
