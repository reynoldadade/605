"use client";

import type { Product, Review } from "@/lib/catalog";
import { Gallery } from "./Gallery";
import { PriceBlock } from "./PriceBlock";
import { SizePicker } from "./SizePicker";
import { ReviewList } from "./ReviewList";
import { LocalReviewComposer } from "./LocalReviewComposer";

// Same island, with the draft moved down into the composer (section 6).
export function ProductIslandMoved({ product, reviews }: { product: Product; reviews: Review[] }) {
  return (
    <>
      <Gallery images={product.images} />
      <PriceBlock price={product.price} />
      <SizePicker sizes={product.sizes} />
      <ReviewList reviews={reviews} />
      <LocalReviewComposer />
    </>
  );
}
