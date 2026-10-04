import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/session";

export type SessionUser = { userId: string; role: "customer" | "admin" };

export const verifySession = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get("session")?.value;
  if (!token) return null;

  const session = await decrypt(token);
  if (!session?.userId) return null;

  return { userId: session.userId, role: session.role };
});
