import { NextResponse } from "next/server";
import { createUser, getUserByEmail, newId } from "@/lib/store";
import {
  SESSION_COOKIE,
  createSessionToken,
  hashPassword,
  isValidEmail,
  toPublicUser,
} from "@/lib/auth";

export async function POST(req: Request) {
  let body: { email?: string; password?: string; name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const name = (body.name ?? "").trim();
  const password = body.password ?? "";

  if (!name) return NextResponse.json({ error: "이름을 입력해 주세요." }, { status: 400 });
  if (!isValidEmail(email))
    return NextResponse.json({ error: "이메일 형식을 확인해 주세요." }, { status: 400 });
  if (password.length < 8)
    return NextResponse.json({ error: "비밀번호는 8자 이상이어야 합니다." }, { status: 400 });
  if (getUserByEmail(email))
    return NextResponse.json({ error: "이미 가입된 이메일입니다." }, { status: 409 });

  const { hash, salt } = hashPassword(password);
  const user = createUser({
    id: newId("U"),
    email,
    name,
    passwordHash: hash,
    salt,
    createdAt: new Date().toISOString(),
  });

  const res = NextResponse.json({ user: toPublicUser(user) });
  res.cookies.set(SESSION_COOKIE, createSessionToken(user.id), {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
