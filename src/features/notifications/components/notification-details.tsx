import Link from "next/link";
import { normalizeNotificationTarget } from "../lib/notification-target";
import { channelLabels, statusLabels } from "./notification-filters";
import type { DeliveryOutcome } from "../types/notification";

export function NotificationTarget({
  targetUrl,
}: {
  targetUrl: string | null;
}) {
  if (!targetUrl) return null;
  const safe = normalizeNotificationTarget(targetUrl);
  if (!safe) return null;
  return (
    <Link href={safe} className="btn-ghost btn-sm">
      Mở nội dung
    </Link>
  );
}
export function NotificationTime({ value }: { value: string }) {
  return (
    <time dateTime={value}>{new Date(value).toLocaleString("vi-VN")}</time>
  );
}
export function DeliveryOutcomes({
  deliveries,
}: {
  deliveries: DeliveryOutcome[];
}) {
  return deliveries.length === 0 ? (
    <p>Chưa có lần gửi nào được ghi nhận.</p>
  ) : (
    <ul className="notification-outcomes">
      {deliveries.map((delivery) => (
        <li key={delivery.channel}>
          <strong>
            {channelLabels[delivery.channel]} · {statusLabels[delivery.status]}
          </strong>
          <span>
            {delivery.attemptCount} lần thử
            {delivery.lastFailureCode
              ? ` · Mã lỗi: ${delivery.lastFailureCode}`
              : ""}
          </span>
          {delivery.sentAt && (
            <span>
              Gửi lúc <NotificationTime value={delivery.sentAt} />
            </span>
          )}
          {delivery.finishedAt && (
            <span>
              Kết thúc lúc <NotificationTime value={delivery.finishedAt} />
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
