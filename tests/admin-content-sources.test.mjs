import fs from "node:fs";
import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { create } from "react-test-renderer";
import ts from "typescript";
import { act, loadHook, mountHook } from "./helpers/load-hook.mjs";

const createLatestRequestTracker = loadHook(
  "src/lib/latest-request.ts",
  "createLatestRequestTracker"
);
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const DEBOUNCE = 320;

const mounted = [];
afterEach(async () => {
  for (const fixture of mounted.splice(0)) await fixture.close();
});

const sourceItem = (id, title = `Source ${id}`) => ({
  id,
  title,
  sourceType: "EXTERNAL",
  sourceUrl: `https://example.com/${id}`,
  author: "Author A",
  licenseCode: "CC-BY",
  status: "ACTIVE",
  createdAt: "2026-01-01T00:00:00Z",
});

const pageResponse = (items, totalPages = 1) => ({
  success: true,
  data: {
    items,
    totalItems: items.length,
    totalPages,
  },
});

function setupSourcesHook(overrides = {}) {
  const calls = [];
  const mocks = {
    createLatestRequestTracker,
    fetchContentSources: async (params) => {
      calls.push(["fetch", params]);
      return pageResponse([sourceItem("s1"), sourceItem("s2")], 2);
    },
    createContentSource: async (payload) => {
      calls.push(["create", payload]);
      return { success: true, data: sourceItem("s-new", payload.title) };
    },
    ...overrides,
  };

  const useContentSources = loadHook(
    "src/features/admin/hooks/use-content-sources.ts",
    "useContentSources",
    mocks
  );
  return { useContentSources, calls, mocks };
}

test("useContentSources chế độ mặc định (dropdown): tải không truyền tham số phân trang", async () => {
  const { useContentSources, calls } = setupSourcesHook();
  const fixture = await mountHook(useContentSources, undefined);
  mounted.push(fixture);

  assert.equal(fixture.current().isLoading, false);
  assert.equal(fixture.current().sources.length, 2);
  assert.deepEqual(calls, [["fetch", undefined]]);
});

test("useContentSources chế độ phân trang: debounce 250ms và hỗ trợ tìm kiếm, đổi trang", async () => {
  const { useContentSources, calls } = setupSourcesHook();
  const fixture = await mountHook(useContentSources, {
    paginated: true,
    pageSize: 10,
  });
  mounted.push(fixture);

  // Chưa hết debounce thì chưa gọi
  assert.equal(calls.length, 0);

  await act(async () => wait(DEBOUNCE));
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], [
    "fetch",
    { search: undefined, page: 1, size: 10 },
  ]);
  assert.equal(fixture.current().sources.length, 2);
  assert.equal(fixture.current().totalPages, 2);

  // Đổi trang
  await act(async () => fixture.current().setPage(2));
  await act(async () => wait(DEBOUNCE));

  assert.equal(calls.length, 2);
  assert.deepEqual(calls[1], [
    "fetch",
    { search: undefined, page: 2, size: 10 },
  ]);

  // Tìm kiếm
  await act(async () => fixture.current().setSearch("Oxford"));
  await act(async () => wait(DEBOUNCE));

  assert.equal(calls.length, 3);
  assert.deepEqual(calls[2], [
    "fetch",
    { search: "Oxford", page: 2, size: 10 },
  ]);
});

test("addSource gọi API tạo nguồn và đồng bộ danh sách qua listener", async () => {
  const { useContentSources, calls } = setupSourcesHook();
  const fixture = await mountHook(useContentSources, undefined);
  mounted.push(fixture);

  assert.equal(calls.length, 1);

  let res;
  await act(async () => {
    res = await fixture.current().addSource({
      title: "New Dict",
      sourceType: "EXTERNAL",
      licenseCode: "CC-BY",
      attribution: "Attrib",
    });
  });

  assert.ok(res.source);
  assert.equal(res.source.title, "New Dict");
  assert.equal(calls[1][0], "create");
  assert.equal(calls[1][1].title, "New Dict");
});

function loadAdminComponent(file, exportName, mocks = {}) {
  const source = fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.React,
    },
  }).outputText;
  const mod = { exports: {} };
  const icons = new Proxy(
    {},
    {
      get: (_, prop) => {
        const Comp = (props) =>
          React.createElement("span", { "data-icon": String(prop), ...props });
        return Comp;
      },
    }
  );
  const localRequire = (name) => {
    if (name === "react") return React;
    if (name === "lucide-react") return icons;
    if (mocks[name]) return mocks[name];
    return {};
  };
  new Function("require", "module", "exports", "React", compiled)(
    localRequire,
    mod,
    mod.exports,
    React
  );
  return mod.exports[exportName];
}

function collectText(node) {
  if (!node) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(collectText).join(" ");
  if (node.children) return collectText(node.children);
  return "";
}

test("SourceTable hiển thị đúng các cột và TUYỆT ĐỐI KHÔNG có nút Sửa hoặc Xóa", () => {
  const mockSources = [
    sourceItem("s1", "Oxford Learner's Dictionaries"),
    sourceItem("s2", "Cambridge Advanced Learner's"),
  ];

  const PaginationMock = () => React.createElement("div", { "data-testid": "pagination" });
  const AdminFilterBarMock = ({ children, search, onSearchChange, placeholder }) =>
    React.createElement(
      "div",
      { "data-testid": "filter-bar" },
      React.createElement("input", {
        value: search,
        placeholder,
        onChange: (e) => onSearchChange(e.target.value),
      }),
      children
    );

  const SourceTable = loadAdminComponent(
    "src/features/admin/components/content/source-table.tsx",
    "SourceTable",
    {
      "@/components/pagination": { Pagination: PaginationMock },
      "../../hooks/use-content-sources": {
        useContentSources: () => ({
          sources: mockSources,
          totalCount: 2,
          totalPages: 1,
          search: "",
          setSearch: () => {},
          page: 1,
          setPage: () => {},
          isLoading: false,
          error: null,
          reload: async () => {},
          addSource: async () => ({ source: null, error: null }),
        }),
      },
      "../admin-filter-bar": { AdminFilterBar: AdminFilterBarMock },
      "./create-source-modal": { CreateSourceModal: () => null },
    }
  );

  let root;
  act(() => {
    root = create(React.createElement(SourceTable));
  });

  const text = collectText(root.toJSON());

  // Kiểm tra hiển thị tiêu đề và nội dung các cột
  assert.ok(text.includes("Nguồn trích dẫn"));
  assert.ok(text.includes("Loại nguồn"));
  assert.ok(text.includes("Tác giả"));
  assert.ok(text.includes("Giấy phép"));
  assert.ok(text.includes("Trạng thái"));
  assert.ok(text.includes("Ngày tạo"));
  assert.ok(text.includes("Oxford Learner's Dictionaries"));
  assert.ok(text.includes("Cambridge Advanced Learner's"));
  assert.ok(text.includes("Thêm nguồn mới"));

  // TUYỆT ĐỐI KHÔNG có nút Sửa, Edit, Xóa, Delete
  assert.equal(text.includes("Sửa"), false);
  assert.equal(text.includes("Edit"), false);
  assert.equal(text.includes("Xóa"), false);
  assert.equal(text.includes("Delete"), false);
});
