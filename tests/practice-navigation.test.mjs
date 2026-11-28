import test from "node:test";
import assert from "node:assert/strict";
import { act, loadHook, mountHook } from "./helpers/load-hook.mjs";

test("liên kết nội bộ phải xác nhận trước khi bỏ đáp án chưa lưu; neo câu hỏi vẫn dùng được", async () => {
  const original = globalThis.window;
  const originalAnchor = globalThis.HTMLAnchorElement;
  globalThis.HTMLAnchorElement = class {};
  globalThis.window = Object.assign(new EventTarget(), {
    location: { href: "http://localhost/learn/practice?attempt=a" },
  });
  const routes = [];
  const usePracticeNavigation = loadHook(
    "src/features/practice/hooks/use-practice-navigation.ts",
    "usePracticeNavigation",
    { useRouter: () => ({ push: (url) => routes.push(url) }) }
  );
  const fixture = await mountHook(
    (props) => usePracticeNavigation(props.dirty),
    { dirty: true }
  );
  async function click(href) {
    const event = new Event("click", { cancelable: true });
    Object.defineProperties(event, {
      button: { value: 0 },
      target: {
        value: {
          closest: () =>
            Object.assign(new HTMLAnchorElement(), {
              href,
              target: "",
              hasAttribute: () => false,
            }),
        },
      },
    });
    await act(async () => window.dispatchEvent(event));
    return event;
  }
  try {
    assert.equal(
      (await click("http://localhost/learn/practice?attempt=a#question-2"))
        .defaultPrevented,
      false
    );
    assert.equal(
      (await click("http://localhost/learn/results")).defaultPrevented,
      true
    );
    assert.ok(fixture.current().destination);
    assert.deepEqual(routes, []);
    await act(async () => fixture.current().stay());
    assert.equal(fixture.current().destination, null);
    await click("http://localhost/learn/vocabulary");
    await act(async () => fixture.current().leave());
    assert.deepEqual(routes, ["/learn/vocabulary"]);
    await fixture.update({ dirty: false });
    assert.equal(
      (await click("http://localhost/learn/results")).defaultPrevented,
      false
    );
  } finally {
    await fixture.close();
    globalThis.window = original;
    globalThis.HTMLAnchorElement = originalAnchor;
  }
});
