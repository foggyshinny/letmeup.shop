import { NextResponse } from "next/server";
import { getOrder, updateOrder } from "@/lib/store";
import { buildPaymentRequest, isLive, approve } from "@/lib/ksnet";

/**
 * 결제 준비 엔드포인트.
 * - 실거래 모드(KSNET 설정됨): 결제창 호출에 필요한 action/fields를 반환.
 *   클라이언트가 해당 폼을 KSNET 결제창으로 POST 전송한다.
 * - 모의 모드(미설정): 즉시 승인 처리 후 완료 신호를 반환.
 */
export async function POST(req: Request) {
  let orderId: string;
  try {
    ({ orderId } = await req.json());
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const order = getOrder(orderId);
  if (!order) {
    return NextResponse.json({ error: "주문을 찾을 수 없습니다." }, { status: 404 });
  }
  if (order.status === "paid") {
    return NextResponse.json({ error: "이미 결제된 주문입니다." }, { status: 409 });
  }

  // 실거래 모드: 결제창 폼 데이터 반환
  if (isLive()) {
    const request = buildPaymentRequest(order);
    return NextResponse.json({ mode: "live", ...request });
  }

  // 모의 모드: 바로 승인 처리
  const result = await approve(order, {});
  if (!result.success) {
    updateOrder(order.id, { status: "failed" });
    return NextResponse.json({ mode: "mock", approved: false, message: result.message });
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

  return NextResponse.json({ mode: "mock", approved: true, orderId: order.id });
}
