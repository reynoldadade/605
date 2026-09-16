// A plain route handler wired to the same store/tag, purely so this
// example's on-demand invalidation can be triggered with a single curl
// request for testing. The page itself uses the Server Action in
// app/actions.ts — this route isn't part of that story, just this
// example's own test harness.
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { reviewsStore } from "@/lib/reviews-store";

export async function POST(request: Request) {
  const { text } = await request.json();
  reviewsStore.push({ id: `r${reviewsStore.length + 1}`, text });
  revalidateTag("reviews");
  return NextResponse.json({ ok: true, count: reviewsStore.length });
}
