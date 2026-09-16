import { cache } from "react";
import { db } from "./db";

export const getProduct = cache(async (id: string) => {
  return db.product.findUnique({ where: { id } });
});
