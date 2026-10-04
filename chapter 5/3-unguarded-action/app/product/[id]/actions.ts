"use server";

import { z } from "zod";
import { updateTag } from "next/cache";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/dal";
import { reviewSchema } from "./review-schema";

export type ReviewFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: { rating?: string[]; text?: string[] };
  values?: { rating: string; text: string };
};

export async function deleteReview(reviewId: string) {
  const user = await verifySession();
  if (!user) return { status: "error", message: "Please sign in." } as const;

  const where =
    user.role === "admin"
      ? { id: reviewId }
      : { id: reviewId, authorId: user.userId };

  const { count } = await db.review.deleteMany({ where });
  if (count === 0) {
    return { status: "error", message: "Review not found." } as const;
  }

  updateTag("reviews");
  return { status: "success" } as const;
}

export async function submitReview(
  productId: string,
  prevState: ReviewFormState,
  formData: FormData,
): Promise<ReviewFormState> {
  const user = await verifySession();
  if (!user) return { status: "error", message: "Sign in to post a review." };

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

  const purchased = await db.order.findFirst({
    where: { userId: user.userId, items: { some: { productId } } },
    select: { id: true },
  });
  if (!purchased) {
    return { status: "error", message: "Only customers who bought this product can review it." };
  }

  await db.review.create({
    data: { productId, authorId: user.userId, rating: parsed.data.rating, text: parsed.data.text },
  });
  updateTag("reviews");

  return { status: "success", message: "Thanks, your review is live." };
}
