"use server";

import { cookies } from "next/headers";

// Development-only switches, stored in cookies so actions can read them.
export async function setDemo(formData: FormData) {
  const jar = await cookies();
  jar.set("demo-pay", String(formData.get("pay") ?? "approve"));
  jar.set("demo-fail-between-writes", formData.get("failBetweenWrites") ? "1" : "0");
}
