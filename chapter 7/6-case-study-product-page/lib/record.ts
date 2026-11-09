import { appendFile, mkdir } from "node:fs/promises";

// Stand-in for an error tracker: one JSON line per report.
export async function record(file: string, data: unknown) {
  await mkdir("data", { recursive: true });
  await appendFile(`data/${file}`, JSON.stringify(data) + "\n");
}
