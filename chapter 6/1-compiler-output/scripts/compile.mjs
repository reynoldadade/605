// npm run compile: run the React Compiler over every file in src/, write
// the output to out/, and print what it did with each function.
// Same Babel plugin Next.js uses when reactCompiler is true.
import { transformFileSync } from "@babel/core";
import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

const SRC = process.argv[2] ?? "src";
const OUT = process.argv[3] ?? "out";
mkdirSync(OUT, { recursive: true });

const rows = [];
for (const file of readdirSync(SRC).sort()) {
  if (!/\.(t|j)sx?$/.test(file)) continue;
  const { code } = transformFileSync(join(SRC, file), {
    babelrc: false,
    configFile: false,
    presets: ["@babel/preset-typescript"],
    plugins: [
      "@babel/plugin-syntax-jsx",
      ["babel-plugin-react-compiler", {
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
  writeFileSync(join(OUT, basename(file).replace(/\.tsx?$/, ".js")), code + "\n");
}

for (const r of rows) {
  console.log(`${r.file.padEnd(18)} ${String(r.fn).padEnd(14)} ${r.result.padEnd(9)} ${r.detail}`);
}
