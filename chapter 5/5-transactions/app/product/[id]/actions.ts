"use server";

import { z } from "zod";
import { cookies } from "next/headers";
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
    where: { userId: user.userId, status: "paid", items: { some: { productId } } },
    select: { id: true },
  });
  if (!purchased) {
    return { status: "error", message: "Only customers who bought this product can review it." };
  }

  // The fast, friendly check. Not what makes the rule hold: two
  // concurrent requests can both pass it (see scripts/scenarios.mts).
  const already = await db.review.findFirst({
    where: { productId, authorId: user.userId },
    select: { id: true },
  });
  if (already) {
    console.info("[submitReview] duplicate stopped by the application check");
    return { status: "error", message: "You've already reviewed this product." };
  }

  const jar = await cookies();
  const failBetweenWrites = jar.get("demo-fail-between-writes")?.value === "1";
  // Demo only: widen the gap between check and write, the way network
  // latency to a real database server does, so concurrent requests overlap.
  const gap = Number(jar.get("demo-check-gap-ms")?.value ?? 0);
  if (gap) await new Promise((r) => setTimeout(r, gap));

  try {
    await db.$transaction(async (tx) => {
      await tx.review.create({
        data: { productId, authorId: user.userId, rating: parsed.data.rating, text: parsed.data.text },
      });

      if (failBetweenWrites) throw new Error("Simulated crash between the two writes");

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
      console.info("[submitReview] duplicate stopped by the unique constraint (P2002)");
      return { status: "error", message: "You've already reviewed this product." };
    }
    throw err;
  }

  updateTag("reviews");
  return { status: "success", message: "Thanks, your review is live." };
}
