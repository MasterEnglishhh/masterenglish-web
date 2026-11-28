import assert from "node:assert/strict";
import { once } from "node:events";
import { createHash, X509Certificate } from "node:crypto";
import {
  mkdtemp,
  mkdir,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { createServer, request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { gzipSync } from "node:zlib";
import test from "node:test";
import { ensureLocalTls } from "../scripts/acceptance/local-tls.mjs";

function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const transport = url.startsWith("https:") ? httpsRequest : httpRequest;
    const req = transport(url, options, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () =>
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: Buffer.concat(chunks).toString(),
        })
      );
      res.on("error", reject);
    });
    req.on("error", reject);
    req.end(options.body);
  });
}

test(
  "local Pages runtime serves export safely and executes the real Function over trusted TLS",
  { timeout: 30_000 },
  async (t) => {
    const directory = await mkdtemp(join(tmpdir(), "masterenglish-pages-"));
    t.after(() => rm(directory, { recursive: true, force: true }));
    const tls = ensureLocalTls(join(directory, "tls"));
    assert.deepEqual(ensureLocalTls(join(directory, "tls")), tls);
    const leaf = new X509Certificate(await readFile(tls.certPath));
    const ca = new X509Certificate(await readFile(tls.caPath));
    assert.equal(leaf.checkIP("127.0.0.1"), "127.0.0.1");
    assert.equal(leaf.checkHost("localhost"), "localhost");
    assert.equal(leaf.verify(ca.publicKey), true);
    assert.equal(
      tls.spkiSha256,
      createHash("sha256")
        .update(leaf.publicKey.export({ type: "spki", format: "der" }))
        .digest("base64")
    );

    const root = join(directory, "out");
    await mkdir(join(root, ".audit"), { recursive: true });
    await writeFile(join(root, "index.html"), "home");
    await writeFile(join(root, "login.html"), "login");
    await writeFile(join(root, "404.html"), "missing");
    await writeFile(join(root, "app.js"), "export default 1;");
    await writeFile(join(root, ".audit", "secret.txt"), "private");
    await writeFile(join(directory, "outside.txt"), "private");
    await symlink(directory, join(root, "escape"), "junction");

    const received = [];
    // Transport fixture only: acceptance E2E still uses the seeded application backend.
    const backend = createServer(async (req, res) => {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      received.push(req.url);
      if (req.url === "/api/broken-stream") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.write('{"incomplete":');
        setTimeout(() => res.destroy(), 20);
        return;
      }
      if (req.url === "/api/compressed") {
        res.writeHead(200, {
          "Content-Type": "application/json",
          "Content-Encoding": "gzip",
        });
        res.end(gzipSync('{"compressed":true}'));
        return;
      }
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Set-Cookie": [
          "one=1; Path=/; HttpOnly",
          "two=2; Path=/; SameSite=Lax",
        ],
      });
      res.end(
        JSON.stringify({
          method: req.method,
          body: Buffer.concat(chunks).toString(),
          origin: req.headers.origin,
          csrf: req.headers["x-xsrf-token"],
          proto: req.headers["x-forwarded-proto"],
        })
      );
    });
    backend.listen(0, "127.0.0.1");
    await once(backend, "listening");
    t.after(
      () =>
        new Promise((resolve) => {
          backend.close(resolve);
          backend.closeAllConnections();
        })
    );

    const moduleUrl = new URL(
      "../scripts/acceptance/pages-runtime.mjs",
      import.meta.url
    ).href;
    const code = `
    import { startPagesRuntime } from ${JSON.stringify(moduleUrl)};
    const runtime = await startPagesRuntime(JSON.parse(process.env.PAGES_RUNTIME_TEST_OPTIONS));
    process.on("message", async () => { await runtime.close(); process.disconnect(); });
    process.send({ origin: runtime.origin, backendOrigin: runtime.backendOrigin });
  `;
    const child = spawn(
      process.execPath,
      ["--input-type=module", "--eval", code],
      {
        env: {
          ...process.env,
          NODE_EXTRA_CA_CERTS: tls.caPath,
          PAGES_RUNTIME_TEST_OPTIONS: JSON.stringify({
            staticDirectory: root,
            backendUrl: `http://127.0.0.1:${backend.address().port}`,
            port: 0,
            tlsPort: 0,
            tls,
          }),
        },
        stdio: ["ignore", "ignore", "pipe", "ipc"],
      }
    );
    let errors = "";
    child.stderr.on("data", (chunk) => {
      errors += chunk;
    });
    t.after(async () => {
      if (child.exitCode !== null) return;
      const exited = once(child, "exit");
      child.send("close");
      const timeout = setTimeout(() => child.kill(), 3000);
      try {
        await exited;
      } finally {
        clearTimeout(timeout);
      }
    });
    const ready = await new Promise((resolve, reject) => {
      child.once("message", resolve);
      child.once("error", reject);
      child.once("exit", (code) =>
        reject(new Error(`Runtime exited ${code}: ${errors}`))
      );
    });

    assert.equal((await request(ready.origin)).body, "home");
    const compressed = await request(`${ready.origin}/api/compressed`);
    assert.equal(compressed.status, 200);
    assert.equal(compressed.headers["content-encoding"], undefined);
    assert.equal(compressed.body, '{"compressed":true}');
    const broken = await request(`${ready.origin}/api/broken-stream`);
    assert.equal(broken.status, 500);
    assert.equal((await request(ready.origin)).body, "home");
    assert.equal(
      (await request(`${ready.origin}/login?from=home`)).body,
      "login"
    );
    const head = await request(`${ready.origin}/login`, { method: "HEAD" });
    assert.equal(head.status, 200);
    assert.equal(head.body, "");
    assert.match(
      (await request(`${ready.origin}/app.js`)).headers["content-type"],
      /javascript/
    );
    for (const path of [
      "/absent",
      "/.audit/secret.txt",
      "/%2e%2e/outside.txt",
      "/escape/outside.txt",
      "/%5c..%5coutside.txt",
      "/app.js:stream",
      "/_headers",
    ]) {
      const response = await request(ready.origin, { path });
      assert.equal(response.status, 404, path);
      assert.equal(response.body, "missing", path);
    }

    const response = await request(`${ready.origin}/api/transport?check=1`, {
      method: "POST",
      headers: {
        Origin: ready.origin,
        "X-XSRF-TOKEN": "transport-token",
        "Content-Type": "text/plain",
      },
      body: "payload",
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers["set-cookie"].length, 2);
    assert.equal(response.headers["cache-control"], "no-store");
    assert.deepEqual(JSON.parse(response.body), {
      method: "POST",
      body: "payload",
      origin: ready.origin,
      csrf: "transport-token",
      proto: "https",
    });
    assert.equal(
      (
        await request(`${ready.backendOrigin}/api/tls`, {
          ca: await readFile(tls.caPath),
        })
      ).status,
      200
    );
    const before = received.length;
    assert.equal(
      (
        await request(`${ready.origin}/api/transport`, {
          method: "POST",
          body: "x".repeat(2 * 1024 * 1024 + 1),
        })
      ).status,
      413
    );
    assert.equal(received.length, before);
    const exited = once(child, "exit");
    child.send("close");
    assert.deepEqual(await exited, [0, null]);
  }
);
