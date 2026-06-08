import { NextResponse } from "next/server";
import { ADMIN_COOKIE, createAdminToken, getAdminConfig, verifyCredentials } from "@/lib/admin";
import { verifyTotp } from "@/lib/totp";

export async function POST(req: Request) {
  let body: { username?: string; password?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const username = (body.username ?? "").trim();
  const password = body.password ?? "";
  const code = (body.code ?? "").trim();

  // 1차: 아이디/비밀번호
  if (!verifyCredentials(username, password)) {
    return NextResponse.json({ error: "아이디 또는 비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  // 2차: Authy(TOTP) 인증
  const cfg = getAdminConfig();
  if (!verifyTotp(cfg.totpSecret, code)) {
    return NextResponse.json({ error: "인증 코드가 올바르지 않습니다. (Authy 앱 확인)" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, createAdminToken(username), {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 8, // 8시간
  });
  return res;
}
