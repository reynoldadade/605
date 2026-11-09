import { record } from "@/lib/record";

export async function POST(request: Request) {
  let body: any;
  try {
    body = JSON.parse(await request.text());
  } catch {
    return new Response(null, { status: 400 });
  }
  await record("errors.ndjson", {
    source: String(body.source),
    error: body.error,
    digest: body.digest,
    path: String(body.path),
  });
  return new Response(null, { status: 204 });
}
