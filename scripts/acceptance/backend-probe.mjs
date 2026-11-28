import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const runtime = resolve('.audit/runtime/backend');
const fixture = JSON.parse(readFileSync(resolve(runtime, 'acceptance-credentials.json'), 'utf8'));
const base = process.env.BACKEND_URL || fixture.baseUrl;
assert.match(base, /^http:\/\/(127\.0\.0\.1|localhost):\d+$/);
const samples = [];
const checks = [];
const rss = [];
const startTime = performance.now();

async function request(session, name, method, path, body, headers = {}, allowed = [200]) {
  const started = performance.now();
  const response = await fetch(base + path, {
    method, redirect: 'manual', signal: AbortSignal.timeout(30000),
    headers: {
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(session ? { Cookie: [...session.cookies].map(([k, v]) => `${k}=${v}`).join('; '),
        'X-XSRF-TOKEN': session.cookies.get('XSRF-TOKEN') || session.csrf } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  for (const cookie of response.headers.getSetCookie()) {
    const value = cookie.split(';', 1)[0];
    const index = value.indexOf('=');
    session?.cookies.set(value.slice(0, index), value.slice(index + 1));
  }
  const raw = await response.text();
  const json = raw ? JSON.parse(raw) : null;
  samples.push({ name, ms: performance.now() - started, status: response.status, bytes: Buffer.byteLength(raw) });
  assert.ok(allowed.includes(response.status), `${name}: HTTP ${response.status}, ${json?.code || ''}`);
  return { status: response.status, json, headers: response.headers };
}

async function login(account) {
  const session = { cookies: new Map() };
  session.csrf = (await request(session, 'csrf', 'GET', '/api/v1/auth/csrf')).json.token;
  await request(session, 'login', 'POST', '/api/v1/auth/login', { email: account.email, password: fixture.password });
  assert.ok(session.cookies.has('access_token'), 'Real login must return an access cookie');
  return session;
}
const source = (id) => ({ source: { type: 'PRACTICE_SET', practiceSetId: id }, mode: 'PRACTICE' });
const attemptPath = (id) => `/api/v1/attempts/${id}`;
const start = (session, id, key = randomUUID()) => request(session, 'start', 'POST', '/api/v1/attempts', source(id), { 'Idempotency-Key': key }, [200, 201]);
const save = (session, attempt, question, version, key = randomUUID(), optionId = question.options[0].optionId, allowed = [200]) =>
  request(session, 'save', 'PUT', `${attemptPath(attempt)}/answers/${question.snapshotId}`, { selectedOptionId: optionId, expectedVersion: version }, { 'Idempotency-Key': key }, allowed);

function assertPrivate(value) {
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    assert.ok(!['correct', 'isCorrect', 'correctOptionId', 'correctSourceOptionId', 'explanation', 'evidence', 'transcript', 'promptTranscript'].includes(key), `Private field before submission: ${key}`);
    assertPrivate(child);
  }
}

function database(sql) {
  const check = spawnSync('docker', ['inspect', 'masterenglish-audit-9975'], { encoding: 'utf8' });
  assert.equal(check.status, 0);
  assert.equal(JSON.parse(check.stdout)[0].Config.Labels['masterenglish.audit'], '9975');
  const result = spawnSync('docker', ['exec', '-i', 'masterenglish-audit-9975', 'psql', '-v', 'ON_ERROR_STOP=1', '-U', 'audit', '-d', 'masterenglish_audit'], { input: sql, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
}

function sampleRss() {
  const pid = process.env.BACKEND_PID;
  if (!pid || !/^\d+$/.test(pid)) return;
  const value = spawnSync('powershell', ['-NoProfile', '-Command', `(Get-Process -Id ${pid} -ErrorAction Stop).WorkingSet64`], { encoding: 'utf8' });
  const bytes = Number(value.stdout.trim());
  if (value.status === 0 && bytes > 0) rss.push(bytes);
}

async function benchmark() {
  database(readFileSync(resolve(runtime, 'src/test/resources/db/m05-bench/m05_fulltest_seed.sql'), 'utf8'));
  const sessions = await Promise.all([login(fixture.learner), login(fixture.other)]);
  const fullSet = 'e5100000-0030-4000-8000-000000000001';
  const warmup = (await start(sessions[0], fullSet)).json;
  assert.equal(warmup.totalCount, 200);
  await request(sessions[0], 'warmup', 'POST', `${attemptPath(warmup.id)}/submit`);
  const concurrency = Number(process.env.BENCH_CONCURRENCY || 6);
  const iterations = Number(process.env.BENCH_ITERATIONS || 6);
  assert.ok(concurrency > 0 && concurrency <= 25 && iterations > 0 && iterations <= 100);
  samples.length = 0;
  sampleRss();
  const timer = setInterval(sampleRss, 2000);
  const began = performance.now();
  try {
    await Promise.all(Array.from({ length: concurrency }, async (_, worker) => {
      const session = sessions[worker % sessions.length];
      for (let iteration = 0; iteration < iterations; iteration++) {
        await request(session, 'catalog', 'GET', '/api/v1/practice-sets?category=TOEIC');
        const created = (await start(session, fullSet)).json;
        const active = (await request(session, 'get_full', 'GET', attemptPath(created.id))).json;
        assert.equal(active.totalCount, 200);
        assertPrivate(active);
        for (const question of active.questions.slice(0, 5)) await save(session, active.id, question, 0);
        await request(session, 'submit', 'POST', `${attemptPath(active.id)}/submit`);
        await request(session, 'results', 'GET', `${attemptPath(active.id)}/results`);
      }
    }));
  } finally { clearInterval(timer); }
  sampleRss();
  return { concurrency, iterationsPerWorker: iterations, durationSeconds: (performance.now() - began) / 1000, memory: { rssPeakBytes: Math.max(...rss), samples: rss.length }, path: 'Real HTTP + cookie JWT + CSRF + PostgreSQL17; 200-question attempts, five answers each' };
}

async function security() {
  const learner = await login(fixture.learner);
  const other = await login(fixture.other);
  const admin = await login(fixture.admin);
  const profile = (await request(learner, 'profile_before_actor', 'GET', '/api/v1/users/me')).json;
  await request(learner, 'stale_actor_rejected', 'PUT', '/api/v1/users/me', { firstName: 'Must not persist', lastName: profile.lastName }, { 'X-Session-User': fixture.other.id }, [403]);
  assert.deepEqual((await request(learner, 'profile_after_actor', 'GET', '/api/v1/users/me')).json, profile);
  await request(learner, 'matching_actor_allowed', 'PUT', '/api/v1/users/me', { firstName: profile.firstName, lastName: profile.lastName }, { 'X-Session-User': fixture.learner.id });
  checks.push('StaleActor403WithoutMutation', 'MatchingActor200');
  await request(null, 'anonymous', 'GET', '/api/v1/attempts', undefined, {}, [401]);
  await request(learner, 'learner_admin_denied', 'GET', '/api/v1/admin/notifications/deliveries', undefined, {}, [403]);
  for (const path of ['/rules', '/history', '/deliveries']) await request(admin, 'admin_allowed', 'GET', `/api/v1/admin/notifications${path}`);
  const key = randomUUID();
  const first = (await start(learner, fixture.grammarSetId, key)).json;
  assert.equal((await start(learner, fixture.grammarSetId, key)).json.id, first.id);
  await request(learner, 'idempotency_mismatch', 'POST', '/api/v1/attempts', source(fixture.toeicSetId), { 'Idempotency-Key': key }, [409]);
  assertPrivate(first);
  await request(learner, 'early_results', 'GET', `${attemptPath(first.id)}/results`, undefined, {}, [409]);
  await request(other, 'ownership_get', 'GET', attemptPath(first.id), undefined, {}, [404]);
  await request(other, 'ownership_submit', 'POST', `${attemptPath(first.id)}/submit`, undefined, {}, [404]);
  await request(learner, 'csrf_required', 'POST', `${attemptPath(first.id)}/submit`, undefined, { 'X-XSRF-TOKEN': '' }, [403]);
  const question = first.questions[0];
  const replayKey = randomUUID();
  const saved = (await save(learner, first.id, question, 0, replayKey)).json;
  assert.equal(saved.version, 1);
  assert.deepEqual((await save(learner, first.id, question, 0, replayKey)).json, saved);
  const races = await Promise.all([
    save(learner, first.id, question, 1, randomUUID(), question.options[0].optionId, [200, 409]),
    save(learner, first.id, question, 1, randomUUID(), question.options[1].optionId, [200, 409]),
  ]);
  assert.deepEqual(races.map((r) => r.status).sort(), [200, 409]);
  const active = (await request(learner, 'resume', 'GET', attemptPath(first.id))).json;
  assert.equal(active.savedAnswers[question.snapshotId].version, 2);
  const submits = await Promise.all([request(learner, 'submit_race', 'POST', `${attemptPath(first.id)}/submit`), request(learner, 'submit_race', 'POST', `${attemptPath(first.id)}/submit`)]);
  assert.deepEqual(submits[0].json, submits[1].json);
  const result = (await request(learner, 'submitted_results', 'GET', `${attemptPath(first.id)}/results`)).json;
  assert.ok(JSON.stringify(result).includes('explanation'), 'Submitted review must include explanations');
  await save(learner, first.id, question, 2, randomUUID(), question.options[0].optionId, [409]);
  await request(other, 'ownership_results', 'GET', `${attemptPath(first.id)}/results`, undefined, {}, [404]);
  await request(other, 'notification_ownership', 'POST', `/api/v1/notifications/${fixture.notificationId}/read`, undefined, {}, [404]);
  await request(learner, 'lesson', 'GET', `/api/v1/grammar/lessons/${fixture.lessonId}`);
  await request(learner, 'notification_feed', 'GET', '/api/v1/notifications');
  await request(learner, 'dashboard', 'GET', '/api/v1/dashboard');
  checks.push('Anonymous401', 'LearnerAdmin403', 'AdminRealJWT200', 'IdempotentStartAndSave', 'MismatchedKey409', 'PrivateFieldsHidden', 'EarlyResults409', 'AttemptAndNotificationIDOR404', 'MissingCSRF403', 'CASRaceOneWinner', 'ResumeVersion2', 'SubmitRaceStable', 'ReviewAfterSubmit', 'NoAnswerAfterSubmit409', 'LessonFeedDashboard');
  return { checks };
}

async function recovery(phase) {
  const file = resolve('.audit/evidence/be-recovery-state.json');
  const learner = await login(fixture.learner);
  if (phase === 'prepare') {
    const active = (await start(learner, fixture.grammarSetId)).json;
    const question = active.questions[0];
    const key = randomUUID();
    const saved = (await save(learner, active.id, question, 0, key)).json;
    writeFileSync(file, JSON.stringify({ attemptId: active.id, question, key, saved }, null, 2));
    return { phase, attemptId: active.id, savedVersion: saved.version };
  }
  const state = JSON.parse(readFileSync(file, 'utf8'));
  const active = (await request(learner, 'recovered', 'GET', attemptPath(state.attemptId))).json;
  if (phase === 'verify-final') {
    assert.equal(active.status, 'SUBMITTED');
    const result = (await request(learner, 'recovered_result', 'GET', `${attemptPath(active.id)}/results`)).json;
    assert.deepEqual(result, state.submittedResult);
    return { phase, attemptId: active.id, submittedResultStable: true };
  }
  assert.equal(active.status, 'IN_PROGRESS');
  assert.equal(active.savedAnswers[state.question.snapshotId].version, state.saved.version);
  assert.equal(active.savedAnswers[state.question.snapshotId].selectedOptionId, state.saved.selectedOptionId);
  assert.deepEqual((await save(learner, active.id, state.question, 0, state.key)).json, state.saved);
  await request(learner, 'recovery_submit', 'POST', `${attemptPath(active.id)}/submit`);
  state.submittedResult = (await request(learner, 'recovery_results', 'GET', `${attemptPath(active.id)}/results`)).json;
  writeFileSync(file, JSON.stringify(state, null, 2));
  return { phase, attemptId: active.id, restoredAnswer: true, idempotentReplay: true, submitted: true };
}

const mode = process.argv[2] || 'security';
const details = mode === 'benchmark' ? await benchmark() : mode.startsWith('recovery-') ? await recovery(mode.slice(9)) : await security();
const durationSeconds = details.durationSeconds || (performance.now() - startTime) / 1000;
const metrics = Object.fromEntries([...new Set(samples.map((s) => s.name))].map((name) => {
  const values = samples.filter((s) => s.name === name).map((s) => s.ms).sort((a, b) => a - b);
  const q = (p) => values[Math.ceil((values.length - 1) * p)];
  return [name, { count: values.length, p50: q(0.5), p95: q(0.95), p99: q(0.99) }];
}));
const output = { timestamp: new Date().toISOString(), mode, ...details, requests: samples.length, throughputRequestsPerSecond: samples.length / durationSeconds, metrics };
writeFileSync(resolve(`.audit/evidence/be-${mode}.json`), JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));
