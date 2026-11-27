import assert from "node:assert/strict";
import test from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import {
  assertAuditTarget,
  assertStorageCapacity,
  runTimedWorkers,
} from "../scripts/acceptance/backend-soak.mjs";

const owned = {
  labels: { "masterenglish.audit": "9975" },
  ports: { "5432/tcp": [{ HostIp: "127.0.0.1", HostPort: "25433" }] },
};
const gib = 1024 ** 3;

test("soak accepts only the isolated audit database and local API port", () => {
  assert.doesNotThrow(() => assertAuditTarget("http://127.0.0.1:28081", owned));
  for (const [base, container] of [
    ["https://production.example", owned],
    ["http://127.0.0.1:8080", owned],
    ["http://127.0.0.1:28081", { ...owned, labels: {} }],
    ["http://127.0.0.1:28081", { ...owned, ports: { "5432/tcp": [{ HostIp: "0.0.0.0", HostPort: "25433" }] } }],
    ["http://127.0.0.1:28081", { ...owned, ports: { "5432/tcp": [{ HostIp: "127.0.0.1", HostPort: "5432" }] } }],
  ]) assert.throws(() => assertAuditTarget(base, container));
});

test("storage guard stops low disk, excessive database size or unexpected growth", () => {
  const capacity = { databaseBytes: gib, hostFreeBytes: 5 * gib, postgresFreeBytes: 5 * gib };
  assert.doesNotThrow(() => assertStorageCapacity(capacity, gib));
  for (const change of [
    { hostFreeBytes: gib },
    { postgresFreeBytes: gib },
    { databaseBytes: 9 * gib },
    { databaseBytes: 4 * gib },
    { databaseBytes: Number.NaN },
  ]) assert.throws(() => assertStorageCapacity({ ...capacity, ...change }, gib));
});

test("timed workers keep flows sequential per user and stop opening flows at the deadline", async () => {
  const activeUsers = new Set();
  let peak = 0;
  const began = performance.now();
  const counts = await runTimedWorkers(3, 25, async (user) => {
    assert.ok(!activeUsers.has(user));
    activeUsers.add(user);
    peak = Math.max(peak, activeUsers.size);
    await delay(8);
    activeUsers.delete(user);
  }, new AbortController(), 1000);
  assert.equal(peak, 3);
  assert.equal(activeUsers.size, 0);
  assert.ok(counts.every((count) => count > 0));
  assert.ok(performance.now() - began >= 25);
});

test("one failed flow cancels other in-flight workers and propagates the first failure", async () => {
  const controller = new AbortController();
  await assert.rejects(runTimedWorkers(3, 1000, async (user, signal) => {
    if (user === 0) throw new Error("response contract failed");
    await delay(1000, undefined, { signal });
  }, controller), /response contract failed/);
  assert.equal(controller.signal.aborted, true);
});

test("a flow that cannot drain is cancelled by the hard deadline", async () => {
  const controller = new AbortController();
  await assert.rejects(runTimedWorkers(1, 5, async (_, signal) => {
    await delay(1000, undefined, { signal });
  }, controller, 10), /Soak drain deadline exceeded/);
  assert.equal(controller.signal.aborted, true);
});
