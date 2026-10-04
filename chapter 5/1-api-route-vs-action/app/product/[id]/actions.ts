"use server";

import { updateTag } from "next/cache";
import { db } from "@/lib/db";

// Section 2's deliberately unguarded version: no session check, no
// validation, no ownership check. Sections 4-6 add each one.
export async function submitReview(productId: string, formData: FormData) {
  const rating = Number(formData.get("rating"));
  const text = String(formData.get("text") ?? "");

  await db.review.create({ data: { productId, rating, text } });

  updateTag("reviews");
}

export async function deleteReview(reviewId: string) {
  await db.review.delete({ where: { id: reviewId } });
  updateTag("reviews");
}
