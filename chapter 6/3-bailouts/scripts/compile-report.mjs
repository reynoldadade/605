// npm run compile-report: run the React Compiler over every component in
// app/ and list what it compiled and what it skipped, with the reason.
// --annotation compiles only functions that opt in with "use memo".
// Same Babel plugin Next.js uses when reactCompiler is true.
import { transformFileSync } from "@babel/core";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ANNOTATION = process.argv.includes("--annotation");
const SRC = process.argv.slice(2).find((a) => !a.startsWith("--")) ?? "app";

const rows = [];
const files = readdirSync(SRC, { recursive: true })
  .map(String)
  // Next.js compiles client code only, so report only "use client" files.
  .filter((f) => /\.tsx?$/.test(f) && /^["']use client["']/.test(readFileSync(join(SRC, f), "utf8")))
  .sort();

for (const file of files) {
  transformFileSync(join(SRC, file), {
    babelrc: false,
    configFile: false,
    presets: ["@babel/preset-typescript"],
    plugins: [
      "@babel/plugin-syntax-jsx",
      ["babel-plugin-react-compiler", {
        compilationMode: ANNOTATION ? "annotation" : "infer",
        logger: {
          logEvent(_filename, e) {
            if (e.kind === "CompileSuccess") {
              rows.push({ file, fn: e.fnName, result: "compiled",
                detail: `${e.memoSlots} cache slots, ${e.memoBlocks} guarded blocks` });
            } else if (e.kind === "CompileError" || e.kind === "CompileSkip") {
              rows.push({ file, fn: e.fnName ?? "", result: "skipped",
                detail: e.detail?.reason ?? e.reason ?? e.kind });
            }
          },
        },
      }],
    ],
  });
}

// The compiler can report the same problem more than once per function.
const seen = new Set();
for (const r of rows) {
  const key = `${r.file}|${r.result}|${r.detail}`;
  if (seen.has(key)) continue;
  seen.add(key);
  if (!r.fn) r.fn = r.file.split("/").pop().replace(/\.tsx$/, "");
  console.log(`${r.file.padEnd(32)} ${String(r.fn).padEnd(16)} ${r.result.padEnd(9)} ${r.detail}`);
}
