import { NextRequest, NextResponse } from "next/server";

const DEVICE_COOKIE = "lmu_did";

/**
 * 익명 기기 식별자 쿠키를 보장합니다.
 * 로그인 없이도 저장된 결제수단/위치를 기기 단위로 분리하기 위한 용도이며,
 * 실제 회원 시스템 도입 시 사용자 ID 기반으로 교체하세요.
 */
export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  if (!req.cookies.get(DEVICE_COOKIE)) {
    const id = "DID" + crypto.randomUUID().replace(/-/g, "");
    res.cookies.set(DEVICE_COOKIE, id, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|legacy).*)"],
};
