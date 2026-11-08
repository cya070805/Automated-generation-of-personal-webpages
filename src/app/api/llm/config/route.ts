import { NextResponse } from "next/server";
import { hasServerKey } from "@/lib/llm/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 只暴露「有没有」，不暴露 Key 本身 */
export async function GET() {
  return NextResponse.json(
    { hasServerKey: hasServerKey() },
    { headers: { "cache-control": "no-store" } },
  );
}
