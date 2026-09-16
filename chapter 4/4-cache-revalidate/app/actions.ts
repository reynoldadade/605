"use server";

import { revalidateTag } from "next/cache";
import { reviewsStore } from "@/lib/reviews-store";

export async function addReview(formData: FormData) {
  const text = String(formData.get("text") ?? "").trim();
  if (!text) return;

  reviewsStore.push({ id: `r${reviewsStore.length + 1}`, text });

  // Purges the cached reviews immediately, rather than waiting out
  // the 8-second revalidate window above.
  revalidateTag("reviews");
}
