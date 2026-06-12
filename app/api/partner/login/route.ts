import { NextResponse } from "next/server";
import { getSellerByEmail } from "@/lib/store";
import { verifyPassword } from "@/lib/auth";
import {
  SELLER_SESSION_COOKIE,
  createSellerToken,
  toPublicSeller,
} from "@/lib/seller";

export async function POST(req: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";

  const seller = await getSellerByEmail(email);
  if (!seller || !verifyPassword(password, seller.salt, seller.passwordHash)) {
    return NextResponse.json(
      { error: "이메일 또는 비밀번호가 올바르지 않습니다." },
      { status: 401 },
    );
  }
  if (seller.status === "suspended") {
    return NextResponse.json(
      { error: "정지된 판매자 계정입니다. 고객센터로 문의해 주세요." },
      { status: 403 },
    );
  }

  const res = NextResponse.json({ seller: toPublicSeller(seller) });
  res.cookies.set(SELLER_SESSION_COOKIE, createSellerToken(seller.id), {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
