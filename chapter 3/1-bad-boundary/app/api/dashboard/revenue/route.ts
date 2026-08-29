import { NextResponse } from "next/server";
import { getRevenue, type Range } from "../../../../lib/mock-data";

export async function GET(request: Request) {
  const range = (new URL(request.url).searchParams.get("range") ?? "30d") as Range;
  const revenue = await getRevenue(range);
  return NextResponse.json(revenue);
}
