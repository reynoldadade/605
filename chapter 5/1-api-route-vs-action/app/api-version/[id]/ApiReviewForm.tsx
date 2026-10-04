"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function ApiReviewForm({ productId }: { productId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);

    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        rating: Number(data.get("rating")),
        text: String(data.get("text") ?? ""),
      }),
    });

    setBusy(false);
    if (res.ok) {
      form.reset();
      router.refresh(); // a second request, to re-render the page
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <select name="rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>
      <textarea name="text" />
      <button type="submit" disabled={busy}>Post review</button>
    </form>
  );
}
