"use server";

import { updateTag } from "next/cache";
import { db } from "@/lib/db";

// Section 2's version, unchanged: no session, no ownership check.
export async function deleteReview(reviewId: string) {
  await db.review.delete({ where: { id: reviewId } });
  updateTag("reviews");
}

// Section 5's "risky" return: whatever the query loaded goes back out.
export async function submitReviewLeaky(productId: string, rating: number, text: string) {
  return await db.review.create({
    data: { productId, rating, text, authorId: "u_bob" },
    include: { author: true },
  });
}
