import { NextResponse } from "next/server";
import { listByCategory } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") ?? undefined;
  return NextResponse.json({ coupons: await listByCategory(category) });
}
