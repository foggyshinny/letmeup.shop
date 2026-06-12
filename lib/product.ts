import type { CategoryId, Coupon } from "./types";

/** 판매자 상품 등록 폼에서 고를 수 있는 썸네일 그라데이션(Tailwind) 목록 */
export const THUMB_OPTIONS: { id: string; label: string; cls: string }[] = [
  { id: "brand", label: "민트", cls: "from-brand to-brand-dark" },
  { id: "blue", label: "블루", cls: "from-cyan-500 to-blue-600" },
  { id: "amber", label: "옐로우", cls: "from-yellow-400 to-amber-500" },
  { id: "red", label: "레드", cls: "from-red-500 to-rose-600" },
  { id: "pink", label: "핑크", cls: "from-pink-400 to-fuchsia-500" },
  { id: "green", label: "그린", cls: "from-lime-500 to-green-600" },
  { id: "slate", label: "다크", cls: "from-slate-700 to-slate-900" },
  { id: "violet", label: "퍼플", cls: "from-indigo-500 to-violet-600" },
  { id: "emerald", label: "에메랄드", cls: "from-emerald-600 to-green-800" },
];

const VALID_CATEGORIES: CategoryId[] = [
  "cafe",
  "food",
  "beauty",
  "culture",
  "shopping",
  "gift",
];

const VALID_THUMBS = new Set(THUMB_OPTIONS.map((t) => t.cls));

export interface ProductInput {
  title?: string;
  brand?: string;
  category?: string;
  price?: number | string;
  listPrice?: number | string;
  summary?: string;
  description?: string;
  validity?: string;
  usage?: string[] | string;
  stock?: number | string | null;
  thumb?: string;
  badges?: string[] | string;
  status?: string;
}

export interface ValidatedProduct {
  title: string;
  brand: string;
  category: CategoryId;
  price: number;
  listPrice: number;
  summary: string;
  description: string;
  validity: string;
  usage: string[];
  stock: number | null;
  thumb: string;
  badges: string[];
  status: "active" | "inactive";
}

function toLines(v: string[] | string | undefined): string[] {
  if (Array.isArray(v)) return v.map((s) => s.trim()).filter(Boolean);
  if (typeof v === "string")
    return v
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
  return [];
}

function toNum(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

/** 폼 입력을 검증·정규화. 실패 시 에러 메시지(string)를 반환. */
export function validateProductInput(
  input: ProductInput,
): { ok: true; value: ValidatedProduct } | { ok: false; error: string } {
  const title = (input.title ?? "").trim();
  const brand = (input.brand ?? "").trim();
  const category = (input.category ?? "").trim() as CategoryId;
  const price = toNum(input.price);
  const listPriceRaw = toNum(input.listPrice);
  const summary = (input.summary ?? "").trim();
  const description = (input.description ?? "").trim();
  const validity = (input.validity ?? "").trim();
  const usage = toLines(input.usage);
  const badges = toLines(input.badges).slice(0, 4);
  const stock = toNum(input.stock);
  const thumb = (input.thumb ?? "").trim();
  const status = input.status === "inactive" ? "inactive" : "active";

  if (!title) return { ok: false, error: "상품명을 입력해 주세요." };
  if (!brand) return { ok: false, error: "브랜드명을 입력해 주세요." };
  if (!VALID_CATEGORIES.includes(category))
    return { ok: false, error: "카테고리를 선택해 주세요." };
  if (price === null || price < 0)
    return { ok: false, error: "판매가를 올바르게 입력해 주세요." };
  const listPrice = listPriceRaw === null || listPriceRaw < price ? price : listPriceRaw;
  if (!summary) return { ok: false, error: "한 줄 소개를 입력해 주세요." };
  if (!validity) return { ok: false, error: "유효기간을 입력해 주세요." };
  if (stock !== null && stock < 0)
    return { ok: false, error: "재고는 0 이상이어야 합니다." };

  return {
    ok: true,
    value: {
      title,
      brand,
      category,
      price: Math.round(price),
      listPrice: Math.round(listPrice),
      summary,
      description: description || summary,
      validity,
      usage: usage.length > 0 ? usage : ["구매 후 발급된 쿠폰 코드를 매장/앱에서 제시"],
      stock,
      thumb: VALID_THUMBS.has(thumb) ? thumb : THUMB_OPTIONS[0].cls,
      badges,
      status,
    },
  };
}

/** 검증된 입력으로 기존 Coupon을 갱신(부분 필드만 교체)한 객체를 만든다. */
export function applyProductInput(base: Coupon, v: ValidatedProduct): Coupon {
  return {
    ...base,
    title: v.title,
    brand: v.brand,
    seller: base.seller,
    category: v.category,
    price: v.price,
    listPrice: v.listPrice,
    summary: v.summary,
    description: v.description,
    validity: v.validity,
    usage: v.usage,
    stock: v.stock,
    thumb: v.thumb,
    badges: v.badges,
    status: v.status,
  };
}
