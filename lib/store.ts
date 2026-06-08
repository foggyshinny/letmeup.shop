import type { LocationRecord, Order, SavedPaymentMethod, User } from "./types";

/**
 * 주문/결제수단/위치 임시 저장소.
 *
 * 지금은 프로세스 메모리에 보관합니다(개발/데모용). 실제 운영에서는
 * DynamoDB / RDS / Supabase 등으로 교체하세요. 교체 지점은 이 파일의
 * 함수 구현부뿐이며, 호출하는 쪽 코드는 그대로 둘 수 있도록 설계했습니다.
 */

// Next dev 환경의 HMR로 모듈이 재평가돼도 데이터가 유지되도록 globalThis에 보관
const g = globalThis as unknown as {
  __letmeupOrders?: Map<string, Order>;
  __letmeupPaymentMethods?: Map<string, SavedPaymentMethod[]>;
  __letmeupLocations?: Map<string, LocationRecord>;
  __letmeupUsers?: Map<string, User>;
  __letmeupUsersByEmail?: Map<string, string>;
};
const orders: Map<string, Order> = g.__letmeupOrders ?? new Map();
g.__letmeupOrders = orders;

// 회원
const users: Map<string, User> = g.__letmeupUsers ?? new Map();
g.__letmeupUsers = users;
const usersByEmail: Map<string, string> = g.__letmeupUsersByEmail ?? new Map();
g.__letmeupUsersByEmail = usersByEmail;

// deviceId → 저장된 결제수단 목록
const paymentMethods: Map<string, SavedPaymentMethod[]> =
  g.__letmeupPaymentMethods ?? new Map();
g.__letmeupPaymentMethods = paymentMethods;

// deviceId → 마지막 수집 위치
const locations: Map<string, LocationRecord> = g.__letmeupLocations ?? new Map();
g.__letmeupLocations = locations;

export function saveOrder(order: Order): Order {
  orders.set(order.id, order);
  return order;
}

export function getOrder(id: string): Order | undefined {
  return orders.get(id);
}

export function updateOrder(id: string, patch: Partial<Order>): Order | undefined {
  const cur = orders.get(id);
  if (!cur) return undefined;
  const next = { ...cur, ...patch };
  orders.set(id, next);
  return next;
}

/** 특정 소유자(회원 또는 익명 기기)의 주문 목록 (최신순) */
export function listOrdersByOwner(ownerId: string): Order[] {
  return [...orders.values()]
    .filter((o) => o.ownerId === ownerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** 전체 주문 (관리자용, 최신순) */
export function listAllOrders(): Order[] {
  return [...orders.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** 전체 회원 수 (관리자용) */
export function countUsers(): number {
  return users.size;
}

// ── 회원 ──────────────────────────────────────────────────────────────────

export function createUser(user: User): User {
  users.set(user.id, user);
  usersByEmail.set(user.email.toLowerCase(), user.id);
  return user;
}

export function getUser(id: string): User | undefined {
  return users.get(id);
}

export function getUserByEmail(email: string): User | undefined {
  const id = usersByEmail.get(email.toLowerCase());
  return id ? users.get(id) : undefined;
}

// ── 결제수단 ──────────────────────────────────────────────────────────────

export function listPaymentMethods(deviceId: string): SavedPaymentMethod[] {
  return paymentMethods.get(deviceId) ?? [];
}

export function addPaymentMethod(
  deviceId: string,
  pm: SavedPaymentMethod,
): SavedPaymentMethod {
  const list = paymentMethods.get(deviceId) ?? [];
  // 첫 등록이면 기본 결제수단으로 지정
  if (list.length === 0) pm.isDefault = true;
  list.push(pm);
  paymentMethods.set(deviceId, list);
  return pm;
}

export function removePaymentMethod(deviceId: string, id: string): boolean {
  const list = paymentMethods.get(deviceId) ?? [];
  const next = list.filter((p) => p.id !== id);
  if (next.length === list.length) return false;
  // 기본 결제수단을 지웠다면 남은 것 중 첫 번째를 기본으로
  if (!next.some((p) => p.isDefault) && next[0]) next[0].isDefault = true;
  paymentMethods.set(deviceId, next);
  return true;
}

export function setDefaultPaymentMethod(deviceId: string, id: string): boolean {
  const list = paymentMethods.get(deviceId) ?? [];
  if (!list.some((p) => p.id === id)) return false;
  list.forEach((p) => (p.isDefault = p.id === id));
  paymentMethods.set(deviceId, list);
  return true;
}

export function getPaymentMethod(
  deviceId: string,
  id: string,
): SavedPaymentMethod | undefined {
  return (paymentMethods.get(deviceId) ?? []).find((p) => p.id === id);
}

// ── 위치 ──────────────────────────────────────────────────────────────────

export function saveLocation(deviceId: string, rec: LocationRecord): LocationRecord {
  locations.set(deviceId, rec);
  return rec;
}

export function getLocation(deviceId: string): LocationRecord | undefined {
  return locations.get(deviceId);
}

// ── ID 생성 ────────────────────────────────────────────────────────────────

export function newId(prefix: string): string {
  return prefix + Math.random().toString(36).slice(2, 12).toUpperCase();
}

export function newOrderId(): string {
  const d = new Date();
  const stamp =
    d.getFullYear().toString() +
    String(d.getMonth() + 1).padStart(2, "0") +
    String(d.getDate()).padStart(2, "0") +
    String(d.getHours()).padStart(2, "0") +
    String(d.getMinutes()).padStart(2, "0") +
    String(d.getSeconds()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `LMU${stamp}${rand}`;
}
