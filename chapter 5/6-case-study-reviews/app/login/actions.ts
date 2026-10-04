"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { encrypt } from "@/lib/session";

// Demo sign-in: pick a seeded user, no password. How the session cookie
// gets created is outside the chapter's scope; what matters is that it
// is signed on the server and verified on every request.
export async function signIn(formData: FormData) {
  const user = await db.user.findUnique({
    where: { id: String(formData.get("userId") ?? "") },
    select: { id: true, role: true },
  });
  if (!user) return;

  const token = await encrypt({ userId: user.id, role: user.role as "customer" | "admin" });
  (await cookies()).set("session", token, { httpOnly: true, sameSite: "lax", path: "/" });
  redirect("/");
}

export async function signOut() {
  (await cookies()).delete("session");
  redirect("/login");
}
