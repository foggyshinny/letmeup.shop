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
  /** 판매자 표시명 (상호/브랜드). 마켓플레이스 노출용 */
  seller: string;
  badges: string[];
  /** 추천/인기 노출 */
  featured?: boolean;
  /** 판매자(파트너) ID. 시드/플랫폼 직접 상품은 비어 있음 */
  sellerId?: string;
  /** 판매 상태. 미지정(시드)은 active 취급 */
  status?: "active" | "inactive";
  /** 등록 일시(ISO). 시드는 비어 있을 수 있음 */
  createdAt?: string;
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

/** 결제 수단 종류 */
export type PayMethod =
  | "card" // 새 카드 결제 (KSNET 결제창)
  | "saved" // 저장된 카드 (빌링키 자동결제)
  | "applepay"
  | "googlepay"
  | "kakaopay"
  | "naverpay"
  | "samsungpay";

/** 사용자가 등록·저장한 결제수단 (실제 카드번호는 저장하지 않음, 빌링키만 보관) */
export interface SavedPaymentMethod {
  id: string;
  type: PayMethod;
  /** 표시용 라벨 (예: "신한카드 ****1234") */
  label: string;
  brand?: string;
  last4?: string;
  expMonth?: string;
  expYear?: string;
  /** KSNET 빌링키(자동결제 키). 카드번호 대신 이 값으로 결제 */
  billingKey?: string;
  isDefault?: boolean;
  createdAt: string;
}

/** 위치 수집 기록 (동의 기반) */
export interface LocationRecord {
  lat: number;
  lng: number;
  accuracy?: number;
  consentedAt: string;
}

/** 회원 */
export interface User {
  id: string;
  email: string;
  name: string;
  /** scrypt 해시 (원문 비밀번호는 저장하지 않음) */
  passwordHash: string;
  salt: string;
  createdAt: string;
}

/** 클라이언트에 노출 가능한 회원 정보 (민감값 제외) */
export interface PublicUser {
  id: string;
  email: string;
  name: string;
}

/** 판매자(파트너) 입점 상태 */
export type SellerStatus =
  | "pending" // 입점 신청 접수, 승인 대기
  | "approved" // 승인됨 (상품 판매 가능)
  | "suspended"; // 정지

/** 정산 계좌 정보 */
export interface SettlementAccount {
  bank: string;
  account: string;
  holder: string;
}

/** 판매자(파트너) 계정 */
export interface Seller {
  id: string;
  /** 로그인 이메일 */
  email: string;
  /** 담당자명 */
  name: string;
  /** 상호 / 브랜드명 (스토어 노출명) */
  businessName: string;
  /** 사업자등록번호 (선택) */
  bizNo?: string;
  phone: string;
  /** scrypt 해시 (원문 비밀번호는 저장하지 않음) */
  passwordHash: string;
  salt: string;
  status: SellerStatus;
  /** 판매 수수료율 (0~1). 기본 0.1 = 10% */
  commissionRate: number;
  /** 정산 계좌 */
  settlement?: SettlementAccount;
  /** 입점 소개 */
  intro?: string;
  createdAt: string;
  approvedAt?: string;
}

/** 클라이언트에 노출 가능한 판매자 정보 (민감값 제외) */
export interface PublicSeller {
  id: string;
  email: string;
  name: string;
  businessName: string;
  bizNo?: string;
  phone: string;
  status: SellerStatus;
  commissionRate: number;
  settlement?: SettlementAccount;
  intro?: string;
  createdAt: string;
  approvedAt?: string;
}

/** 결제 완료 시 자동 발급되는 개별 쿠폰(코드) */
export interface IssuedCoupon {
  couponId: string;
  title: string;
  /** 사용 가능한 쿠폰 코드 (예: LMU-AB12-CD34-EF56) */
  code: string;
  status: "issued" | "used";
  issuedAt: string;
}

export type OrderStatus =
  | "pending" // 결제창 진입 전/대기
  | "paid" // 결제 승인 완료
  | "failed" // 결제 실패
  | "canceled"; // 취소

export interface Order {
  id: string;
  /** 주문 소유자: 회원 ID 또는 익명 기기 ID */
  ownerId: string;
  items: OrderItem[];
  amount: number;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string;
  status: OrderStatus;
  createdAt: string;
  /** 결제 완료 시 자동 발급된 쿠폰 코드들 */
  issuedCoupons?: IssuedCoupon[];
  /** 쿠폰 코드 문자(비즈뿌리오) 발송 여부 */
  smsSent?: boolean;
  /** PG 승인 정보 (KSNET) */
  payment?: {
    provider: "ksnet";
    tid?: string;
    approvalNo?: string;
    method?: PayMethod | string;
    approvedAt?: string;
  };
}
