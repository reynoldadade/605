"use client";

import { useActionState } from "react";
import type { ReviewFormState } from "./actions";
import { REVIEW_MAX, REVIEW_MIN } from "./review-schema";
import SubmitButton from "./SubmitButton";
import PendingReview from "./PendingReview";

const initialState: ReviewFormState = { status: "idle" };

export default function ReviewComposerPE({
  action,
}: {
  action: (prev: ReviewFormState, formData: FormData) => Promise<ReviewFormState>;
}) {
  // The Server Action goes to useActionState directly, with no client
  // wrapper, so the form still submits before hydration and without JS.
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction}>
      <PendingReview />
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
  );
}
