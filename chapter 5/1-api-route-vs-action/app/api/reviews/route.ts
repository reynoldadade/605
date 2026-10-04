import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";

// The "before" version: a hand-written endpoint the form reaches with
// fetch. updateTag is Server Actions only, so a Route Handler has to use
// revalidateTag(tag, profile), which is stale-while-revalidate.
export async function POST(request: Request) {
  const body = (await request.json()) as {
    productId: string; rating: number; text: string;
  };

  await db.review.create({
    data: { productId: body.productId, rating: Number(body.rating), text: String(body.text) },
  });

  revalidateTag("reviews", "max");
  return Response.json({ ok: true });
}
