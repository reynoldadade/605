// Shared: no directive, no server-only I/O, no client-only API.
import { z } from "zod";

export const REVIEW_MIN = 10;
export const REVIEW_MAX = 2000;

export const reviewSchema = z.object({
  rating: z.coerce
    .number()
    .int()
    .min(1, "Pick a rating from 1 to 5")
    .max(5, "Pick a rating from 1 to 5"),
  text: z
    .string()
    .trim()
    .min(REVIEW_MIN, "Reviews need at least 10 characters")
    .max(REVIEW_MAX, "Reviews can be at most 2,000 characters"),
});
