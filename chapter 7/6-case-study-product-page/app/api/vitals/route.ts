import { record } from "@/lib/record";

export async function POST(request: Request) {
  let m: any;
  try { m = JSON.parse(await request.text()); } catch { return new Response(null, { status: 400 }); }
  if (typeof m?.name !== "string" || typeof m.value !== "number") return new Response(null, { status: 400 });
  await record("vitals.ndjson", { at: Date.now(), ...m });
  return new Response(null, { status: 204 });
}
