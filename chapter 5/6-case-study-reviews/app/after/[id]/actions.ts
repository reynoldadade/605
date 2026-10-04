"use server";

import { z } from "zod";
import { updateTag } from "next/cache";
import { Prisma } from "@/lib/generated/prisma/client";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/dal";
import { reviewSchema } from "./review-schema";

export type ReviewFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: { rating?: string[]; text?: string[] };
  values?: { rating: string; text: string };
};

// AFTER: every action is a front door. The same six steps, in order.
export async function submitReview(
  productId: string,
  prevState: ReviewFormState,
  formData: FormData,
): Promise<ReviewFormState> {
  // 1. Authenticate: identity from the verified session, never the form
  const user = await verifySession();
  if (!user) return { status: "error", message: "Sign in to post a review." };

  // 2. Validate shape: pick the expected fields, parse, keep the input
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

  // 3. Authorize: this user, this product (also proves the product exists)
  const purchased = await db.order.findFirst({
    where: { userId: user.userId, status: "paid", items: { some: { productId } } },
    select: { id: true },
  });
  if (!purchased) {
    return { status: "error", message: "Only customers who bought this product can review it.", values: raw };
  }

  // 4. Mutate, transactionally; the unique constraint has the last word
  try {
    await db.$transaction(async (tx) => {
      await tx.review.create({
        data: { productId, authorId: user.userId, rating: parsed.data.rating, text: parsed.data.text },
      });
      const summary = await tx.review.aggregate({
        where: { productId },
        _avg: { rating: true },
        _count: true,
      });
      await tx.product.update({
        where: { id: productId },
        data: { ratingAverage: summary._avg.rating ?? 0, ratingCount: summary._count },
      });
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { status: "error", message: "You've already reviewed this product." };
    }
    throw err;
  }

  // 5. Invalidate, after the commit, with read-your-writes semantics
  updateTag("reviews");

  // 6. Report back: a shaped result, nothing the reader shouldn't see
  return { status: "success", message: "Thanks, your review is live." };
}
