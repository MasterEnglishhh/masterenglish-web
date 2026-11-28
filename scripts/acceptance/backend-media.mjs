import assert from 'node:assert/strict';
import { randomBytes, createHash, createHmac } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { request as httpsRequest } from 'node:https';
import { spawnSync } from 'node:child_process';

const root = resolve('.audit/runtime');
const directory = resolve(root, 'minio');
mkdirSync(resolve(directory, 'certs'), { recursive: true });
const secretFile = resolve(directory, 'credentials.json');
if (!existsSync(secretFile)) writeFileSync(secretFile, JSON.stringify({ accessKey: 'audit9975', secretKey: randomBytes(32).toString('hex') }));
const keys = JSON.parse(readFileSync(secretFile, 'utf8'));
assert.match(keys.accessKey, /^[a-z0-9]+$/);
assert.match(keys.secretKey, /^[a-f0-9]{64}$/);
const ca = readFileSync(resolve(root, 'tls/ca.pem'));
writeFileSync(resolve(directory, 'certs/public.crt'), Buffer.concat([readFileSync(resolve(root, 'tls/server.pem')), ca]));
writeFileSync(resolve(directory, 'certs/private.key'), readFileSync(resolve(root, 'tls/server-key.pem')));
writeFileSync(resolve(directory, '.env'), `MINIO_ROOT_USER=${keys.accessKey}\nMINIO_ROOT_PASSWORD=${keys.secretKey}\n`);

function docker(args, input) {
  const result = spawnSync('docker', args, { input, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr.replaceAll(keys.secretKey, '<redacted>'));
  return result.stdout;
}
const name = 'masterenglish-audit-minio-9975';
const existing = spawnSync('docker', ['inspect', name], { encoding: 'utf8' });
if (existing.status === 0) {
  const container = JSON.parse(existing.stdout)[0];
  assert.equal(container.Config.Labels['masterenglish.audit'], '9975');
  assert.equal(container.HostConfig.PortBindings['9000/tcp'][0].HostPort, '29000');
  assert.equal(container.State.Running, true, 'Existing MinIO must already be running');
} else {
  docker(['run', '--detach', '--name', name, '--label', 'masterenglish.audit=9975',
    '--env-file', resolve(directory, '.env'), '--publish', '127.0.0.1:29000:9000',
    '--mount', `type=bind,source=${resolve(directory, 'certs')},target=/certs,readonly`,
    '--tmpfs', '/data:rw,uid=1001,gid=1001,mode=0700',
    '--entrypoint', '/opt/bitnami/minio/bin/minio', 'bitnamilegacy/minio:2025.7.23-debian-12-r3',
    'server', '/data', '--address', ':9000', '--certs-dir', '/certs']);
}

const endpoint = new URL('https://127.0.0.1:29000');
const hash = (value) => createHash('sha256').update(value).digest('hex');
const hmac = (key, value) => createHmac('sha256', key).update(value).digest();
function send(method, path, body = Buffer.alloc(0), type = 'application/octet-stream', sign = true) {
  const date = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
  const day = date.slice(0, 8);
  const payloadHash = hash(body);
  const headers = { Host: endpoint.host, 'x-amz-content-sha256': payloadHash, 'x-amz-date': date, 'Content-Type': type, 'Content-Length': body.length };
  if (sign) {
    const names = 'host;x-amz-content-sha256;x-amz-date';
    const canonical = [method, path, '', `host:${endpoint.host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${date}\n`, names, payloadHash].join('\n');
    const scope = `${day}/auto/s3/aws4_request`;
    const signingKey = hmac(hmac(hmac(hmac(`AWS4${keys.secretKey}`, day), 'auto'), 's3'), 'aws4_request');
    const signature = createHmac('sha256', signingKey).update(`AWS4-HMAC-SHA256\n${date}\n${scope}\n${hash(canonical)}`).digest('hex');
    headers.Authorization = `AWS4-HMAC-SHA256 Credential=${keys.accessKey}/${scope}, SignedHeaders=${names}, Signature=${signature}`;
  }
  return new Promise((yes, no) => {
    const req = httpsRequest(new URL(path, endpoint), { method, ca, headers, timeout: 10000 }, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => yes({ status: response.statusCode, body: Buffer.concat(chunks), headers: response.headers }));
    });
    req.on('error', no);
    req.on('timeout', () => req.destroy(new Error('Local storage timeout')));
    req.end(body);
  });
}
for (let attempt = 0; attempt < 40; attempt++) {
  try { if ((await send('GET', '/minio/health/ready', undefined, undefined, false)).status === 200) break; } catch {}
  assert.ok(attempt < 39, 'Local TLS MinIO did not become ready');
  await new Promise((done) => setTimeout(done, 500));
}

const pg = JSON.parse(docker(['inspect', 'masterenglish-audit-9975']))[0];
assert.equal(pg.Config.Labels['masterenglish.audit'], '9975');
const assets = JSON.parse(docker(['exec', 'masterenglish-audit-9975', 'psql', '-U', 'audit', '-d', 'masterenglish_audit', '-t', '-A', '-c', "SELECT json_agg(row_to_json(a)) FROM (SELECT id,media_type,bucket,object_key,duration_ms FROM media_assets WHERE bucket='masterenglish-local-seed') a;"]));
assert.ok(assets.length > 0);
const snapshots = JSON.parse(docker(['exec', 'masterenglish-audit-9975', 'psql', '-U', 'audit', '-d', 'masterenglish_audit', '-t', '-A', '-c', "SELECT json_agg(snapshot->'data') FROM content_revisions WHERE content_item_id::text LIKE 'e5000000-%' AND snapshot->>'content_type' IN ('QUESTION','QUESTION_GROUP');"]));
const assetDirectory = resolve(directory, 'assets');
mkdirSync(assetDirectory, { recursive: true });
const speechById = new Map();
for (const data of snapshots) {
  const audio = data.materials?.find((material) => material.material_type === 'AUDIO');
  if (!audio) continue;
  const transcript = data.materials.find((material) => material.material_type === 'TRANSCRIPT');
  let lines = transcript?.body?.segments?.map((segment) => ({ speaker: segment.speaker, text: segment.text, pause: segment.type === 'pause' ? segment.seconds : 0 }));
  if (!lines) {
    lines = data.prompt_transcript ? [{ ...data.prompt_transcript, pause: 1 }] : [];
    for (const [index, option] of (data.options || []).entries()) lines.push({ speaker: option.speaker, text: `${String.fromCharCode(65 + index)}. ${option.body}`, pause: 1 });
    if (!lines.length) lines.push({ speaker: 'N', text: 'Resilient.', pause: 1 });
  }
  speechById.set(audio.media_asset_id, lines);
}
const manifest = {
  audio: assets.filter((asset) => asset.media_type === 'AUDIO').map((asset) => ({ path: resolve(assetDirectory, `${asset.id}.wav`), lines: speechById.get(asset.id) || [{ text: 'Resilient.', speaker: 'N', pause: 1 }] })),
  images: assets.filter((asset) => asset.media_type === 'IMAGE').map((asset) => ({ path: resolve(assetDirectory, `${asset.id}.png`), scene: asset.id.endsWith('000000000001') ? 'workers' : 'plants' })),
};
const manifestPath = resolve(directory, 'speech-manifest.json');
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
const generated = spawnSync('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', resolve('scripts/acceptance/backend-speech.ps1'), '-Manifest', manifestPath], { encoding: 'utf8' });
assert.equal(generated.status, 0, generated.stderr);
const buckets = [...new Set(assets.map((asset) => asset.bucket))];
for (const bucket of buckets) assert.ok([200, 409].includes((await send('PUT', `/${bucket}`)).status));
for (const asset of assets) {
  const body = readFileSync(resolve(assetDirectory, `${asset.id}.${asset.media_type === 'AUDIO' ? 'wav' : 'png'}`));
  assert.ok(body.length > 44);
  const path = `/${asset.bucket}/${asset.object_key.split('/').map(encodeURIComponent).join('/')}`;
  assert.equal((await send('PUT', path, body, asset.media_type === 'AUDIO' ? 'audio/wav' : 'image/png')).status, 200);
  assert.equal((await send('GET', path)).body.length, body.length);
  assert.equal((await send('GET', path, undefined, undefined, false)).status, 403);
}
const envPath = resolve(root, 'backend/.env');
let env = readFileSync(envPath, 'utf8').replace(/^R2_ENABLED=.*$/m, 'R2_ENABLED=true');
env = env.replace(/^R2_(ENDPOINT|REGION|BUCKET|ACCESS_KEY_ID|SECRET_ACCESS_KEY)=.*\r?\n?/gm, '');
env += `\nR2_ENDPOINT=${endpoint.origin}\nR2_REGION=auto\nR2_BUCKET=masterenglish-local-seed\nR2_ACCESS_KEY_ID=${keys.accessKey}\nR2_SECRET_ACCESS_KEY=${keys.secretKey}\n`;
writeFileSync(resolve(root, 'backend/.env.media'), env);
console.log(JSON.stringify({ minio: endpoint.origin, tlsVerified: true, assetsUploadedAndRead: assets.length, buckets, media: 'Stock Windows TTS reading seeded prompts/options/transcripts; original workers/table and woman/plants PNG illustrations', runtimeRestartRequired: true }));
