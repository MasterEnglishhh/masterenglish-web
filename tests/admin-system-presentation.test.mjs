import fs from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { act, create } from "react-test-renderer";
import ts from "typescript";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function loadComponent(file, exportName) {
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

const KpiCard = loadComponent(
  "src/features/admin/components/overview/kpi-card.tsx",
  "KpiCard"
);
const SystemMeters = loadComponent(
  "src/features/admin/components/system/system-meters.tsx",
  "SystemMeters"
);
const FeatureFlagsPanel = loadComponent(
  "src/features/admin/components/system/feature-flags-panel.tsx",
  "FeatureFlagsPanel"
);
const AuditLogsTable = loadComponent(
  "src/features/admin/components/system/audit-logs-table.tsx",
  "AuditLogsTable"
);

function render(Component, props) {
  let r;
  act(() => {
    r = create(React.createElement(Component, props));
  });
  return r.toJSON();
}

function collectText(node) {
  if (!node) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(collectText).join(" ");
  if (node.children) return collectText(node.children);
  return "";
}

function findNodes(node, predicate) {
  const matches = [];
  if (!node || typeof node !== "object") return matches;
  if (predicate(node)) matches.push(node);
  if (Array.isArray(node)) {
    for (const child of node) matches.push(...findNodes(child, predicate));
  } else if (node.children) {
    matches.push(...findNodes(node.children, predicate));
  }
  return matches;
}

test("KpiCard handles null, zero, and positive changePercent without rendering trend for null", () => {
  // Case 1: null changePercent -> no trend element rendered, subValue rendered
  const nullCard = render(KpiCard, {
    kpi: {
      id: "total-users",
      title: "Người dùng đăng ký",
      value: "1,200",
      subValue: "950 hoạt động",
      changePercent: null,
      trendText: null,
      trendDirection: "neutral",
      iconName: "users",
    },
  });

  const nullTrends = findNodes(
    nullCard,
    (n) =>
      n.props &&
      typeof n.props.className === "string" &&
      n.props.className.includes("admin-kpi-trend")
  );
  assert.equal(
    nullTrends.length,
    0,
    "must not render trend element when changePercent is null"
  );
  assert.ok(
    collectText(nullCard).includes("950 hoạt động"),
    "subValue must be rendered when changePercent is null"
  );

  // Case 2: 0 changePercent -> trend element rendered, 0 is preserved
  const zeroCard = render(KpiCard, {
    kpi: {
      id: "zero-metric",
      title: "Không đổi",
      value: "100",
      subValue: "ổn định",
      changePercent: 0,
      trendText: "0.0% so với tuần trước",
      trendDirection: "neutral",
      iconName: "users",
    },
  });

  const zeroTrends = findNodes(
    zeroCard,
    (n) =>
      n.props &&
      typeof n.props.className === "string" &&
      n.props.className.includes("admin-kpi-trend")
  );
  assert.equal(
    zeroTrends.length,
    1,
    "trend element must be rendered when changePercent is 0"
  );
  assert.ok(collectText(zeroTrends[0]).includes("0.0%"));

  // Case 3: positive changePercent -> trend element rendered
  const posCard = render(KpiCard, {
    kpi: {
      id: "storage-r2",
      title: "Dung lượng R2",
      value: "42.8 GB",
      subValue: "/ 100 GB định mức",
      changePercent: 42.8,
      trendText: "42.8% tổng bộ nhớ",
      trendDirection: "neutral",
      iconName: "database",
    },
  });

  const posTrends = findNodes(
    posCard,
    (n) =>
      n.props &&
      typeof n.props.className === "string" &&
      n.props.className.includes("admin-kpi-trend")
  );
  assert.equal(posTrends.length, 1);
  assert.ok(collectText(posTrends[0]).includes("42.8%"));

  // Case 4: security-health returns "Chưa có dữ liệu"
  const healthCard = render(KpiCard, {
    kpi: {
      id: "security-health",
      title: "Trạng thái hệ thống",
      value: "Chưa có dữ liệu",
      subValue: null,
      changePercent: null,
      trendText: null,
      trendDirection: "neutral",
      iconName: "shield-check",
    },
  });
  assert.ok(collectText(healthCard).includes("Chưa có dữ liệu"));
  assert.ok(!collectText(healthCard).includes("99.98%"));
});

test("SystemMeters displays empty state without progress bar or fake metrics when AI list is empty", () => {
  const dummyStorage = {
    bucket: "masterenglish-media-r2",
    usedBytes: 1000,
    maxBytes: 10000,
    usedFormatted: "1 KB",
    limitFormatted: "10 KB",
    percentUsed: 10.0,
    filesCount: 5,
  };

  const emptyTree = render(SystemMeters, { storage: dummyStorage, ai: [] });

  const emptyText = collectText(emptyTree);
  assert.ok(
    emptyText.includes("Chưa có dữ liệu sử dụng AI"),
    "empty state text must be rendered"
  );
  assert.ok(
    !emptyText.includes("claude-3-5-haiku"),
    "must not include fake model"
  );
  assert.ok(
    !emptyText.includes("1M tokens/ngày"),
    "must not include fake daily limit"
  );
  assert.ok(
    !emptyText.includes("0.00M tokens"),
    "must not render fake zero usage"
  );

  // Filled AI metrics should render progress bar
  const filledTree = render(SystemMeters, {
    storage: dummyStorage,
    ai: [
      {
        provider: "Anthropic",
        model: "claude-3-5-sonnet",
        dailyTokenUsage: 500000,
        dailyTokenLimit: 2000000,
        percentUsed: 25.0,
        resetHours: 12,
      },
    ],
  });
  const filledText = collectText(filledTree);
  assert.ok(filledText.includes("claude-3-5-sonnet"));
  assert.ok(filledText.includes("25"));
});

test("FeatureFlagsPanel disables buttons and states runtime control is unsupported", () => {
  const flags = [
    {
      key: "ai_tutor_chat",
      name: "AI Tutor Context",
      description: "Mô tả",
      enabled: true,
      category: "AI",
      updatedAt: "2026-11-10T10:00:00Z",
    },
  ];

  const panel = render(FeatureFlagsPanel, {
    flags,
  });

  const text = collectText(panel);
  assert.ok(
    text.includes(
      "Chưa hỗ trợ điều khiển tính năng; trạng thái lưu chưa phản ánh hoạt động thực tế."
    ),
    "subtitle warning must be rendered"
  );

  const buttons = findNodes(panel, (n) => n.type === "button");
  assert.equal(buttons.length, 1);
  assert.equal(
    buttons[0].props.disabled,
    true,
    "button must have disabled property"
  );
});

test("AuditLogsTable provides stored entity types (WORD, DECK, CONTENT_REVISION, USER, FEATURE_FLAG) and excludes unpersisted types", () => {
  const tree = render(AuditLogsTable, {
    logs: [],
    totalLogs: 0,
    search: "",
    onSearchChange: () => {},
    selectedEntity: "ALL",
    onEntityChange: () => {},
  });

  const selects = findNodes(tree, (n) => n.type === "select");
  assert.equal(selects.length, 1);

  const options = findNodes(selects[0], (n) => n.type === "option");
  const optionValues = options.map((o) => o.props.value);

  // Exact supported entity options
  assert.deepEqual(optionValues, [
    "ALL",
    "USER",
    "WORD",
    "DECK",
    "CONTENT_REVISION",
    "FEATURE_FLAG",
  ]);

  // Unpersisted types must NOT be present
  assert.ok(!optionValues.includes("ROLE"), "ROLE must not be in audit filter");
  assert.ok(
    !optionValues.includes("CONTENT"),
    "CONTENT must not be in audit filter"
  );
  assert.ok(
    !optionValues.includes("SESSION"),
    "SESSION must not be in audit filter"
  );

  // Explanatory note about USER containing role & session
  const text = collectText(tree);
  assert.ok(
    text.includes(
      "Thao tác vai trò và phiên được lưu dưới đối tượng Người dùng (USER)."
    )
  );
});
