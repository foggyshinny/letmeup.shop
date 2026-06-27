import type { Order } from "./types";
import { coupons as seedCoupons } from "./data";
import { getProduct, updateProduct } from "./store";

/**
 * 결제 성공 시 주문 항목만큼 재고를 차감한다.
 *
 * - 판매자(파트너) 상품: 저장소(store)에 영속되므로 getProduct → updateProduct 로 차감.
 * - 시드(플랫폼) 상품: lib/data.ts 의 인메모리 배열을 직접 차감(데모용, 재시작 시 초기화).
 * - stock 이 null(무제한)인 상품은 건드리지 않는다.
 *
 * 주의: 읽고-쓰는 비원자적 차감이라 동시성이 높은 운영 환경에서는
 *       조건부 업데이트(DynamoDB ConditionExpression) 등으로 보강이 필요하다.
 *       현재는 데모/저volume 가정.
 */
export async function decrementStockForOrder(order: Order): Promise<void> {
  // 같은 상품이 여러 줄로 들어와도 한 번에 합산해 차감
  const qtyById = new Map<string, number>();
  for (const item of order.items) {
    qtyById.set(item.couponId, (qtyById.get(item.couponId) ?? 0) + item.qty);
  }

  for (const [couponId, qty] of qtyById) {
    if (qty <= 0) continue;

    // 1) 판매자 상품 (저장소 영속)
    const product = await getProduct(couponId);
    if (product) {
      if (typeof product.stock === "number") {
        const next = Math.max(0, product.stock - qty);
        if (next !== product.stock) await updateProduct(couponId, { stock: next });
      }
      continue;
    }

    // 2) 시드(플랫폼) 상품 — 인메모리 배열 직접 차감 (best-effort)
    const seed = seedCoupons.find((c) => c.id === couponId);
    if (seed && typeof seed.stock === "number") {
      seed.stock = Math.max(0, seed.stock - qty);
    }
  }
}
