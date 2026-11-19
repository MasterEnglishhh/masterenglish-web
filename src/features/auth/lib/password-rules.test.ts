import assert from "node:assert/strict";
import { test } from "node:test";
import { checkPassword } from "./password-rules.ts";

const met = (raw: string) => checkPassword(raw).rules.map((rule) => rule.met);

test("14 ký tự chưa đạt, 15 ký tự thì đạt", () => {
  assert.deepEqual(met("a".repeat(14)), [false, true]);
  assert.equal(checkPassword("a".repeat(14)).valid, false);
  assert.equal(checkPassword("a".repeat(15)).valid, true);
});

test("giới hạn 72 byte UTF-8 tính theo byte, không theo ký tự", () => {
  assert.equal(checkPassword("a".repeat(72)).valid, true);
  assert.deepEqual(met("a".repeat(73)), [true, false]);
  // 'ế' chiếm 3 byte sau NFC: 24 ký tự là 72 byte, 25 ký tự là 75 byte
  assert.equal(checkPassword("ế".repeat(24)).valid, true);
  assert.equal(checkPassword("ế".repeat(25)).valid, false);
});

test("emoji chiếm 4 byte nên 19 emoji vượt 72 byte dù chỉ có 19 ký tự", () => {
  assert.deepEqual(met("😀".repeat(19)), [true, false]);
  assert.equal(checkPassword("😀".repeat(18)).valid, true);
});

test("chuẩn hóa NFC trước khi đếm: dạng tổ hợp và dạng dựng sẵn cho cùng kết quả", () => {
  const composed = "ế".repeat(15);
  const decomposed = "ế".repeat(15);
  assert.equal(checkPassword(decomposed).normalized, composed);
  assert.deepEqual(met(decomposed), met(composed));
});

test("chuỗi rỗng hoặc toàn khoảng trắng không hợp lệ dù đủ độ dài", () => {
  assert.equal(checkPassword("").valid, false);
  assert.deepEqual(met(""), [false, false]);
  assert.equal(checkPassword(" ".repeat(20)).valid, false);
});
