"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { CheckoutState } from "./actions";

const initialState: CheckoutState = { status: "idle" };

function PlaceOrderButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? "Placing order..." : "Place order"}
    </button>
  );
}

export default function CheckoutForm({
  action,
}: {
  action: (prev: CheckoutState, formData: FormData) => Promise<CheckoutState>;
}) {
  const [state, formAction] = useActionState(action, initialState);
  return (
    <form action={formAction}>
      <PlaceOrderButton />
      {state.message && <p role="status">{state.message}</p>}
    </form>
  );
}
