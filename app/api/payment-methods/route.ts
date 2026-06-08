import { NextResponse } from "next/server";
import { getDeviceId } from "@/lib/device";
import { addPaymentMethod, listPaymentMethods, newId } from "@/lib/store";
import { registerBillingKey } from "@/lib/ksnet";
import type { PayMethod, SavedPaymentMethod } from "@/lib/types";

const SIMPLE_PAY_LABEL: Partial<Record<PayMethod, string>> = {
  applepay: "Apple Pay",
  googlepay: "Google Pay",
  kakaopay: "카카오페이",
  naverpay: "네이버페이",
  samsungpay: "삼성페이",
};

export async function GET() {
  const deviceId = await getDeviceId();
  // 빌링키는 서버 전용 — 클라이언트 응답에서 제거
  const safe = listPaymentMethods(deviceId).map(({ billingKey: _bk, ...rest }) => {
    void _bk;
    return rest;
  });
  return NextResponse.json({ paymentMethods: safe });
}

export async function POST(req: Request) {
  const deviceId = await getDeviceId();
  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const type = (body.type ?? "card") as PayMethod;

  // 간편결제 수단(애플페이 등) 연결 — 별도 카드정보 없이 등록
  if (type !== "card") {
    const label = SIMPLE_PAY_LABEL[type];
    if (!label) {
      return NextResponse.json({ error: "지원하지 않는 결제수단입니다." }, { status: 400 });
    }
    const pm: SavedPaymentMethod = {
      id: newId("PM"),
      type,
      label,
      createdAt: new Date().toISOString(),
    };
    addPaymentMethod(deviceId, pm);
    return NextResponse.json({ paymentMethod: pm });
  }

  // 카드 등록 → KSNET 빌링키 발급
  const { number, expMonth, expYear, holder, birth, password2 } = body;
  if (!number || !expMonth || !expYear) {
    return NextResponse.json({ error: "카드 정보를 모두 입력해 주세요." }, { status: 400 });
  }

  const result = await registerBillingKey({
    number,
    expMonth,
    expYear,
    holder,
    birth,
    password2,
  });
  if (!result.success || !result.billingKey) {
    return NextResponse.json(
      { error: result.message ?? "카드 등록에 실패했습니다." },
      { status: 422 },
    );
  }

  const pm: SavedPaymentMethod = {
    id: newId("PM"),
    type: "card",
    label: `${result.brand ?? "카드"} ****${result.last4 ?? "0000"}`,
    brand: result.brand,
    last4: result.last4,
    expMonth,
    expYear,
    billingKey: result.billingKey, // 카드번호는 저장하지 않음
    createdAt: new Date().toISOString(),
  };
  addPaymentMethod(deviceId, pm);

  // 빌링키는 응답에 노출하지 않음
  const { billingKey: _omit, ...safe } = pm;
  void _omit;
  return NextResponse.json({ paymentMethod: safe });
}
