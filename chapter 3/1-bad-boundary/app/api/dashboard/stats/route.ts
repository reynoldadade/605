import { NextResponse } from "next/server";
import { getDashboardStats, type Range } from "../../../../lib/mock-data";

export async function GET(request: Request) {
  const range = (new URL(request.url).searchParams.get("range") ?? "30d") as Range;
  const stats = await getDashboardStats(range);
  return NextResponse.json(stats);
}
