import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const runtime = resolve('.audit/runtime/backend');
const credentials = JSON.parse(readFileSync(resolve(runtime, 'acceptance-credentials.json'), 'utf8'));
assert.equal(credentials.baseUrl, 'http://127.0.0.1:28081');
assert.match(credentials.password, /^[A-Za-z0-9!]+$/);
const inspect = spawnSync('docker', ['inspect', 'masterenglish-audit-9975'], { encoding: 'utf8' });
assert.equal(inspect.status, 0, 'Dedicated audit database must exist');
const container = JSON.parse(inspect.stdout)[0];
assert.equal(container.Config.Labels['masterenglish.audit'], '9975');
assert.equal(container.HostConfig.PortBindings['5432/tcp'][0].HostPort, '25433');
const sql = `
\\set audit_password '${credentials.password}'
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
INSERT INTO users (id, email, password_hash, first_name, last_name, display_name, status, email_verified_at)
SELECT id::uuid,email,crypt(:'audit_password',gen_salt('bf',12)),first_name,'Acceptance',first_name||' Acceptance','ACTIVE',now()
FROM (VALUES
 ('${credentials.learner.id}','${credentials.learner.email}','Learner'),
 ('${credentials.other.id}','${credentials.other.email}','Other'),
 ('${credentials.admin.id}','${credentials.admin.email}','Admin')) AS fixture(id,email,first_name)
ON CONFLICT (id) DO NOTHING;
INSERT INTO user_roles (user_id,role_id)
VALUES ('${credentials.learner.id}',1),('${credentials.other.id}',1),
 ('${credentials.admin.id}',1),('${credentials.admin.id}',2),('${credentials.admin.id}',3)
ON CONFLICT DO NOTHING;
INSERT INTO learning_goals (user_id,target_score,daily_minutes)
VALUES ('${credentials.learner.id}',650,20) ON CONFLICT DO NOTHING;
INSERT INTO content_items (id,content_type,created_by)
VALUES ('${credentials.lessonId}','GRAMMAR_LESSON','${credentials.admin.id}') ON CONFLICT DO NOTHING;
INSERT INTO content_revisions (id,content_item_id,version_no,schema_version,snapshot,status,created_by,reviewed_by,reviewed_at)
VALUES ('e9970000-0053-4000-8000-000000000001','${credentials.lessonId}',1,1,
 '{"schema_version":1,"content_type":"GRAMMAR_LESSON","data":{"topic_id":"${credentials.topicId}","title":"At, on and in in everyday schedules","body_schema_version":1,"body":{"blocks":[{"type":"heading","level":2,"text":"Choose the right preposition"},{"type":"paragraph","text":"Use at with clock times, on with days and dates, and in with months, seasons and years."},{"type":"paragraph","text":"The workshop starts at 9:30 on Monday. We will open the new office in December."}]},"sort_order":1,"estimated_minutes":5}}'::jsonb,
 'APPROVED','${credentials.admin.id}','${credentials.admin.id}',now()) ON CONFLICT DO NOTHING;
UPDATE content_revisions SET status='PUBLISHED',published_at=now()
WHERE id='e9970000-0053-4000-8000-000000000001' AND status='APPROVED';
UPDATE content_items SET published_revision_id='e9970000-0053-4000-8000-000000000001'
WHERE id='${credentials.lessonId}' AND published_revision_id IS NULL;
INSERT INTO grammar_lessons (id,published_revision_id,topic_id,title,body,sort_order,estimated_minutes)
SELECT content_item_id,id,'${credentials.topicId}',snapshot->'data'->>'title',snapshot->'data'->'body',1,5
FROM content_revisions WHERE id='e9970000-0053-4000-8000-000000000001' ON CONFLICT DO NOTHING;
INSERT INTO notification_preferences (user_id,in_app_enabled,email_enabled,timezone,content_notifications_enabled)
VALUES ('${credentials.learner.id}',true,false,'Asia/Ho_Chi_Minh',true) ON CONFLICT DO NOTHING;
INSERT INTO notifications (id,user_id,reminder_rule_id,type,visibility,title,body,target_url,dedupe_key)
VALUES ('${credentials.notificationId}','${credentials.learner.id}','6d1c3f0e-6b7a-4c51-9a0e-1f2b3c4d5e02','DAILY_GOAL','USER',
 'Hoàn thành mục tiêu hôm nay','Dành năm phút ôn lại giới từ chỉ thời gian.','/grammar/topics/${credentials.topicId}','audit-fixture-learner'),
 ('e9970000-0060-4000-8000-000000000002','${credentials.other.id}',NULL,'SYSTEM','USER',
 'Private synthetic notification','Only the other learner may read this.','/dashboard','audit-fixture-other')
ON CONFLICT DO NOTHING;
INSERT INTO notification_deliveries (id,notification_id,channel,status,sent_at,finished_at)
VALUES ('e9970000-0061-4000-8000-000000000001','${credentials.notificationId}','IN_APP','SENT',now(),now())
ON CONFLICT DO NOTHING;
COMMIT;
SELECT 'fixture_ready',count(*) FROM users WHERE email LIKE 'audit-%@acceptance.invalid';
`;
const seeded = spawnSync('docker', ['exec', '-i', 'masterenglish-audit-9975', 'psql', '-v', 'ON_ERROR_STOP=1', '-U', 'audit', '-d', 'masterenglish_audit'], { input: sql, encoding: 'utf8' });
assert.equal(seeded.status, 0, seeded.stderr.replaceAll(credentials.password, '<redacted>'));
console.log(seeded.stdout);
