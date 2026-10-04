"use server";

import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";

// BEFORE: the first version that "works" in the browser. Everything it
// needs comes from the form, nothing is checked, and the two writes are
// independent of each other.
export async function postReview(formData: FormData) {
  const productId = String(formData.get("productId"));

  await db.review.create({
    data: {
      productId,
      authorId: String(formData.get("authorId")),
      rating: Number(formData.get("rating")),
      text: String(formData.get("text")),
    },
  });

  const summary = await db.review.aggregate({
    where: { productId },
    _avg: { rating: true },
    _count: true,
  });
  await db.product.update({
    where: { id: productId },
    data: { ratingAverage: summary._avg.rating ?? 0, ratingCount: summary._count },
  });

  revalidateTag("reviews", "max");
}
