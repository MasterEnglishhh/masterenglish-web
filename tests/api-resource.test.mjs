import test from "node:test";
import assert from "node:assert/strict";
import { act, loadHook, mountHook } from "./helpers/load-hook.mjs";

test("resource ignores stale responses and retries a failed load", async () => {
  let resolveOld;
  const old = new Promise(resolve => { resolveOld = resolve; });
  const useApiResource = loadHook("src/lib/use-api-resource.ts", "useApiResource", { apiErrorMessage: () => "Lỗi tải" });
  const fresh = async () => ({ ok: true, data: { id: "fresh" }, status: 200 });
  const fixture = await mountHook(({ load }) => useApiResource(load), { load: () => old });
  try {
    await fixture.update({ load: fresh });
    assert.equal(fixture.current().data.id, "fresh");
    await act(async () => resolveOld({ ok: true, data: { id: "old" }, status: 200 }));
    assert.equal(fixture.current().data.id, "fresh");
    let fails = true;
    const retryLoad = async () => fails ? { ok: false, status: 503, reason: "http", problem: null } : fresh();
    await fixture.update({ load: retryLoad });
    assert.equal(fixture.current().error, "Lỗi tải");
    fails = false;
    await act(async () => fixture.current().reload());
    assert.equal(fixture.current().error, null);
    assert.equal(fixture.current().data.id, "fresh");
  } finally { await fixture.close(); }
});
