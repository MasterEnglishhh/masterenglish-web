import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { fetchCsrfToken, postAuth } from "./session.ts";

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("auth transport never replays a password after a redirect", async () => {
  let leakedRequests = 0;
  const server = createServer((req, res) => {
    if (req.url === "/api/v1/auth/csrf") {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ headerName: "X-XSRF-TOKEN", token: "csrf" }));
    } else if (req.url === "/api/v1/auth/login") {
      res.writeHead(307, { Location: "/collect" });
      res.end();
    } else {
      leakedRequests++;
      res.end("{}");
    }
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const address = server.address();
    assert.ok(address && typeof address === "object");
    const origin = `http://127.0.0.1:${address.port}`;
    globalThis.fetch = (path, init) =>
      originalFetch(new URL(String(path), origin), init);
    await assert.rejects(postAuth("login", { password: "private" }));
    assert.equal(leakedRequests, 0);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    );
  }
});

test("CSRF bootstrap rejects an unexpected header name", async () => {
  globalThis.fetch = async () =>
    Response.json({ headerName: "Content-Type", token: "text/plain" });
  assert.equal(await fetchCsrfToken(), null);
});
