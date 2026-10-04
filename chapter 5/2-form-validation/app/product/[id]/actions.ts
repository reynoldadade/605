"use server";

import { z } from "zod";
import { updateTag } from "next/cache";
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

  const product = await db.product.findUnique({
    where: { id: productId },
    select: { id: true },
  });
  if (!product) {
    return { status: "error", message: "This product is no longer available." };
  }

  await db.review.create({
    data: { productId: product.id, rating: parsed.data.rating, text: parsed.data.text },
  });
  updateTag("reviews");

  return { status: "success", message: "Thanks, your review is live." };
}
