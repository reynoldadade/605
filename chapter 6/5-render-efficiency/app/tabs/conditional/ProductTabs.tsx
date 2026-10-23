"use client";

import { useState } from "react";
import { QuestionsPanel, ReviewsPanel, TabList } from "../panels";

// Hidden panels are unmounted, so their state is lost.
export function ProductTabs({ productId }: { productId: string }) {
  const [tab, setTab] = useState<"reviews" | "qa">("reviews");
  return (
    <>
      <TabList tab={tab} onSelect={setTab} />
      {tab === "reviews" && <ReviewsPanel productId={productId} />}
      {tab === "qa" && <QuestionsPanel productId={productId} />}
    </>
  );
}
