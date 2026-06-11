import type { LocationRecord, Order, SavedPaymentMethod, User } from "./types";

/**
 * 데이터 저장소.
 *
 * 두 가지 백엔드를 지원합니다(설정에 따라 자동 선택):
 *  - DYNAMODB_TABLE 환경변수가 있으면 → DynamoDB (운영/영속)
 *  - 없으면 → 프로세스 인메모리 (개발/데모, 재시작 시 초기화)
 *
 * 모든 공개 함수는 async 입니다. 호출부는 await 만 붙이면 백엔드와 무관하게 동작합니다.
 */

export interface StoreBackend {
  saveOrder(order: Order): Promise<Order>;
  getOrder(id: string): Promise<Order | undefined>;
  updateOrder(id: string, patch: Partial<Order>): Promise<Order | undefined>;
  listOrdersByOwner(ownerId: string): Promise<Order[]>;
  listAllOrders(): Promise<Order[]>;
  countUsers(): Promise<number>;
  createUser(user: User): Promise<User>;
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  listPaymentMethods(owner: string): Promise<SavedPaymentMethod[]>;
  addPaymentMethod(owner: string, pm: SavedPaymentMethod): Promise<SavedPaymentMethod>;
  removePaymentMethod(owner: string, id: string): Promise<boolean>;
  setDefaultPaymentMethod(owner: string, id: string): Promise<boolean>;
  getPaymentMethod(owner: string, id: string): Promise<SavedPaymentMethod | undefined>;
  saveLocation(owner: string, rec: LocationRecord): Promise<LocationRecord>;
  getLocation(owner: string): Promise<LocationRecord | undefined>;
}

// ── 인메모리 백엔드 ──────────────────────────────────────────────────────────
// Next dev 환경의 HMR로 모듈이 재평가돼도 데이터가 유지되도록 globalThis에 보관
const g = globalThis as unknown as {
  __letmeupOrders?: Map<string, Order>;
  __letmeupPaymentMethods?: Map<string, SavedPaymentMethod[]>;
  __letmeupLocations?: Map<string, LocationRecord>;
  __letmeupUsers?: Map<string, User>;
  __letmeupUsersByEmail?: Map<string, string>;
};
const orders: Map<string, Order> = (g.__letmeupOrders ??= new Map());
const users: Map<string, User> = (g.__letmeupUsers ??= new Map());
const usersByEmail: Map<string, string> = (g.__letmeupUsersByEmail ??= new Map());
const paymentMethods: Map<string, SavedPaymentMethod[]> = (g.__letmeupPaymentMethods ??= new Map());
const locations: Map<string, LocationRecord> = (g.__letmeupLocations ??= new Map());

const memStore: StoreBackend = {
  async saveOrder(order) {
    orders.set(order.id, order);
    return order;
  },
  async getOrder(id) {
    return orders.get(id);
  },
  async updateOrder(id, patch) {
    const cur = orders.get(id);
    if (!cur) return undefined;
    const next = { ...cur, ...patch };
    orders.set(id, next);
    return next;
  },
  async listOrdersByOwner(ownerId) {
    return [...orders.values()]
      .filter((o) => o.ownerId === ownerId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async listAllOrders() {
    return [...orders.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async countUsers() {
    return users.size;
  },
  async createUser(user) {
    users.set(user.id, user);
    usersByEmail.set(user.email.toLowerCase(), user.id);
    return user;
  },
  async getUser(id) {
    return users.get(id);
  },
  async getUserByEmail(email) {
    const id = usersByEmail.get(email.toLowerCase());
    return id ? users.get(id) : undefined;
  },
  async listPaymentMethods(owner) {
    return paymentMethods.get(owner) ?? [];
  },
  async addPaymentMethod(owner, pm) {
    const list = paymentMethods.get(owner) ?? [];
    if (list.length === 0) pm.isDefault = true;
    list.push(pm);
    paymentMethods.set(owner, list);
    return pm;
  },
  async removePaymentMethod(owner, id) {
    const list = paymentMethods.get(owner) ?? [];
    const next = list.filter((p) => p.id !== id);
    if (next.length === list.length) return false;
    if (!next.some((p) => p.isDefault) && next[0]) next[0].isDefault = true;
    paymentMethods.set(owner, next);
    return true;
  },
  async setDefaultPaymentMethod(owner, id) {
    const list = paymentMethods.get(owner) ?? [];
    if (!list.some((p) => p.id === id)) return false;
    list.forEach((p) => (p.isDefault = p.id === id));
    paymentMethods.set(owner, list);
    return true;
  },
  async getPaymentMethod(owner, id) {
    return (paymentMethods.get(owner) ?? []).find((p) => p.id === id);
  },
  async saveLocation(owner, rec) {
    locations.set(owner, rec);
    return rec;
  },
  async getLocation(owner) {
    return locations.get(owner);
  },
};

// ── 백엔드 선택 ──────────────────────────────────────────────────────────────
let backendPromise: Promise<StoreBackend> | null = null;
function backend(): Promise<StoreBackend> {
  if (!backendPromise) {
    backendPromise = process.env.DYNAMODB_TABLE
      ? import("./dynamo").then((m) => m.createDynamoStore())
      : Promise.resolve(memStore);
  }
  return backendPromise;
}

// ── 공개 API (백엔드로 위임) ─────────────────────────────────────────────────
export async function saveOrder(order: Order) {
  return (await backend()).saveOrder(order);
}
export async function getOrder(id: string) {
  return (await backend()).getOrder(id);
}
export async function updateOrder(id: string, patch: Partial<Order>) {
  return (await backend()).updateOrder(id, patch);
}
export async function listOrdersByOwner(ownerId: string) {
  return (await backend()).listOrdersByOwner(ownerId);
}
export async function listAllOrders() {
  return (await backend()).listAllOrders();
}
export async function countUsers() {
  return (await backend()).countUsers();
}
export async function createUser(user: User) {
  return (await backend()).createUser(user);
}
export async function getUser(id: string) {
  return (await backend()).getUser(id);
}
export async function getUserByEmail(email: string) {
  return (await backend()).getUserByEmail(email);
}
export async function listPaymentMethods(owner: string) {
  return (await backend()).listPaymentMethods(owner);
}
export async function addPaymentMethod(owner: string, pm: SavedPaymentMethod) {
  return (await backend()).addPaymentMethod(owner, pm);
}
export async function removePaymentMethod(owner: string, id: string) {
  return (await backend()).removePaymentMethod(owner, id);
}
export async function setDefaultPaymentMethod(owner: string, id: string) {
  return (await backend()).setDefaultPaymentMethod(owner, id);
}
export async function getPaymentMethod(owner: string, id: string) {
  return (await backend()).getPaymentMethod(owner, id);
}
export async function saveLocation(owner: string, rec: LocationRecord) {
  return (await backend()).saveLocation(owner, rec);
}
export async function getLocation(owner: string) {
  return (await backend()).getLocation(owner);
}

// ── ID 생성 (순수 함수, 동기) ────────────────────────────────────────────────
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
