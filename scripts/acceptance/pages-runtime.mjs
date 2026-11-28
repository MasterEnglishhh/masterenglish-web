import assert from "node:assert/strict";
import { createReadStream, readFileSync } from "node:fs";
import { realpath, stat } from "node:fs/promises";
import { createServer, request as upstreamRequest } from "node:http";
import { createServer as createTlsServer } from "node:https";
import { extname, isAbsolute, relative, resolve, sep } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { pathToFileURL } from "node:url";
import { onRequest } from "../../functions/api/[[path]].ts";
import { ensureLocalTls } from "./local-tls.mjs";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

async function listen(server, port) {
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => {
      server.off("error", reject);
      resolve();
    });
  });
}

async function close(server) {
  if (!server.listening) return;
  await new Promise((resolve) => {
    server.close(resolve);
    server.closeAllConnections();
  });
}

async function staticFile(root, pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  if (
    /[\\:\0]/.test(decoded) ||
    decoded.split("/").some((part) => part.startsWith(".")) ||
    ["/_headers", "/_redirects"].includes(decoded)
  )
    return null;
  const base = resolve(root, "." + decoded);
  for (const candidate of [base, base + ".html", resolve(base, "index.html")]) {
    try {
      const actual = await realpath(candidate);
      const path = relative(root, actual);
      if (isAbsolute(path) || path === ".." || path.startsWith(".." + sep))
        continue;
      const info = await stat(actual);
      if (info.isFile()) return { path: actual, size: info.size };
    } catch (error) {
      if (!["ENOENT", "ENOTDIR"].includes(error.code)) throw error;
    }
  }
  return null;
}

/** Runs exported assets and the real Function in Node; does not emulate the Cloudflare runtime. */
export async function startPagesRuntime({
  staticDirectory = resolve("out"),
  backendUrl = "http://127.0.0.1:28081",
  port = 3001,
  tlsPort = 28443,
  tls = ensureLocalTls(),
} = {}) {
  const root = await realpath(staticDirectory);
  assert(
    (await stat(resolve(root, "index.html"))).isFile(),
    "Build Pages before starting the runtime"
  );
  const backend = new URL(backendUrl);
  assert(
    backend.protocol === "http:" &&
      ["127.0.0.1", "localhost"].includes(backend.hostname) &&
      backend.pathname === "/" &&
      !backend.search &&
      !backend.hash &&
      !backend.username &&
      !backend.password,
    "TLS bridge only accepts an explicit local HTTP backend origin"
  );

  const bridge = createTlsServer(
    { cert: readFileSync(tls.certPath), key: readFileSync(tls.keyPath) },
    (req, res) => {
      const upstream = upstreamRequest(
        {
          hostname: backend.hostname,
          port: backend.port,
          method: req.method,
          path: req.url,
          headers: { ...req.headers, host: backend.host },
          timeout: 30_000,
        },
        (response) => {
          res.writeHead(response.statusCode, response.headers);
          void pipeline(response, res).catch(() => res.destroy());
        }
      );
      upstream.on("timeout", () =>
        upstream.destroy(new Error("Local backend timeout"))
      );
      upstream.on("error", () => {
        if (!res.headersSent) res.writeHead(502);
        res.end();
      });
      req.on("aborted", () => upstream.destroy());
      req.pipe(upstream);
    }
  );
  await listen(bridge, tlsPort);
  const backendOrigin = `https://127.0.0.1:${bridge.address().port}`;

  const server = createServer(async (req, res) => {
    try {
      const origin = `http://127.0.0.1:${server.address().port}`;
      const pathname = req.url.split("?")[0];
      if (pathname === "/api" || pathname.startsWith("/api/")) {
        const headers = new Headers();
        for (let i = 0; i < req.rawHeaders.length; i += 2)
          headers.append(req.rawHeaders[i], req.rawHeaders[i + 1]);
        const request = new Request(new URL(req.url, origin), {
          method: req.method,
          headers,
          ...(["GET", "HEAD"].includes(req.method)
            ? {}
            : { body: Readable.toWeb(req), duplex: "half" }),
        });
        const response = await onRequest({
          request,
          env: { BACKEND_URL: backendOrigin },
        });
        // Adapter nghiệm thu chỉ phục vụ API hữu hạn; đọc xong trước khi ghi header.
        const body =
          req.method === "HEAD" || !response.body
            ? null
            : Buffer.from(await response.arrayBuffer());
        res.statusCode = response.status;
        response.headers.forEach((value, name) => {
          // Node fetch đã giải nén body; không gửi lại metadata của body nén.
          if (
            !["set-cookie", "content-encoding", "content-length"].includes(name)
          )
            res.setHeader(name, value);
        });
        const cookies = response.headers.getSetCookie();
        if (cookies.length) res.setHeader("Set-Cookie", cookies);
        res.end(body);
        return;
      }
      if (!["GET", "HEAD"].includes(req.method)) {
        res.writeHead(405, { Allow: "GET, HEAD" });
        res.end();
        return;
      }
      let file = await staticFile(root, pathname);
      res.statusCode = file ? 200 : 404;
      file ??= await staticFile(root, "/404.html");
      if (!file) {
        res.end("Not found");
        return;
      }
      res.setHeader(
        "Content-Type",
        mimeTypes[extname(file.path)] ?? "application/octet-stream"
      );
      res.setHeader("Content-Length", file.size);
      if (req.method === "HEAD") res.end();
      else await pipeline(createReadStream(file.path), res);
    } catch {
      if (!res.headersSent) res.writeHead(500);
      res.end("Local acceptance runtime failure");
    }
  });
  try {
    await listen(server, port);
  } catch (error) {
    await close(bridge);
    throw error;
  }
  return {
    origin: `http://127.0.0.1:${server.address().port}`,
    backendOrigin,
    close: () => Promise.all([close(server), close(bridge)]),
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const tls = ensureLocalTls();
  assert.equal(
    process.env.NODE_EXTRA_CA_CERTS,
    tls.caPath,
    "Set NODE_EXTRA_CA_CERTS to the generated ca.pem before starting Node"
  );
  const runtime = await startPagesRuntime({ tls });
  console.log(
    JSON.stringify({
      origin: runtime.origin,
      backendOrigin: runtime.backendOrigin,
      runtime:
        "Node adapter for actual Pages Function; not deployed Cloudflare",
    })
  );
  for (const signal of ["SIGINT", "SIGTERM"])
    process.once(signal, () => {
      void runtime.close();
    });
}
