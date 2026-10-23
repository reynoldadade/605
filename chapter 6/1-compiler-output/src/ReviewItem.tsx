"use client";

export type Review = { id: string; rating: number; text: string };

export function ReviewItem({ review }: { review: Review }) {
  return <li>{"★".repeat(review.rating)} {review.text}</li>;
}
