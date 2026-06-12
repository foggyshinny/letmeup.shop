import type { Coupon } from "./types";
import { coupons as seedCoupons } from "./data";
import { getProduct, listAllProducts } from "./store";

/**
 * 스토어프론트 카탈로그 = 시드(플랫폼) 상품 + 판매자(파트너) 등록 상품.
 *
 * 시드 상품(lib/data.ts)은 번들에 포함돼 클라이언트/서버 어디서나 동기적으로 쓸 수 있고,
 * 판매자가 등록한 상품은 저장소(store)에서 비동기로 불러와 병합한다.
 * 노출되는 것은 status가 active(미지정 포함)인 상품뿐이다.
 *
 * 모든 함수는 async 이며 서버(라우트/서버 컴포넌트)에서만 호출해야 한다.
 * 클라이언트는 /api/coupons 를 통해 병합된 목록을 받는다.
 */

function isVisible(c: Coupon): boolean {
  return c.status !== "inactive";
}

/** 노출 가능한 전체 카탈로그(시드 + 판매자 상품). 판매자 상품을 앞에 노출. */
export async function listCatalog(): Promise<Coupon[]> {
  const sellerProducts = (await listAllProducts()).filter(isVisible);
  return [...sellerProducts, ...seedCoupons];
}

/** 단일 상품 조회. 시드에 없으면 저장소에서 조회. */
export async function findCoupon(id: string): Promise<Coupon | undefined> {
  const seed = seedCoupons.find((c) => c.id === id);
  if (seed) return seed;
  const product = await getProduct(id);
  return product && isVisible(product) ? product : undefined;
}

/** 카테고리 필터 */
export async function listByCategory(category?: string): Promise<Coupon[]> {
  const all = await listCatalog();
  return category ? all.filter((c) => c.category === category) : all;
}
