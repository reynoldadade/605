import "server-only";
import { cookies } from "next/headers";

// A fake payment provider with the one property the chapter relies on:
// charges are idempotent by key. Its behavior is switched from the home
// page: approve, decline, or time out (the charge goes through, but our
// request never hears back, and the provider reports it by webhook).
export class PaymentTimeoutError extends Error {}

type Charge = { id: string; status: "approved" | "declined" };
const charges = new Map<string, Charge>(); // idempotencyKey -> charge
export const chargeLog: string[] = [];

export const payments = {
  async charge(input: { amount: number; customerId: string; idempotencyKey: string; webhookOrigin?: string }) {
    const mode = (await cookies()).get("demo-pay")?.value ?? "approve";
    await new Promise((r) => setTimeout(r, 300)); // network round trip

    const existing = charges.get(input.idempotencyKey);
    if (existing) return existing; // a retry: same charge, not a second one

    const charge: Charge = {
      id: `ch_${Math.random().toString(36).slice(2, 10)}`,
      status: mode === "decline" ? "declined" : "approved",
    };
    charges.set(input.idempotencyKey, charge);
    chargeLog.push(`${charge.id} ${charge.status} ${input.amount} key=${input.idempotencyKey}`);

    if (mode === "timeout") {
      // The provider did charge the card; we just never got the answer.
      setTimeout(() => {
        fetch(`${input.webhookOrigin}/api/payments/webhook`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Webhook-Secret": WEBHOOK_SECRET },
          body: JSON.stringify({ orderId: input.idempotencyKey, chargeId: charge.id, status: charge.status }),
        }).catch(() => {});
      }, 1500);
      throw new PaymentTimeoutError("Payment provider timed out");
    }
    return charge;
  },
};

export const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET ?? "dev-webhook-secret";
