import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";

// Chapter 4's cached read, in Next.js 16 form: "use cache" + cacheTag +
// cacheLife instead of unstable_cache. The "reviews" tag is what every
// action in this chapter purges with updateTag("reviews").
export async function getReviews(productId: string) {
  "use cache";
  cacheTag("reviews");
  cacheLife("hours");

  return db.review.findMany({
    where: { productId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, rating: true, text: true, createdAt: true, authorId: true,
      author: { select: { name: true } },
    },
  });
}

export async function getProduct(id: string) {
  "use cache";
  // Tagged "reviews" too: the rating summary changes when a review is posted.
  cacheTag("products", "reviews");
  cacheLife("minutes");

  return db.product.findUnique({
    where: { id },
    select: { id: true, name: true, price: true, ratingAverage: true, ratingCount: true },
  });
}
