import crypto from "crypto";
import { cookies } from "next/headers";

/**
 * 관리자 인증 (아이디 + 비밀번호 + Authy(TOTP) 2차 인증).
 *
 * 설정(환경변수):
 *   ADMIN_USERNAME      관리자 아이디 (기본: admin)
 *   ADMIN_PASSWORD      관리자 비밀번호 (미설정 시 개발용 기본값 사용)
 *   ADMIN_TOTP_SECRET   Authy/OTP 앱에 등록한 base32 시크릿
 *                       (미설정 시 개발용 데모 시크릿 사용 — 운영 전 반드시 설정)
 *   AUTH_SECRET         세션 서명 키
 */

export const ADMIN_COOKIE = "lmu_admin";

// 개발용 데모 TOTP 시크릿 (운영에서는 ADMIN_TOTP_SECRET 환경변수로 교체)
const DEV_TOTP_SECRET = "JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP";

export interface AdminConfig {
  username: string;
  password: string;
  totpSecret: string;
  /** 운영용 시크릿이 설정되었는지 (false면 데모 시크릿 사용 중) */
  totpConfigured: boolean;
}

export function getAdminConfig(): AdminConfig {
  return {
    username: process.env.ADMIN_USERNAME ?? "admin",
    password: process.env.ADMIN_PASSWORD ?? "letmeup-admin",
    totpSecret: process.env.ADMIN_TOTP_SECRET ?? DEV_TOTP_SECRET,
    totpConfigured: Boolean(process.env.ADMIN_TOTP_SECRET),
  };
}

function secret(): string {
  return process.env.AUTH_SECRET ?? "dev-insecure-secret-change-me";
}

function sign(value: string): string {
  return crypto.createHmac("sha256", secret()).update(value).digest("hex");
}

export function createAdminToken(username: string): string {
  const payload = `admin:${username}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyAdminToken(token: string): boolean {
  const idx = token.lastIndexOf(".");
  if (idx < 0) return false;
  const payload = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b) && payload.startsWith("admin:");
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  return token ? verifyAdminToken(token) : false;
}

/** 아이디/비밀번호 1차 검증 (타이밍 안전 비교) */
export function verifyCredentials(username: string, password: string): boolean {
  const cfg = getAdminConfig();
  const u = safeEqual(username, cfg.username);
  const p = safeEqual(password, cfg.password);
  return u && p;
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}
