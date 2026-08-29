import { NextResponse } from "next/server";
import { getOrders, type Range } from "../../../../lib/mock-data";

export async function GET(request: Request) {
  const range = (new URL(request.url).searchParams.get("range") ?? "30d") as Range;
  const orders = await getOrders(range);
  return NextResponse.json(orders);
}
