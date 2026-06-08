import type { Order } from "./types";

/**
 * 주문 임시 저장소.
 *
 * 지금은 프로세스 메모리에 보관합니다(개발/데모용). 실제 운영에서는
 * DynamoDB / RDS / Supabase 등으로 교체하세요. 교체 지점은 이 파일의
 * 함수 구현부뿐이며, 호출하는 쪽 코드는 그대로 둘 수 있도록 설계했습니다.
 */

// Next dev 환경의 HMR로 모듈이 재평가돼도 데이터가 유지되도록 globalThis에 보관
const g = globalThis as unknown as { __letmeupOrders?: Map<string, Order> };
const orders: Map<string, Order> = g.__letmeupOrders ?? new Map();
g.__letmeupOrders = orders;

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
