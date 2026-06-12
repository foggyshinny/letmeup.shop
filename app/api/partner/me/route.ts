import { NextResponse } from "next/server";
import { getCurrentSeller, toPublicSeller } from "@/lib/seller";

export async function GET() {
  const seller = await getCurrentSeller();
  return NextResponse.json({ seller: seller ? toPublicSeller(seller) : null });
}
