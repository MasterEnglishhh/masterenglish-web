import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { promisify } from "node:util";
import test from "node:test";
import {
  createResourceSampler,
  measureScenario,
} from "../scripts/acceptance/backend-benchmark.mjs";

const execFileAsync = promisify(execFile);
const resource = () => ({
  capturedAt: Date.now(),
  rssBytes: 1024,
  cpuSeconds: 1,
});

test("resource sampling lets HTTP callbacks run while the child process waits", async () => {
  const order = [];
  const sampler = createResourceSampler(async () => {
    await execFileAsync(process.execPath, [
      "-e",
      'setTimeout(() => process.stdout.write("ready"), 100)',
    ]);
    order.push("sample");
    return resource();
  });
  void sampler.sample();
  const timer = delay(10).then(() => order.push("callback"));
  const report = await sampler.stop();
  await timer;
  assert.deepEqual(order, ["callback", "sample"]);
  assert.equal(report.samples.length, 1);
  assert.deepEqual(report.errors, []);
});

test("slow resource reads never overlap and stop drains the pending read", async () => {
  const gate = Promise.withResolvers();
  let active = 0;
  let peak = 0;
  let calls = 0;
  const sampler = createResourceSampler(async () => {
    calls++;
    peak = Math.max(peak, ++active);
    await gate.promise;
    active--;
    return resource();
  }, 2);
  void sampler.sample();
  await delay(20);
  const stopping = sampler.stop();
  assert.equal(active, 1);
  gate.resolve();
  const report = await stopping;
  assert.equal(peak, 1);
  assert.equal(active, 0);
  assert.equal(calls, 1);
  assert.ok(report.skippedOverlaps > 0);
  await delay(10);
  assert.equal(calls, 1);
});

test("request duration and throughput exclude the final resource sample wait", async () => {
  const finalSample = Promise.withResolvers();
  const finishSample = Promise.withResolvers();
  let reads = 0;
  const began = performance.now();
  const measuring = measureScenario(
    async () => {
      await delay(20);
      return [
        { name: "get_full", ms: 10, status: 200, bytes: 100 },
        { name: "get_full", ms: 20, status: 200, bytes: 200 },
      ];
    },
    async () => {
      if (++reads === 2) {
        finalSample.resolve();
        await finishSample.promise;
      }
      return resource();
    }
  );
  await finalSample.promise;
  await delay(80);
  finishSample.resolve();
  const report = await measuring;
  const elapsedMs = performance.now() - began;
  assert.ok(elapsedMs - report.durationSeconds * 1000 >= 70);
  assert.equal(report.requests, 2);
  assert.equal(report.throughputRequestsPerSecond, 2 / report.durationSeconds);
  assert.equal(report.metrics.get_full.p95, 20);
  assert.equal(report.memory.rssPeakBytes, 1024);
  assert.equal(report.resources.samples.length, 2);
  assert.ok(Number.isFinite(report.clientEventLoopDelayMs.p95));
});

test("resource errors remain visible without leaking child process arguments", async () => {
  const sampler = createResourceSampler(async () => {
    throw Object.assign(new Error("private child process arguments"), {
      code: "EACCES",
    });
  });
  void sampler.sample();
  const report = await sampler.stop();
  assert.deepEqual(report.samples, []);
  assert.equal(report.errors[0].code, "EACCES");
  assert.ok(!JSON.stringify(report).includes("private"));
});
