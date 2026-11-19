import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { act, loadHook, mountHook } from "./helpers/load-hook.mjs";

const mounted = [];
afterEach(async () => {
  for (const fixture of mounted.splice(0)) await fixture.close();
});

async function setup({ item = { id: "item-1", latestRevisionId: "rev-1" }, result = { success: true } } = {}) {
  const calls = [];
  const record = (name) => async (...args) => {
    calls.push([name, ...args]);
    return result;
  };
  const mocks = {
    submitContentRevision: record("submit"),
    approveContentRevision: record("approve"),
    rejectContentRevision: record("reject"),
    publishContentRevision: record("publish"),
    archiveContentItem: record("archive"),
  };
  const useContentReview = loadHook("src/features/admin/hooks/use-content-review.ts", "useContentReview", mocks);
  return { calls, useContentReview, item };
}

/** Hook nhận tham số vị trí nên được gắn qua một hàm bọc. */
async function mount(options) {
  const base = await setup(options);
  const events = [];
  const hook = () => base.useContentReview(base.item, () => events.push("reload"), () => events.push("close"));
  const fixture = await mountHook(hook, {});
  mounted.push(fixture);
  const run = (fn) => act(async () => fn(fixture.current()));
  return { fixture, events, calls: base.calls, run };
}

test("từ chối mà không có lý do: hiện lỗi trong hộp thoại và không gọi máy chủ", async () => {
  const { fixture, calls, run } = await mount();
  await run((h) => h.reject());
  assert.equal(calls.length, 0);
  assert.match(fixture.current().error, /Bắt buộc nhập ghi chú lý do từ chối/);
});

test("từ chối kèm lý do: gửi lý do đã cắt khoảng trắng, rồi tải lại và đóng hộp thoại", async () => {
  const { fixture, events, calls, run } = await mount();
  await run((h) => h.setReviewNote("  Sai phiên âm  "));
  await run((h) => h.reject());
  assert.deepEqual(calls, [["reject", "rev-1", "Sai phiên âm"]]);
  assert.deepEqual(events, ["reload", "close"]);
  assert.equal(fixture.current().error, null);
});

test("duyệt không ghi chú dùng ghi chú mặc định", async () => {
  const { calls, run } = await mount();
  await run((h) => h.approve());
  assert.deepEqual(calls, [["approve", "rev-1", "Đạt chuẩn xuất bản"]]);
});

test("mục chưa có mã phiên bản: báo lỗi, không gọi gửi duyệt hay xuất bản", async () => {
  const { fixture, calls, run } = await mount({ item: { id: "item-1", latestRevisionId: null } });
  await run((h) => h.publish());
  await run((h) => h.submitForReview());
  assert.equal(calls.length, 0);
  assert.match(fixture.current().error, /mã phiên bản/);
});

test("lưu trữ cần hai lần bấm và bắt buộc có lý do", async () => {
  const { fixture, calls, events, run } = await mount();
  await run((h) => h.archive());
  assert.equal(fixture.current().isArchiving, true);
  assert.equal(calls.length, 0);
  await run((h) => h.setArchiveReason("   "));
  await run((h) => h.archive());
  assert.match(fixture.current().error, /lý do lưu trữ/);
  assert.equal(calls.length, 0);
  await run((h) => h.setArchiveReason("Hết bản quyền"));
  await run((h) => h.archive());
  assert.deepEqual(calls, [["archive", "item-1", "Hết bản quyền"]]);
  assert.deepEqual(events, ["reload", "close"]);
});

test("máy chủ từ chối: hiện thông báo của máy chủ, không đóng hộp thoại", async () => {
  const { fixture, events, run } = await mount({ result: { success: false, error: { message: "Phiên bản đã đổi." } } });
  await run((h) => h.publish());
  assert.equal(fixture.current().error, "Phiên bản đã đổi.");
  assert.equal(fixture.current().isSubmitting, false);
  assert.deepEqual(events, []);
});
