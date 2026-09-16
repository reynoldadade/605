import { unstable_cache } from "next/cache";
import { db } from "./db";

export const getReviews = unstable_cache(
  async (productId: string) => {
    return db.review.findMany({ where: { productId } });
  },
  ["reviews"],
  { revalidate: 3600, tags: ["reviews"] }
);
