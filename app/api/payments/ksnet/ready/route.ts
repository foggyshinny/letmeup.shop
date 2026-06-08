import { NextResponse } from "next/server";
import { getDeviceId } from "@/lib/device";
import { getOrder, getPaymentMethod, updateOrder } from "@/lib/store";
import {
  approve,
  buildPaymentRequest,
  isLive,
  ksnetSupportsMethod,
  payWithBillingKey,
} from "@/lib/ksnet";
import type { ApprovalResult } from "@/lib/ksnet";
import type { PayMethod } from "@/lib/types";

/**
 * 결제 준비 엔드포인트.
 *
 * 결제수단(method)에 따라 분기합니다:
 * - "saved": 저장된 카드의 빌링키로 즉시 자동결제 (서버 승인)
 * - 그 외(card/applepay/kakaopay ...):
 *     실거래 모드 → KSNET 결제창 폼(action/fields) 반환 (간편결제는 payMethod로 전달)
 *     모의 모드   → 즉시 승인 처리
 */
export async function POST(req: Request) {
  let body: { orderId?: string; method?: PayMethod; paymentMethodId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const { orderId, method = "card", paymentMethodId } = body;
  const order = orderId ? getOrder(orderId) : undefined;
  if (!order) {
    return NextResponse.json({ error: "주문을 찾을 수 없습니다." }, { status: 404 });
  }
  if (order.status === "paid") {
    return NextResponse.json({ error: "이미 결제된 주문입니다." }, { status: 409 });
  }

  const settle = (result: ApprovalResult) => {
    if (!result.success) {
      updateOrder(order.id, { status: "failed" });
      return NextResponse.json({ mode: "settled", approved: false, message: result.message });
    }
    updateOrder(order.id, {
      status: "paid",
      payment: {
        provider: "ksnet",
        tid: result.tid,
        approvalNo: result.approvalNo,
        method: result.method,
        approvedAt: new Date().toISOString(),
      },
    });
    return NextResponse.json({ mode: "settled", approved: true, orderId: order.id });
  };

  // ── 저장된 카드(빌링키) 자동결제 ──
  if (method === "saved") {
    const deviceId = await getDeviceId();
    const pm = paymentMethodId ? getPaymentMethod(deviceId, paymentMethodId) : undefined;
    if (!pm || !pm.billingKey) {
      return NextResponse.json({ error: "선택한 결제수단을 찾을 수 없습니다." }, { status: 400 });
    }
    return settle(await payWithBillingKey(order, pm.billingKey));
  }

  // ── 실거래 모드: KSNET 결제창으로 ──
  if (isLive() && (method === "card" || ksnetSupportsMethod(method))) {
    const request = buildPaymentRequest(order, method);
    return NextResponse.json({ mode: "live", method, ...request });
  }

  // ── 모의 모드: 즉시 승인 ──
  return settle(await approve(order, { method }));
}
