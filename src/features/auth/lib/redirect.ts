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
    trimmed.includes("\\") ||
    /[\u0000-\u0020\u007f]/.test(trimmed)
  ) {
    return fallback;
  }

  let url: URL;
  let pathname: string;
  try {
    url = new URL(trimmed, "https://masterenglish.local");
    pathname = decodeURIComponent(url.pathname).replace(/\/+$/, "");
  } catch {
    return fallback;
  }
  if (
    url.origin !== "https://masterenglish.local" ||
    pathname.startsWith("//") ||
    pathname.includes("\\")
  ) {
    return fallback;
  }

  // Compare normalized paths, including hash and trailing-slash variants.
  const isAuthPath = (path: string) => pathname === path;

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

  return `${url.pathname}${url.search}${url.hash}`;
}
