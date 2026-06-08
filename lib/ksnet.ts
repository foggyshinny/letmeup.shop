import crypto from "crypto";
import type { Order } from "./types";

/**
 * KSNET PG 연동 어댑터.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * ⚠️ 실제 연동에 필요한 값(가맹점 ID, 라이선스/머천트 키, API 엔드포인트 등)은
 *    아직 비어 있습니다. 아래 환경변수만 채우면 실거래 모드로 동작합니다.
 *    값이 비어 있으면 자동으로 "모의(mock) 모드"로 동작해, PG 연동 없이도
 *    장바구니 → 결제 → 완료 플로우 전체를 개발/시연할 수 있습니다.
 *
 * 필요한 환경변수 (.env.local 또는 Amplify 환경변수):
 *   KSNET_MID            가맹점 ID (Merchant ID)
 *   KSNET_MERCHANT_KEY   가맹점 라이선스/서명 키 (해시 서명용)
 *   KSNET_API_BASE       승인 API 베이스 URL  (예: https://api.ksnet.co.kr)
 *   KSNET_PAY_URL        결제창 호출 URL
 *   NEXT_PUBLIC_BASE_URL 콜백 리턴 URL 구성을 위한 사이트 base URL
 *
 * 참고: KSNET 결제창 규격/파라미터명은 계약 상품(KSPAY 표준결제 등)에 따라
 *       다를 수 있습니다. 계약서/연동 매뉴얼 수령 후 buildPaymentRequest()의
 *       필드명만 맞춰주면 됩니다. (TODO 주석으로 표시)
 * ──────────────────────────────────────────────────────────────────────────
 */

export interface KsnetConfig {
  mid: string;
  merchantKey: string;
  apiBase: string;
  payUrl: string;
  baseUrl: string;
}

export function getKsnetConfig(): KsnetConfig {
  return {
    mid: process.env.KSNET_MID ?? "",
    merchantKey: process.env.KSNET_MERCHANT_KEY ?? "",
    apiBase: process.env.KSNET_API_BASE ?? "",
    payUrl: process.env.KSNET_PAY_URL ?? "",
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000",
  };
}

/** 실거래 모드 여부. 필수 값이 모두 채워졌을 때만 true */
export function isLive(cfg: KsnetConfig = getKsnetConfig()): boolean {
  return Boolean(cfg.mid && cfg.merchantKey && cfg.payUrl);
}

/**
 * 결제 요청 서명(해시) 생성.
 * KSNET은 보통 (MID + 주문번호 + 금액 + 키)를 SHA-256으로 해시합니다.
 * TODO: 실제 매뉴얼의 해시 대상 필드/순서/알고리즘에 맞게 조정.
 */
export function signRequest(cfg: KsnetConfig, orderId: string, amount: number): string {
  return crypto
    .createHash("sha256")
    .update(`${cfg.mid}${orderId}${amount}${cfg.merchantKey}`)
    .digest("hex");
}

export interface PaymentRequest {
  /** 결제창 액션 URL (POST 대상) */
  action: string;
  /** 결제창에 POST할 폼 필드 */
  fields: Record<string, string>;
}

/** KSNET 결제창 payMethod 코드 매핑 (간편결제 포함).
 *  TODO: 실제 매뉴얼의 결제수단 코드값으로 교체. */
const KSNET_PAY_METHOD: Record<string, string> = {
  card: "CARD",
  applepay: "APPLEPAY",
  googlepay: "GOOGLEPAY",
  kakaopay: "KAKAOPAY",
  naverpay: "NAVERPAY",
  samsungpay: "SAMSUNGPAY",
};

/**
 * 결제창 호출에 필요한 폼 데이터를 구성합니다.
 * @param method 결제수단(card/applepay/kakaopay ...). 간편결제는 결제창에 payMethod로 전달.
 * TODO: 필드명(payMethod, ordrIdxx, amount ...)을 KSNET 매뉴얼 규격으로 교체.
 */
export function buildPaymentRequest(order: Order, method = "card"): PaymentRequest {
  const cfg = getKsnetConfig();
  const returnUrl = `${cfg.baseUrl}/api/payments/ksnet/callback`;

  return {
    action: cfg.payUrl,
    fields: {
      mid: cfg.mid,
      orderNo: order.id,
      amount: String(order.amount),
      productName: summarize(order),
      buyerName: order.buyerName,
      buyerTel: order.buyerPhone,
      buyerEmail: order.buyerEmail,
      payMethod: KSNET_PAY_METHOD[method] ?? "CARD",
      returnUrl,
      signature: signRequest(cfg, order.id, order.amount),
    },
  };
}

/** 간편결제(애플페이 등)를 KSNET 결제창으로 처리할 수 있는 수단인지 */
export function ksnetSupportsMethod(method: string): boolean {
  return method in KSNET_PAY_METHOD;
}

export interface ApprovalResult {
  success: boolean;
  tid?: string;
  approvalNo?: string;
  method?: string;
  message?: string;
}

/**
 * 결제창 콜백 이후 최종 승인(요청) 처리.
 *
 * - 실거래 모드: KSNET 승인 API로 승인요청을 보냅니다.
 *   TODO: apiBase 경로/요청 바디/응답 파싱을 매뉴얼에 맞게 구현.
 * - 모의 모드: 항상 성공으로 처리해 플로우를 끝까지 확인할 수 있게 합니다.
 */
export async function approve(
  order: Order,
  callbackData: Record<string, string>,
): Promise<ApprovalResult> {
  const cfg = getKsnetConfig();

  if (!isLive(cfg)) {
    // ── 모의 모드 ──
    return {
      success: true,
      tid: "MOCK" + order.id,
      approvalNo: Math.random().toString().slice(2, 12),
      method: callbackData.method ?? "card",
      message: "모의 결제 승인 (KSNET 미설정)",
    };
  }

  // ── 실거래 모드 ──
  // TODO: 아래는 골격입니다. 실제 KSNET 승인 API 규격에 맞게 endpoint/payload 교체.
  try {
    const res = await fetch(`${cfg.apiBase}/v1/payments/approval`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mid: cfg.mid,
        orderNo: order.id,
        amount: order.amount,
        authToken: callbackData.authToken ?? callbackData.tid ?? "",
        signature: signRequest(cfg, order.id, order.amount),
      }),
    });
    const data = (await res.json()) as Record<string, string>;
    const ok = data.resultCode === "0000" || data.status === "approved";
    return {
      success: ok,
      tid: data.tid,
      approvalNo: data.approvalNo,
      method: data.payMethod ?? "card",
      message: data.resultMsg ?? (ok ? "승인 완료" : "승인 실패"),
    };
  } catch (e) {
    return { success: false, message: "승인 요청 중 오류: " + String(e) };
  }
}

// ── 결제수단 등록(빌링키) / 자동결제 ─────────────────────────────────────────

export interface CardInput {
  number: string; // 카드번호 (서버에 저장하지 않음)
  expMonth: string; // MM
  expYear: string; // YY
  birth?: string; // 생년월일 6자리 또는 사업자번호
  password2?: string; // 카드 비밀번호 앞 2자리
  holder?: string;
}

export interface BillingResult {
  success: boolean;
  billingKey?: string;
  brand?: string;
  last4?: string;
  message?: string;
}

/**
 * 카드 등록 → 빌링키(자동결제 키) 발급.
 *
 * 실거래: KSNET 빌링키 발급 API 호출. 카드 원문은 KSNET에 전달만 하고
 *         우리 서버에는 빌링키/브랜드/끝 4자리만 보관합니다(PCI 범위 최소화).
 * 모의 모드: 카드번호로부터 브랜드/끝4자리만 추출해 가짜 빌링키 발급.
 *
 * TODO: 실거래 시 endpoint/payload/응답 파싱을 KSNET 빌링키 매뉴얼에 맞게 구현.
 */
export async function registerBillingKey(card: CardInput): Promise<BillingResult> {
  const cfg = getKsnetConfig();
  const digits = card.number.replace(/\D/g, "");
  const last4 = digits.slice(-4);
  const brand = detectBrand(digits);

  if (!isLive(cfg)) {
    if (digits.length < 12) return { success: false, message: "카드번호를 확인해 주세요." };
    return {
      success: true,
      billingKey: "BKMOCK" + Math.random().toString(36).slice(2, 14).toUpperCase(),
      brand,
      last4,
      message: "모의 카드 등록 (KSNET 미설정)",
    };
  }

  try {
    const res = await fetch(`${cfg.apiBase}/v1/billing/keys`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mid: cfg.mid,
        cardNo: digits,
        expMonth: card.expMonth,
        expYear: card.expYear,
        birth: card.birth,
        cardPw: card.password2,
      }),
    });
    const data = (await res.json()) as Record<string, string>;
    const ok = data.resultCode === "0000";
    return {
      success: ok,
      billingKey: data.billingKey ?? data.bid,
      brand,
      last4,
      message: data.resultMsg,
    };
  } catch (e) {
    return { success: false, message: "카드 등록 중 오류: " + String(e) };
  }
}

/**
 * 저장된 빌링키로 자동결제(승인).
 * TODO: 실거래 시 KSNET 빌링 승인 API 규격에 맞게 구현.
 */
export async function payWithBillingKey(
  order: Order,
  billingKey: string,
): Promise<ApprovalResult> {
  const cfg = getKsnetConfig();

  if (!isLive(cfg)) {
    return {
      success: true,
      tid: "MOCK" + order.id,
      approvalNo: Math.random().toString().slice(2, 12),
      method: "saved",
      message: "모의 자동결제 승인 (KSNET 미설정)",
    };
  }

  try {
    const res = await fetch(`${cfg.apiBase}/v1/billing/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mid: cfg.mid,
        billingKey,
        orderNo: order.id,
        amount: order.amount,
        productName: summarize(order),
        signature: signRequest(cfg, order.id, order.amount),
      }),
    });
    const data = (await res.json()) as Record<string, string>;
    const ok = data.resultCode === "0000";
    return {
      success: ok,
      tid: data.tid,
      approvalNo: data.approvalNo,
      method: "saved",
      message: data.resultMsg,
    };
  } catch (e) {
    return { success: false, message: "자동결제 중 오류: " + String(e) };
  }
}

function detectBrand(digits: string): string {
  if (/^4/.test(digits)) return "VISA";
  if (/^5[1-5]/.test(digits)) return "Mastercard";
  if (/^3[47]/.test(digits)) return "AMEX";
  if (/^35/.test(digits)) return "JCB";
  if (/^62/.test(digits)) return "UnionPay";
  return "카드";
}

function summarize(order: Order): string {
  const first = order.items[0];
  if (!first) return "렛미업 쿠폰";
  const rest = order.items.length - 1;
  return rest > 0 ? `${first.title} 외 ${rest}건` : first.title;
}
