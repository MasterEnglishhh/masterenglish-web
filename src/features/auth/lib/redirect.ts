/**
 * Validates and sanitizes a redirect target to prevent open redirect vulnerabilities.
 * Ensures the target is a relative internal path starting with a single '/'
 * and prevents protocol-relative paths ('//') or backslash tricks ('/\\').
 */
export function getSafeRedirectUrl(
  target: string | null | undefined,
  fallback = "/learn"
): string {
  if (!target || typeof target !== "string") {
    return fallback;
  }

  const trimmed = target.trim();

  // Must start with exactly one forward slash and not contain backslashes or double slashes
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.includes("\\")
  ) {
    return fallback;
  }

  // Prevent redirect loops back to auth pages
  const isAuthPath = (path: string) =>
    trimmed === path || trimmed.startsWith(`${path}?`);

  if (
    isAuthPath("/login") ||
    isAuthPath("/register") ||
    isAuthPath("/forgot-password") ||
    isAuthPath("/dang-nhap") ||
    isAuthPath("/dang-ky") ||
    isAuthPath("/quen-mat-khau")
  ) {
    return fallback;
  }

  return trimmed;
}
