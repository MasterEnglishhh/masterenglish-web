import { getSafeRedirectUrl } from "@/features/auth";
import { isUuid } from "@/lib/api-validation";

const routes = new Set([
  "/learn",
  "/learn/vocabulary",
  "/learn/review",
  "/learn/grammar",
  "/learn/toeic",
  "/learn/results",
  "/learn/notifications",
  "/learn/account",
  "/learn/practice",
]);

export function normalizeNotificationTarget(
  target: string | null
): string | null {
  const safe = getSafeRedirectUrl(target, "");
  if (!safe) return null;
  const url = new URL(safe, "https://masterenglish.local");
  const pathname = url.pathname.replace(/\/+$/, "");
  if (pathname === "/dashboard") return "/learn";
  if (pathname === "/vocabulary/review") return "/learn/review";
  const topic = /^\/grammar\/topics\/([^/]+)$/.exec(pathname)?.[1];
  if (topic && isUuid(topic))
    return `/learn/grammar?topic=${encodeURIComponent(topic)}`;
  return routes.has(pathname) ? `${pathname}${url.search}${url.hash}` : null;
}
