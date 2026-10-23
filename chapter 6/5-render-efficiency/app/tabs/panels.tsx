"use client";

import { useState } from "react";

export function ReviewsPanel({ productId }: { productId: string }) {
  return <p>Reviews for {productId}</p>;
}

// Holds local state: the question the reader is typing.
export function QuestionsPanel({ productId }: { productId: string }) {
  const [question, setQuestion] = useState("");
  return (
    <label>
      Ask about {productId}
      <textarea value={question} onChange={(e) => setQuestion(e.target.value)} />
    </label>
  );
}

export function TabList({ tab, onSelect }: { tab: string; onSelect: (t: "reviews" | "qa") => void }) {
  return (
    <div role="tablist">
      <button role="tab" aria-selected={tab === "reviews"} onClick={() => onSelect("reviews")}>Reviews</button>
      <button role="tab" aria-selected={tab === "qa"} onClick={() => onSelect("qa")}>Questions</button>
    </div>
  );
}
