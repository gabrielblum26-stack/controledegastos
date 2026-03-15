import { NextResponse } from "next/server";
import { getMonthlySummary } from "@/lib/summary";

export async function GET() {
  const summary = await getMonthlySummary();
  return NextResponse.json(summary);
}
