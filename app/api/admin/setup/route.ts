import { NextResponse } from "next/server";
import { getAdminConfig } from "@/lib/admin";
import { otpauthUri } from "@/lib/totp";

/**
 * 관리자 OTP 설정 안내.
 * 운영용 시크릿(ADMIN_TOTP_SECRET)이 설정되지 않은 "데모 모드"일 때만
 * Authy 등록용 otpauth URI를 노출합니다. (실제 시크릿이 설정되면 비노출)
 */
export async function GET() {
  const cfg = getAdminConfig();
  if (cfg.totpConfigured) {
    return NextResponse.json({ configured: true });
  }
  return NextResponse.json({
    configured: false,
    username: cfg.username,
    secret: cfg.totpSecret,
    otpauthUri: otpauthUri(cfg.totpSecret, cfg.username),
  });
}
