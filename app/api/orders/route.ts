import { NextResponse } from "next/server";
import { findCoupon } from "@/lib/catalog";
import { listOrdersByOwner, newOrderId, saveOrder } from "@/lib/store";
import { getOwnerId } from "@/lib/device";
import type { CartLine, Order, OrderItem } from "@/lib/types";

/** 현재 소유자(회원/기기)의 구매내역 */
export async function GET() {
  const ownerId = await getOwnerId();
  return NextResponse.json({ orders: await listOrdersByOwner(ownerId) });
}

interface CreateOrderBody {
  items: CartLine[];
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string;
}

export async function POST(req: Request) {
  let body: CreateOrderBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const { items, buyerName, buyerPhone, buyerEmail } = body;

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "주문 상품이 없습니다." }, { status: 400 });
  }
  if (!buyerName || !buyerPhone || !buyerEmail) {
    return NextResponse.json({ error: "구매자 정보를 모두 입력해 주세요." }, { status: 400 });
  }

  // 금액은 서버 데이터 기준으로 재계산 (클라이언트 값 신뢰하지 않음)
  const orderItems: OrderItem[] = [];
  for (const line of items) {
    const coupon = await findCoupon(line.couponId);
    if (!coupon) {
      return NextResponse.json(
        { error: `존재하지 않는 쿠폰입니다: ${line.couponId}` },
        { status: 400 },
      );
    }
    const qty = Math.max(1, Math.floor(line.qty));
    if (coupon.stock !== null && qty > coupon.stock) {
      return NextResponse.json(
        { error: `재고가 부족합니다: ${coupon.title}` },
        { status: 409 },
      );
    }
    orderItems.push({
      couponId: coupon.id,
      title: coupon.title,
      brand: coupon.brand,
      unitPrice: coupon.price,
      qty,
    });
  }

  const amount = orderItems.reduce((s, it) => s + it.unitPrice * it.qty, 0);
  const ownerId = await getOwnerId();

  const order: Order = {
    id: newOrderId(),
    ownerId,
    items: orderItems,
    amount,
    buyerName,
    buyerPhone,
    buyerEmail,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  await saveOrder(order);

  return NextResponse.json({ orderId: order.id, amount: order.amount });
}
