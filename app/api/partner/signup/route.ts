import { NextResponse } from "next/server";
import { createSeller, getSellerByEmail, newId } from "@/lib/store";
import { hashPassword, isValidEmail } from "@/lib/auth";
import {
  SELLER_SESSION_COOKIE,
  createSellerToken,
  defaultCommissionRate,
  toPublicSeller,
} from "@/lib/seller";
import type { Seller } from "@/lib/types";

export async function POST(req: Request) {
  let body: {
    email?: string;
    password?: string;
    name?: string;
    businessName?: string;
    phone?: string;
    bizNo?: string;
    intro?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const name = (body.name ?? "").trim();
  const businessName = (body.businessName ?? "").trim();
  const phone = (body.phone ?? "").trim();
  const password = body.password ?? "";

  if (!businessName) return NextResponse.json({ error: "상호/브랜드명을 입력해 주세요." }, { status: 400 });
  if (!name) return NextResponse.json({ error: "담당자명을 입력해 주세요." }, { status: 400 });
  if (!phone) return NextResponse.json({ error: "연락처를 입력해 주세요." }, { status: 400 });
  if (!isValidEmail(email))
    return NextResponse.json({ error: "이메일 형식을 확인해 주세요." }, { status: 400 });
  if (password.length < 8)
    return NextResponse.json({ error: "비밀번호는 8자 이상이어야 합니다." }, { status: 400 });
  if (await getSellerByEmail(email))
    return NextResponse.json({ error: "이미 가입된 판매자 이메일입니다." }, { status: 409 });

  const { hash, salt } = hashPassword(password);
  const seller: Seller = {
    id: newId("S"),
    email,
    name,
    businessName,
    bizNo: (body.bizNo ?? "").trim() || undefined,
    phone,
    passwordHash: hash,
    salt,
    status: "pending",
    commissionRate: defaultCommissionRate(),
    intro: (body.intro ?? "").trim() || undefined,
    createdAt: new Date().toISOString(),
  };
  await createSeller(seller);

  const res = NextResponse.json({ seller: toPublicSeller(seller) });
  res.cookies.set(SELLER_SESSION_COOKIE, createSellerToken(seller.id), {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
