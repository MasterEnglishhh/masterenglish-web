import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { availableParallelism } from "node:os";
import { resolve } from "node:path";
import { monitorEventLoopDelay } from "node:perf_hooks";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export function createResourceSampler(readResource, intervalMs = 2000) {
  const report = { intervalMs, samples: [], errors: [], skippedOverlaps: 0 };
  let pending;
  let stopped = false;
  function sample() {
    if (stopped) return Promise.resolve();
    if (pending) {
      report.skippedOverlaps++;
      return pending;
    }
    const began = performance.now();
    pending = Promise.resolve()
      .then(readResource)
      .then((row) => {
        assert.ok(Number.isFinite(row.capturedAt));
        assert.ok(Number.isFinite(row.rssBytes) && row.rssBytes > 0);
        assert.ok(Number.isFinite(row.cpuSeconds) && row.cpuSeconds >= 0);
        report.samples.push({
          ...row,
          samplerDurationMs: performance.now() - began,
        });
      })
      .catch((error) => {
        report.errors.push({
          at: Date.now(),
          code: String(error.code ?? error.name),
        });
      })
      .finally(() => {
        pending = undefined;
      });
    return pending;
  }
  const timer = setInterval(sample, intervalMs);
  return {
    report,
    sample,
    async stop() {
      clearInterval(timer);
      const finalSample = stopped ? pending : sample();
      stopped = true;
      await finalSample;
      return report;
    },
  };
}

export async function measureScenario(work, readResource) {
  const sampler = createResourceSampler(readResource);
  const eventLoop = monitorEventLoopDelay({ resolution: 10 });
  let samples;
  let durationSeconds;
  let clientCpu;
  let resources;
  try {
    await sampler.sample();
    assert.equal(
      sampler.report.errors.length,
      0,
      "Initial resource sample failed"
    );
    eventLoop.enable();
    const cpuBefore = process.cpuUsage();
    const began = performance.now();
    samples = await work();
    // Freeze the request interval before waiting for the asynchronous resource read.
    durationSeconds = (performance.now() - began) / 1000;
    clientCpu = process.cpuUsage(cpuBefore);
  } finally {
    eventLoop.disable();
    resources = await sampler.stop();
  }
  const metrics = Object.fromEntries(
    [...new Set(samples.map((row) => row.name))].map((name) => {
      const values = samples
        .filter((row) => row.name === name)
        .map((row) => row.ms)
        .sort((a, b) => a - b);
      const q = (p) => values[Math.ceil((values.length - 1) * p)];
      return [
        name,
        { count: values.length, p50: q(0.5), p95: q(0.95), p99: q(0.99) },
      ];
    })
  );
  const first = resources.samples[0];
  const last = resources.samples.at(-1);
  const cpuSeconds = last.cpuSeconds - first.cpuSeconds;
  const sampleSeconds = (last.capturedAt - first.capturedAt) / 1000;
  return {
    durationSeconds,
    requests: samples.length,
    throughputRequestsPerSecond: samples.length / durationSeconds,
    metrics,
    memory: {
      rssPeakBytes: Math.max(...resources.samples.map((row) => row.rssBytes)),
      samples: resources.samples.length,
    },
    cpu: {
      secondsBetweenResourceSamples: cpuSeconds,
      wallSecondsBetweenResourceSamples: sampleSeconds,
      oneCorePercent:
        sampleSeconds > 0 ? (cpuSeconds / sampleSeconds) * 100 : null,
      hostLogicalCpus: availableParallelism(),
    },
    clientCpuSeconds: (clientCpu.user + clientCpu.system) / 1e6,
    clientEventLoopDelayMs: {
      samples: eventLoop.count,
      p50: eventLoop.count ? eventLoop.percentile(50) / 1e6 : 0,
      p95: eventLoop.count ? eventLoop.percentile(95) / 1e6 : 0,
      p99: eventLoop.count ? eventLoop.percentile(99) / 1e6 : 0,
      max: eventLoop.count ? eventLoop.max / 1e6 : 0,
    },
    resources,
    requestSamples: samples,
  };
}

async function main() {
  const runtime = resolve(".audit/runtime/backend");
  const fixture = JSON.parse(
    readFileSync(resolve(runtime, "acceptance-credentials.json"), "utf8")
  );
  const base = process.env.BACKEND_URL || fixture.baseUrl;
  const pid = process.env.BACKEND_PID || "";
  const label = process.argv[2] || "corrected";
  assert.match(base, /^http:\/\/(127\.0\.0\.1|localhost):\d+$/);
  assert.match(
    pid,
    /^[1-9]\d*$/,
    "Set BACKEND_PID to the running baseline/final Java process"
  );
  assert.match(label, /^[a-z][a-z0-9-]{0,40}$/);
  const output = resolve(`.audit/evidence/be-benchmark-${label}.json`);
  assert.ok(
    !existsSync(output),
    "Choose an unused evidence label; prior runs are retained"
  );
  const concurrency = Number(process.env.BENCH_CONCURRENCY || 6);
  const iterations = Number(process.env.BENCH_ITERATIONS || 6);
  assert.ok(
    Number.isInteger(concurrency) && concurrency > 0 && concurrency <= 25
  );
  assert.ok(
    Number.isInteger(iterations) && iterations > 0 && iterations <= 100
  );
  let samples = [];

  async function request(
    session,
    name,
    method,
    path,
    body,
    headers = {},
    allowed = [200]
  ) {
    const began = performance.now();
    const response = await fetch(base + path, {
      method,
      redirect: "manual",
      signal: AbortSignal.timeout(30000),
      headers: {
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(session
          ? {
              Cookie: [...session.cookies]
                .map(([key, value]) => `${key}=${value}`)
                .join("; "),
              "X-XSRF-TOKEN": session.cookies.get("XSRF-TOKEN") || session.csrf,
            }
          : {}),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    for (const cookie of response.headers.getSetCookie()) {
      const value = cookie.split(";", 1)[0];
      const index = value.indexOf("=");
      session?.cookies.set(value.slice(0, index), value.slice(index + 1));
    }
    const raw = await response.text();
    const json = raw ? JSON.parse(raw) : null;
    samples.push({
      name,
      ms: performance.now() - began,
      status: response.status,
      bytes: Buffer.byteLength(raw),
    });
    assert.ok(
      allowed.includes(response.status),
      `${name}: HTTP ${response.status}, ${json?.code || ""}`
    );
    return json;
  }
  async function login(account) {
    const session = { cookies: new Map() };
    session.csrf = (
      await request(session, "csrf", "GET", "/api/v1/auth/csrf")
    ).token;
    await request(session, "login", "POST", "/api/v1/auth/login", {
      email: account.email,
      password: fixture.password,
    });
    assert.ok(
      session.cookies.has("access_token"),
      "Real login must return an access cookie"
    );
    return session;
  }
  const fullSet = "e5100000-0030-4000-8000-000000000001";
  const attemptPath = (id) => `/api/v1/attempts/${id}`;
  const start = (session) =>
    request(
      session,
      "start",
      "POST",
      "/api/v1/attempts",
      {
        source: { type: "PRACTICE_SET", practiceSetId: fullSet },
        mode: "PRACTICE",
      },
      { "Idempotency-Key": randomUUID() },
      [200, 201]
    );
  function assertPrivate(value) {
    if (!value || typeof value !== "object") return;
    for (const [key, child] of Object.entries(value)) {
      assert.ok(
        ![
          "correct",
          "isCorrect",
          "correctOptionId",
          "correctSourceOptionId",
          "explanation",
          "evidence",
          "transcript",
          "promptTranscript",
        ].includes(key),
        `Private field before submission: ${key}`
      );
      assertPrivate(child);
    }
  }

  const container = "masterenglish-audit-9975";
  const { stdout: ownership } = await execFileAsync("docker", [
    "inspect",
    "--format",
    '{{index .Config.Labels "masterenglish.audit"}}',
    container,
  ]);
  assert.equal(ownership.trim(), "9975");
  const seed = readFileSync(
    resolve(runtime, "src/test/resources/db/m05-bench/m05_fulltest_seed.sql"),
    "utf8"
  );
  const seeding = execFileAsync(
    "docker",
    [
      "exec",
      "-i",
      container,
      "psql",
      "-v",
      "ON_ERROR_STOP=1",
      "-U",
      "audit",
      "-d",
      "masterenglish_audit",
    ],
    { timeout: 120000 }
  );
  const input = new Promise((done, reject) => {
    seeding.child.stdin.on("error", reject);
    seeding.child.stdin.end(seed, done);
  });
  await Promise.all([seeding, input]);
  const sessions = await Promise.all([
    login(fixture.learner),
    login(fixture.other),
  ]);
  const warmup = await start(sessions[0]);
  assert.equal(warmup.totalCount, 200);
  await request(
    sessions[0],
    "warmup",
    "POST",
    `${attemptPath(warmup.id)}/submit`
  );

  async function readResource() {
    const command = `$taskProcess = Get-Process -Id ${pid} -ErrorAction Stop; [pscustomobject]@{ capturedAt = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds(); rssBytes = [long]$taskProcess.WorkingSet64; cpuSeconds = [double]$taskProcess.CPU } | ConvertTo-Json -Compress`;
    const { stdout } = await execFileAsync(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-Command", command],
      { windowsHide: true, timeout: 10000 }
    );
    return JSON.parse(stdout);
  }
  const scenarios = {};
  for (const name of ["original", "warm_steady"]) {
    scenarios[name] = await measureScenario(async () => {
      samples = [];
      const workers = await Promise.allSettled(
        Array.from({ length: concurrency }, async (_, worker) => {
          const session = sessions[worker % sessions.length];
          for (let iteration = 0; iteration < iterations; iteration++) {
            await request(
              session,
              "catalog",
              "GET",
              "/api/v1/practice-sets?category=TOEIC"
            );
            const created = await start(session);
            const active = await request(
              session,
              "get_full",
              "GET",
              attemptPath(created.id)
            );
            assert.equal(active.totalCount, 200);
            assert.equal(active.questions.length, 200);
            assertPrivate(active);
            for (const question of active.questions.slice(0, 5)) {
              await request(
                session,
                "save",
                "PUT",
                `${attemptPath(active.id)}/answers/${question.snapshotId}`,
                {
                  selectedOptionId: question.options[0].optionId,
                  expectedVersion: 0,
                },
                { "Idempotency-Key": randomUUID() }
              );
            }
            await request(
              session,
              "submit",
              "POST",
              `${attemptPath(active.id)}/submit`
            );
            const result = await request(
              session,
              "results",
              "GET",
              `${attemptPath(active.id)}/results`
            );
            assert.equal(result.questions.length, 200);
          }
        })
      );
      for (const worker of workers)
        if (worker.status === "rejected") throw worker.reason;
      assert.equal(samples.length, concurrency * iterations * 10);
      return samples;
    }, readResource);
  }
  const hash = (content) => createHash("sha256").update(content).digest("hex");
  const report = {
    timestamp: new Date().toISOString(),
    harnessSha256: hash(readFileSync(fileURLToPath(import.meta.url))),
    fixtureSha256: hash(seed),
    backendPid: Number(pid),
    concurrency,
    users: sessions.length,
    iterationsPerWorker: iterations,
    path: "Real HTTP + cookie JWT + CSRF + PostgreSQL17; 200-question attempts, five answers each",
    measurement:
      "Client latency includes body read and JSON parse, matching the original probe. Resource sampling uses asynchronous execFile with no overlapping reads; its final wait is outside request duration. CPU percent uses one logical core as 100% and the resource-sample interval.",
    warmup:
      "original follows one unmeasured start+submit; warm_steady repeats the complete original workload after all endpoints have run. Neither scenario claims a fresh JVM cold start.",
    scenarios,
  };
  writeFileSync(output, JSON.stringify(report, null, 2), { flag: "wx" });
  console.log(
    JSON.stringify(
      {
        output,
        concurrency,
        iterationsPerWorker: iterations,
        scenarios: Object.fromEntries(
          Object.entries(scenarios).map(([name, { resources, ...summary }]) => {
            delete summary.requestSamples;
            return [
              name,
              {
                ...summary,
                resourceErrors: resources.errors,
                skippedResourceOverlaps: resources.skippedOverlaps,
                resourceSampleCount: resources.samples.length,
              },
            ];
          })
        ),
      },
      null,
      2
    )
  );
  assert.ok(
    Object.values(scenarios).every(
      (scenario) => scenario.resources.errors.length === 0
    ),
    "Resource sampling failed; the retained evidence is incomplete"
  );
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await main();
}
