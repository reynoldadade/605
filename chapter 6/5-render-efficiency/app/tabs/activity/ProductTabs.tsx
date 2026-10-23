"use client";

import { Activity, useState } from "react";
import { QuestionsPanel, ReviewsPanel, TabList } from "../panels";

// Hidden panels stay mounted with their state; React hides their DOM,
// cleans up their effects, and renders them at the lowest priority.
export function ProductTabs({ productId }: { productId: string }) {
  const [tab, setTab] = useState<"reviews" | "qa">("reviews");
  return (
    <>
      <TabList tab={tab} onSelect={setTab} />
      <Activity mode={tab === "reviews" ? "visible" : "hidden"}>
        <ReviewsPanel productId={productId} />
      </Activity>
      <Activity mode={tab === "qa" ? "visible" : "hidden"}>
        <QuestionsPanel productId={productId} />
      </Activity>
    </>
  );
}
