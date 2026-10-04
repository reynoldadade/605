import "server-only";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

// Chapter 4's slowest, least essential source. A cookie set from the
// home page takes it "down" so both versions of the page can be compared.
export async function getRecommendations(productId: string) {
  const down = (await cookies()).get("demo-recs-down")?.value === "1";
  await new Promise((r) => setTimeout(r, 600));
  if (down) throw new Error("Recommendations service unavailable");
  return db.product.findMany({
    where: { id: { not: productId } },
    select: { id: true, name: true },
  });
}
