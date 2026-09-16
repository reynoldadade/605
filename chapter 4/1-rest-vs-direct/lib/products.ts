// Server-only data layer. Safe to import from any Server Component,
// unsafe to import from anything marked "use client" — see Chapter 3's
// "A Client Boundary Drags Its Whole Import Graph With It".
import { db } from "./db";

export async function getProduct(id: string) {
  return db.product.findUnique({ where: { id } });
}
