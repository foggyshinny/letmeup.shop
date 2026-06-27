import { NextResponse } from "next/server";
import { getOrder, updateOrder } from "@/lib/store";
import { approve, getKsnetConfig } from "@/lib/ksnet";
import { issueCouponsForOrder, sendCouponSms } from "@/lib/fulfill";
import { decrementStockForOrder } from "@/lib/inventory";

/**
 * KSNET 결제창 콜백(리턴) 처리.
 *
 * KSNET 결제창은 결제 인증 후 returnUrl로 결과를 POST(application/x-www-form-urlencoded)
 * 하는 것이 일반적입니다. 여기서 승인요청(approve)을 수행하고, 결과에 따라
 * 완료/실패 페이지로 리다이렉트합니다.
 *
 * TODO: 콜백 파라미터명(orderNo, authToken, resultCode 등)은 KSNET 매뉴얼 규격에
 *       맞춰 아래 파싱부를 조정하세요.
 */
async function handle(params: Record<string, string>) {
  const cfg = getKsnetConfig();
  const orderId = params.orderNo ?? params.ordrIdxx ?? params.orderId ?? "";
  const order = await getOrder(orderId);

  if (!order) {
    return NextResponse.redirect(`${cfg.baseUrl}/checkout/complete?order=${orderId}`, 303);
  }

  // 결제창에서 인증 실패로 돌아온 경우
  const authFailed =
    params.resultCode && params.resultCode !== "0000" && params.resultCode !== "success";
  if (authFailed) {
    await updateOrder(order.id, { status: "failed" });
    return NextResponse.redirect(`${cfg.baseUrl}/checkout/complete?order=${order.id}`, 303);
  }

  // 최종 승인요청
  const result = await approve(order, params);
  if (result.success) {
    // 재고 차감 + 쿠폰 코드 자동 발급 + 문자(비즈뿌리오) 발송
    await decrementStockForOrder(order);
    const issued = issueCouponsForOrder(order);
    const smsSent = await sendCouponSms(order, issued);
    await updateOrder(order.id, {
      status: "paid",
      issuedCoupons: issued,
      smsSent,
      payment: {
        provider: "ksnet",
        tid: result.tid,
        approvalNo: result.approvalNo,
        method: result.method,
        approvedAt: new Date().toISOString(),
      },
    });
  } else {
    await updateOrder(order.id, { status: "failed" });
  }

  return NextResponse.redirect(`${cfg.baseUrl}/checkout/complete?order=${order.id}`, 303);
}

export async function POST(req: Request) {
  const form = await req.formData();
  const params: Record<string, string> = {};
  form.forEach((v, k) => (params[k] = String(v)));
  return handle(params);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const params: Record<string, string> = {};
  url.searchParams.forEach((v, k) => (params[k] = v));
  return handle(params);
}
