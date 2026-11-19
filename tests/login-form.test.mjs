import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { act, loadHook, mountHook } from "./helpers/load-hook.mjs";

const useCountdownClock = loadHook("src/features/auth/hooks/use-countdown-clock.ts", "useCountdownClock");
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const user = { id: "u1", email: "an@example.com" };
const submit = { preventDefault() {} };

// Đóng mọi hook đã gắn để đồng hồ đếm lùi không giữ tiến trình sống khi một test lỗi.
const mounted = [];
afterEach(async () => {
  for (const fixture of mounted.splice(0)) await fixture.close();
});

/** Dựng hook đăng nhập với client giả; `result` là kết quả `login` trả về. */
async function setup({ result = { success: true, user }, redirectTo } = {}) {
  const replaced = [];
  const accepted = [];
  const calls = [];
  const router = { replace: (url) => replaced.push(url) };
  const mocks = {
    useRouter: () => router,
    useAuthSession: () => ({ user: null, acceptLogin: (value) => accepted.push(value) }),
    useCountdownClock,
    getSafeRedirectUrl: (value, fallback) => value ?? fallback,
    EMAIL_PATTERN,
    login: async (credentials) => {
      calls.push(credentials);
      return result;
    },
  };
  const useLoginForm = loadHook("src/features/auth/hooks/use-login-form.ts", "useLoginForm", mocks);
  const fixture = await mountHook(useLoginForm, { redirectTo });
  mounted.push(fixture);
  const type = (field, value) => act(async () => fixture.current().handleFieldChange(field, value));
  const send = () => act(async () => fixture.current().onSubmit(submit));
  return { fixture, replaced, accepted, calls, type, send };
}

test("gửi form trống: báo lỗi từng trường và không gọi máy chủ", async () => {
  const { fixture, calls, send } = await setup();
  await send();
  assert.equal(calls.length, 0);
  assert.equal(fixture.current().errors.email, "Vui lòng nhập email của bạn.");
  assert.equal(fixture.current().errors.password, "Vui lòng nhập mật khẩu.");
  assert.equal(fixture.current().status, "idle");
});

test("email sai định dạng được báo riêng, sửa lại thì lỗi của trường đó biến mất", async () => {
  const { fixture, calls, type, send } = await setup();
  await type("email", "khong-hop-le");
  await type("password", "mat-khau");
  await send();
  assert.equal(calls.length, 0);
  assert.match(fixture.current().errors.email, /chưa đúng định dạng/);
  assert.equal(fixture.current().errors.password, undefined);
  await type("email", "an@example.com");
  assert.equal(fixture.current().errors.email, undefined);
});

test("đăng nhập thành công: nhận phiên rồi chuyển tới đích đã yêu cầu", async () => {
  const { fixture, calls, accepted, replaced, type, send } = await setup({ redirectTo: "/learn/vocabulary" });
  await type("email", "an@example.com");
  await type("password", "mat-khau-dung");
  await send();
  assert.deepEqual(calls, [{ email: "an@example.com", password: "mat-khau-dung" }]);
  assert.deepEqual(accepted, [user]);
  assert.deepEqual(replaced, ["/learn/vocabulary"]);
  assert.equal(fixture.current().status, "success");
});

test("không có redirect thì về /learn", async () => {
  const { replaced, type, send } = await setup();
  await type("email", "an@example.com");
  await type("password", "mat-khau-dung");
  await send();
  assert.deepEqual(replaced, ["/learn"]);
});

test("sai thông tin đăng nhập: xóa mật khẩu, giữ email và hiện lỗi từ máy chủ", async () => {
  const error = { code: "BAD_CREDENTIALS", message: "Email hoặc mật khẩu chưa đúng." };
  const { fixture, replaced, accepted, type, send } = await setup({ result: { success: false, error } });
  await type("email", "an@example.com");
  await type("password", "sai-mat-khau");
  await send();
  assert.equal(fixture.current().values.password, "");
  assert.equal(fixture.current().values.email, "an@example.com");
  assert.equal(fixture.current().serverError, error);
  assert.equal(fixture.current().status, "error");
  assert.equal(accepted.length + replaced.length, 0);
});

test("bị giới hạn tần suất: có đếm lùi và lần gửi tiếp theo bị chặn đến khi hết thời gian", async () => {
  const error = { code: "RATE_LIMITED", message: "Thử lại sau.", retryAfterSeconds: 30 };
  const { fixture, calls, type, send } = await setup({ result: { success: false, error } });
  await type("email", "an@example.com");
  await type("password", "mat-khau");
  await send();
  assert.equal(calls.length, 1);
  const seconds = fixture.current().cooldownSeconds;
  assert.ok(seconds >= 29 && seconds <= 30, `còn ${seconds}s`);
  await send();
  assert.equal(calls.length, 1, "không được gọi máy chủ khi còn đang bị chặn");
});

test("lỗi do máy chủ chỉ ra theo trường được gắn vào đúng trường", async () => {
  const error = { code: "VALIDATION", message: "Dữ liệu chưa hợp lệ.", fieldViolations: { email: "Email không tồn tại." } };
  const { fixture, type, send } = await setup({ result: { success: false, error } });
  await type("email", "an@example.com");
  await type("password", "mat-khau");
  await send();
  assert.equal(fixture.current().errors.email, "Email không tồn tại.");
});
