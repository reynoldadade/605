import "server-only";
import { SignJWT, jwtVerify } from "jose";

// A signed session cookie. Real applications usually get this from an
// auth library or hosted provider; the chapter's pattern works with any.
export type SessionPayload = { userId: string; role: "customer" | "admin" };

const key = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "dev-only-secret-change-me-dev-only-secret",
);

export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);
}

export async function decrypt(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify<SessionPayload>(token, key, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch {
    return null;
  }
}
