import { unstable_cache } from "next/cache";
import { db } from "./db";

export const getRecommendations = unstable_cache(
  async (productId: string) => {
    return db.recommendation.findMany({ where: { productId } });
  },
  ["recommendations"],
  { revalidate: 86400 }
);
