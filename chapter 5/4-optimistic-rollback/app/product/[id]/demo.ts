"use server";

import { cookies } from "next/headers";

// Development-only switches, per section 7's Tip: an artificial delay so
// the optimistic state is visible, and a forced failure so the rollback
// can be watched. Stored in a cookie so the action can read them.
export type DemoMode = "ok" | "stale" | "error" | "throw";

export async function setDemoMode(formData: FormData) {
  const jar = await cookies();
  jar.set("demo-mode", String(formData.get("mode") ?? "ok"));
  jar.set("demo-delay", String(formData.get("delay") ?? "1500"));
}
