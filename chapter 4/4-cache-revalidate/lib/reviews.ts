import { unstable_cache } from "next/cache";
import { reviewsStore } from "./reviews-store";

// revalidate is set to 8 seconds here (not the chapter's one-hour
// example) purely so the time-based half of this demo finishes in
// under a minute instead of under an hour.
export const getReviews = unstable_cache(
  async () => {
    return {
      reviews: [...reviewsStore],
      fetchedAt: new Date().toISOString(),
    };
  },
  ["reviews"],
  { revalidate: 8, tags: ["reviews"] }
);
