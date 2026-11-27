import type { PageResponse } from "./http.ts";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function isPageResponse(value: unknown, isItem: (item: unknown) => boolean = () => true): value is PageResponse<unknown> {
  return isRecord(value) && Array.isArray(value.items) && value.items.every(isItem)
    && [value.page, value.size, value.totalItems, value.totalPages].every((n) => typeof n === "number" && Number.isSafeInteger(n) && n >= 0)
    && typeof value.hasNext === "boolean";
}
