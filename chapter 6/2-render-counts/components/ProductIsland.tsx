"use client";

import { useState } from "react";
import type { Product, Review } from "@/lib/catalog";
import { Gallery } from "./Gallery";
import { PriceBlock } from "./PriceBlock";
import { SizePicker } from "./SizePicker";
import { ReviewList } from "./ReviewList";
import { ReviewComposer } from "./ReviewComposer";

// The review draft lives at the top of the island, so every keystroke
// re-runs this component, and (without the compiler) everything it renders.
export function ProductIsland({ product, reviews }: { product: Product; reviews: Review[] }) {
  const [draft, setDraft] = useState("");
  const [rating, setRating] = useState(5);

  return (
    <>
      <Gallery images={product.images} />
      <PriceBlock price={product.price} />
      <SizePicker sizes={product.sizes} />
      <ReviewList reviews={reviews} />
      <ReviewComposer
        draft={draft}
        onDraftChange={setDraft}
        rating={rating}
        onRatingChange={setRating}
      />
    </>
  );
}
