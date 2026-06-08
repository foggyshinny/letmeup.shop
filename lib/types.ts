export type CategoryId =
  | "cafe"
  | "food"
  | "beauty"
  | "culture"
  | "shopping"
  | "gift";

export interface Category {
  id: CategoryId;
  name: string;
  emoji: string;
  description: string;
}

export interface Coupon {
  id: string;
  title: string;
  brand: string;
  category: CategoryId;
  /** 실제 판매가 (원) */
  price: number;
  /** 정가 (원) — 할인율 계산용. price와 같으면 할인 없음 */
  listPrice: number;
  /** 카드 썸네일 배경 그라데이션 (tailwind classes) */
  thumb: string;
  summary: string;
  description: string;
  /** 유효기간 (예: "구매일로부터 60일") */
  validity: string;
  /** 사용처 안내 */
  usage: string[];
  /** 재고 수량 (null = 무제한) */
  stock: number | null;
  /** 판매자 (마켓플레이스 확장용) */
  seller: string;
  badges: string[];
  /** 추천/인기 노출 */
  featured?: boolean;
}

export interface CartLine {
  couponId: string;
  qty: number;
}

export interface OrderItem {
  couponId: string;
  title: string;
  brand: string;
  unitPrice: number;
  qty: number;
}

export type OrderStatus =
  | "pending" // 결제창 진입 전/대기
  | "paid" // 결제 승인 완료
  | "failed" // 결제 실패
  | "canceled"; // 취소

export interface Order {
  id: string;
  items: OrderItem[];
  amount: number;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string;
  status: OrderStatus;
  createdAt: string;
  /** PG 승인 정보 (KSNET) */
  payment?: {
    provider: "ksnet";
    tid?: string;
    approvalNo?: string;
    method?: string;
    approvedAt?: string;
  };
}
