import crypto from "crypto";
import type { IssuedCoupon, Order } from "./types";
import { sendSms } from "./sms";

/** 사람이 읽기 쉬운 쿠폰 코드 생성: LMU-AB12-CD34-EF56 */
export function generateCouponCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 혼동되는 0/O/1/I 제외
  const block = () =>
    Array.from(crypto.randomBytes(4))
      .map((b) => alphabet[b % alphabet.length])
      .join("");
  return `LMU-${block()}-${block()}-${block()}`;
}

/** 주문 항목(수량 포함)만큼 쿠폰 코드를 발급합니다. */
export function issueCouponsForOrder(order: Order): IssuedCoupon[] {
  const now = new Date().toISOString();
  const issued: IssuedCoupon[] = [];
  for (const item of order.items) {
    for (let i = 0; i < item.qty; i++) {
      issued.push({
        couponId: item.couponId,
        title: item.title,
        code: generateCouponCode(),
        status: "issued",
        issuedAt: now,
      });
    }
  }
  return issued;
}

/** 발급된 쿠폰 코드를 구매자에게 문자(비즈뿌리오)로 발송합니다. */
export async function sendCouponSms(
  order: Order,
  issued: IssuedCoupon[],
): Promise<boolean> {
  const lines = issued.map((c) => `• ${c.title}\n  ${c.code}`).join("\n");
  const text =
    `[렛미업] 결제가 완료되었습니다.\n주문번호 ${order.id}\n\n` +
    `발급된 쿠폰 코드\n${lines}\n\n` +
    `사용/조회: letmeup.shop`;
  const res = await sendSms(order.buyerPhone, text, "렛미업 쿠폰 발급");
  return res.success;
}
