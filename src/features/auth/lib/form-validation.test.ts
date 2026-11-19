import assert from "node:assert/strict";
import { test } from "node:test";
import { isValidEmail, validateRegisterValues, type RegisterValues } from "./form-validation.ts";

const valid: RegisterValues = {
  lastName: "Nguyễn Hoàng",
  firstName: "An",
  email: "an@example.com",
  password: "mot cum tu dai de nho",
  confirmPassword: "mot cum tu dai de nho",
};

test("email: cần @ và tên miền có dấu chấm, bỏ khoảng trắng hai đầu, tối đa 254 ký tự", () => {
  assert.equal(isValidEmail("  an@example.com "), true);
  assert.equal(isValidEmail("an@example"), false);
  assert.equal(isValidEmail("an @example.com"), false);
  assert.equal(isValidEmail(`${"a".repeat(247)}@ex.com`), true); // đúng 254 ký tự
  assert.equal(isValidEmail(`${"a".repeat(248)}@ex.com`), false); // 255 ký tự
});

test("dữ liệu hợp lệ không có lỗi nào", () => {
  assert.deepEqual(validateRegisterValues(valid), {});
});

test("họ và tên bắt buộc, tối đa 30 ký tự", () => {
  const errors = validateRegisterValues({ ...valid, lastName: "  ", firstName: "a".repeat(31) });
  assert.equal(errors.lastName, "Vui lòng nhập họ và tên đệm.");
  assert.equal(errors.firstName, "Vui lòng dùng tối đa 30 ký tự.");
});

test("mật khẩu ngắn bị báo và mật khẩu nhập lại phải khớp sau chuẩn hóa NFC", () => {
  assert.equal(
    validateRegisterValues({ ...valid, password: "ngan", confirmPassword: "ngan" }).password,
    "Mật khẩu cần từ 15 ký tự và không quá 72 byte UTF-8."
  );
  assert.equal(validateRegisterValues({ ...valid, confirmPassword: "khac" }).confirmPassword, "Mật khẩu nhập lại chưa khớp.");
  assert.equal(validateRegisterValues({ ...valid, confirmPassword: "" }).confirmPassword, "Vui lòng nhập lại mật khẩu.");
  const composed = "ế".repeat(16);
  const decomposed = "ế".repeat(16);
  assert.deepEqual(validateRegisterValues({ ...valid, password: composed, confirmPassword: decomposed }), {});
});

test("thứ tự khóa lỗi theo thứ tự trường trên form để focus đúng ô đầu tiên", () => {
  const errors = validateRegisterValues({ lastName: "", firstName: "", email: "x", password: "", confirmPassword: "" });
  assert.deepEqual(Object.keys(errors), ["lastName", "firstName", "email", "password", "confirmPassword"]);
});
