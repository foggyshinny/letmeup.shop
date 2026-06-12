import { NextResponse } from "next/server";
import { SELLER_SESSION_COOKIE } from "@/lib/seller";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SELLER_SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
