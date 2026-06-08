import crypto from "crypto";
import { cookies } from "next/headers";
import { getUser } from "./store";
import type { PublicUser, User } from "./types";

export const SESSION_COOKIE = "lmu_session";

/** 세션 서명 비밀키. 운영에서는 반드시 AUTH_SECRET 환경변수를 설정하세요. */
function secret(): string {
  return process.env.AUTH_SECRET ?? "dev-insecure-secret-change-me";
}

// ── 비밀번호 해시 (scrypt) ──────────────────────────────────────────────────

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const s = salt ?? crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, s, 64).toString("hex");
  return { hash, salt: s };
}

export function verifyPassword(password: string, salt: string, expected: string): boolean {
  const { hash } = hashPassword(password, salt);
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(expected, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// ── 세션 토큰 (HMAC 서명) ───────────────────────────────────────────────────

function sign(value: string): string {
  return crypto.createHmac("sha256", secret()).update(value).digest("hex");
}

export function createSessionToken(userId: string): string {
  return `${userId}.${sign(userId)}`;
}

export function verifySessionToken(token: string): string | null {
  const idx = token.lastIndexOf(".");
  if (idx < 0) return null;
  const userId = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = sign(userId);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return userId;
}

// ── 현재 세션 조회 ──────────────────────────────────────────────────────────

export async function getSessionUserId(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function getCurrentUser(): Promise<User | null> {
  const id = await getSessionUserId();
  if (!id) return null;
  return getUser(id) ?? null;
}

export function toPublicUser(u: User): PublicUser {
  return { id: u.id, email: u.email, name: u.name };
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
