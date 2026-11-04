interface ProxyContext {
  request: Request;
  env: { BACKEND_URL?: string };
}

function problem(status: number, detail: string): Response {
  return new Response(JSON.stringify({ status, detail }), {
    status,
    headers: {
      "Content-Type": "application/problem+json",
      "Cache-Control": "no-store",
    },
  });
}

/** Keep browser requests on the frontend origin, including all auth cookies. */
export async function onRequest({
  request,
  env,
}: ProxyContext): Promise<Response> {
  const incoming = new URL(request.url);
  let upstream: URL;
  try {
    upstream = new URL(env.BACKEND_URL ?? "");
    // Only an explicitly configured HTTPS origin may receive credentials.
    if (
      upstream.protocol !== "https:" ||
      upstream.username ||
      upstream.password ||
      upstream.pathname !== "/" ||
      upstream.search ||
      upstream.hash ||
      upstream.origin === incoming.origin
    )
      throw new Error("Invalid backend origin");
  } catch {
    return problem(503, "Máy chủ chưa được cấu hình kết nối API.");
  }

  if (incoming.pathname !== "/api" && !incoming.pathname.startsWith("/api/")) {
    return problem(404, "Không tìm thấy API.");
  }
  // URL properties preserve the configured host even if a path contains //.
  upstream.pathname = incoming.pathname;
  upstream.search = incoming.search;
  const headers = new Headers(request.headers);
  for (const key of [...headers.keys()]) {
    if (
      key === "host" ||
      key === "forwarded" ||
      key.startsWith("x-forwarded-") ||
      [
        "connection",
        "content-length",
        "transfer-encoding",
        "if-none-match",
        "if-modified-since",
      ].includes(key)
    ) {
      headers.delete(key);
    }
  }
  headers.set("Cache-Control", "no-store");
  headers.set("X-Forwarded-Proto", "https");
  // Preserve Origin: Spring still checks its exact CORS allowlist and CSRF token.
  try {
    const response = await fetch(upstream, {
      method: request.method,
      headers,
      body: ["GET", "HEAD"].includes(request.method)
        ? undefined
        : await request.arrayBuffer(),
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });
    const resultHeaders = new Headers(response.headers);
    // Never join Set-Cookie: access, refresh and CSRF cookies must stay separate.
    const cookies =
      typeof response.headers.getSetCookie === "function"
        ? response.headers.getSetCookie()
        : (
            response.headers as Headers & { getAll(name: string): string[] }
          ).getAll("Set-Cookie");
    resultHeaders.delete("Set-Cookie");
    for (const cookie of cookies) resultHeaders.append("Set-Cookie", cookie);
    resultHeaders.set("Cache-Control", "no-store");
    resultHeaders.delete("CDN-Cache-Control");
    resultHeaders.delete("Cloudflare-CDN-Cache-Control");
    const location = resultHeaders.get("Location");
    if (location) {
      const redirect = new URL(location, upstream);
      if (redirect.origin === upstream.origin) {
        resultHeaders.set(
          "Location",
          incoming.origin + redirect.pathname + redirect.search + redirect.hash
        );
      }
    }
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: resultHeaders,
    });
  } catch {
    return problem(502, "Không thể kết nối đến máy chủ. Vui lòng thử lại.");
  }
}
