"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { revalidateTag, updateTag } from "next/cache";
import { db } from "@/lib/db";
import { reviewSchema } from "./review-schema";

export type ReviewFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: { rating?: string[]; text?: string[] };
  values?: { rating: string; text: string };
};

export async function submitReview(
  productId: string,
  prevState: ReviewFormState,
  formData: FormData,
): Promise<ReviewFormState> {
  // --- demo switches (development only) ---
  const jar = await cookies();
  const mode = jar.get("demo-mode")?.value ?? "ok";
  const delay = Number(jar.get("demo-delay")?.value ?? 1500);
  await new Promise((r) => setTimeout(r, delay));
  // ----------------------------------------

  const raw = {
    rating: String(formData.get("rating") ?? ""),
    text: String(formData.get("text") ?? ""),
  };
  const parsed = reviewSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      values: raw,
    };
  }

  if (mode === "error") {
    // Stands in for any expected refusal (not signed in, not a buyer...).
    return {
      status: "error",
      message: "Only customers who bought this product can review it.",
      values: raw,
    };
  }
  if (mode === "throw") {
    throw new Error("Database unreachable (simulated)");
  }

  await db.review.create({
    data: { productId, rating: parsed.data.rating, text: parsed.data.text },
  });
  if (mode === "stale") {
    // Section 7's Note, made visible: stale-while-revalidate instead of
    // read-your-writes. The response re-renders from the stale cache.
    revalidateTag("reviews", "max");
  } else {
    updateTag("reviews");
  }

  return { status: "success", message: "Thanks, your review is live." };
}
