import crypto from "crypto";
import { cookies } from "next/headers";
import { getSeller } from "./store";
import type { PublicSeller, Seller } from "./types";

/**
 * 판매자(파트너) 인증. 회원(lmu_session)과 분리된 별도 세션을 사용한다.
 * 비밀번호 해시/검증은 lib/auth.ts 와 동일한 scrypt 방식을 재사용한다.
 */

export const SELLER_SESSION_COOKIE = "lmu_seller";

/** 기본 판매 수수료율 (10%). 환경변수로 조정 가능. */
export function defaultCommissionRate(): number {
  const v = Number(process.env.SELLER_COMMISSION_RATE);
  return Number.isFinite(v) && v >= 0 && v < 1 ? v : 0.1;
}

function secret(): string {
  return process.env.AUTH_SECRET ?? "dev-insecure-secret-change-me";
}

function sign(value: string): string {
  return crypto.createHmac("sha256", secret()).update(value).digest("hex");
}

export function createSellerToken(sellerId: string): string {
  const payload = `seller:${sellerId}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySellerToken(token: string): string | null {
  const idx = token.lastIndexOf(".");
  if (idx < 0) return null;
  const payload = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  if (!payload.startsWith("seller:")) return null;
  return payload.slice("seller:".length);
}

export async function getSessionSellerId(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(SELLER_SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySellerToken(token);
}

export async function getCurrentSeller(): Promise<Seller | null> {
  const id = await getSessionSellerId();
  if (!id) return null;
  return (await getSeller(id)) ?? null;
}

export function toPublicSeller(s: Seller): PublicSeller {
  return {
    id: s.id,
    email: s.email,
    name: s.name,
    businessName: s.businessName,
    bizNo: s.bizNo,
    phone: s.phone,
    status: s.status,
    commissionRate: s.commissionRate,
    settlement: s.settlement,
    intro: s.intro,
    createdAt: s.createdAt,
    approvedAt: s.approvedAt,
  };
}
