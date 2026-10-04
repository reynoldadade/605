"use client";

import { useActionState, useOptimistic } from "react";
import type { ReviewFormState } from "./actions";
import { REVIEW_MAX, REVIEW_MIN } from "./review-schema";
import SubmitButton from "./SubmitButton";

type PendingReview = { key: string; rating: number; text: string };

const initialState: ReviewFormState = { status: "idle" };

export default function ReviewComposer({
  action,
}: {
  action: (prev: ReviewFormState, formData: FormData) => Promise<ReviewFormState>;
}) {
  const [pending, addPending] = useOptimistic<PendingReview[], PendingReview>(
    [],
    (current, review) => [...current, review],
  );

  const [state, formAction] = useActionState(
    async (prev: ReviewFormState, formData: FormData) => {
      addPending({
        key: crypto.randomUUID(),
        rating: Number(formData.get("rating")),
        text: String(formData.get("text") ?? ""),
      });
      return action(prev, formData);
    },
    initialState,
  );

  return (
    <section>
      {pending.map((r) => (
        <article key={r.key} className="review review--pending" aria-busy="true" data-testid="pending-review">
          <p>{"★".repeat(r.rating)}</p>
          <p>{r.text}</p>
          <p className="review__status">Posting...</p>
        </article>
      ))}

      <form action={formAction}>
        <select
          name="rating"
          required
          defaultValue={state.values?.rating ?? ""}
          aria-invalid={!!state.fieldErrors?.rating}
        >
          <option value="" disabled>Choose a rating</option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        {state.fieldErrors?.rating && <p className="field-error">{state.fieldErrors.rating[0]}</p>}

        <textarea
          name="text"
          required
          minLength={REVIEW_MIN}
          maxLength={REVIEW_MAX}
          defaultValue={state.values?.text ?? ""}
          aria-invalid={!!state.fieldErrors?.text}
        />
        {state.fieldErrors?.text && <p className="field-error">{state.fieldErrors.text[0]}</p>}

        <SubmitButton />
        {state.message && <p role="status">{state.message}</p>}
      </form>
    </section>
  );
}
