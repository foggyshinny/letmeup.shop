import { NextResponse } from "next/server";
import { coupons } from "@/lib/data";

export function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const list = category ? coupons.filter((c) => c.category === category) : coupons;
  return NextResponse.json({ coupons: list });
}
