import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { resolve, relative, dirname, sep } from "node:path";
import ts from "typescript";

const root = resolve("src/features");
const graph = new Map(
  readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => [entry.name, new Set()])
);
const edges = [];
let files = 0;
function scan(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const file = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      scan(file);
      continue;
    }
    if (!/\.(ts|tsx)$/.test(file) || file.endsWith(".test.ts")) continue;
    files++;
    const owner = relative(root, file).split(sep)[0];
    const ast = ts.createSourceFile(
      file,
      readFileSync(file, "utf8"),
      ts.ScriptTarget.Latest,
      true
    );
    for (const node of ast.statements) {
      if (
        (!ts.isImportDeclaration(node) && !ts.isExportDeclaration(node)) ||
        !node.moduleSpecifier ||
        !ts.isStringLiteral(node.moduleSpecifier)
      )
        continue;
      const specifier = node.moduleSpecifier.text;
      const target = specifier.startsWith("@/")
        ? resolve("src", specifier.slice(2))
        : specifier.startsWith(".")
          ? resolve(dirname(file), specifier)
          : null;
      if (!target) continue;
      const dependency = relative(root, target).split(sep)[0];
      if (owner === dependency || !graph.has(dependency)) continue;
      graph.get(owner).add(dependency);
      edges.push({
        from: owner,
        to: dependency,
        source: relative(process.cwd(), file),
        line: ast.getLineAndCharacterOfPosition(node.getStart()).line + 1,
      });
    }
  }
}

function rejectCycles(dependencies) {
  const done = new Set();
  function visit(name, path) {
    if (path.includes(name))
      throw new Error(
        `Circular feature dependency: ${[...path, name].join(" -> ")}`
      );
    if (done.has(name)) return;
    for (const next of dependencies.get(name) ?? [])
      visit(next, [...path, name]);
    done.add(name);
  }
  for (const name of dependencies.keys()) visit(name, []);
}
assert.throws(
  () =>
    rejectCycles(
      new Map([
        ["a", new Set(["b"])],
        ["b", new Set(["a"])],
      ])
    ),
  /a -> b -> a/
);
scan(root);
rejectCycles(graph);
console.log(
  JSON.stringify(
    {
      features: graph.size,
      files,
      dependencies: Object.fromEntries(
        [...graph].map(([key, value]) => [key, [...value].sort()])
      ),
      edges,
      cycles: [],
    },
    null,
    2
  )
);
