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

/**
 * 결제창 호출에 필요한 폼 데이터를 구성합니다.
 * TODO: 필드명(payMethod, ordrIdxx, amount ...)을 KSNET 매뉴얼 규격으로 교체.
 */
export function buildPaymentRequest(order: Order): PaymentRequest {
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
      returnUrl,
      signature: signRequest(cfg, order.id, order.amount),
    },
  };
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
      method: "card",
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

function summarize(order: Order): string {
  const first = order.items[0];
  if (!first) return "렛미업 쿠폰";
  const rest = order.items.length - 1;
  return rest > 0 ? `${first.title} 외 ${rest}건` : first.title;
}
