"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { THUMB_OPTIONS } from "@/lib/product";
import { categories } from "@/lib/data";
import { won } from "@/lib/format";

export interface ProductFormValues {
  title: string;
  brand: string;
  category: string;
  price: string;
  listPrice: string;
  summary: string;
  description: string;
  validity: string;
  usage: string; // 줄바꿈 구분
  badges: string; // 줄바꿈 구분
  stock: string; // 빈 값 = 무제한
  thumb: string;
  status: "active" | "inactive";
}

const EMPTY: ProductFormValues = {
  title: "",
  brand: "",
  category: "cafe",
  price: "",
  listPrice: "",
  summary: "",
  description: "",
  validity: "구매일로부터 60일",
  usage: "",
  badges: "",
  stock: "",
  thumb: THUMB_OPTIONS[0].cls,
  status: "active",
};

export default function PartnerProductForm({
  productId,
  initial,
}: {
  productId?: string;
  initial?: Partial<ProductFormValues>;
}) {
  const router = useRouter();
  const [form, setForm] = useState<ProductFormValues>({ ...EMPTY, ...initial });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const editing = Boolean(productId);

  function set<K extends keyof ProductFormValues>(k: K, v: ProductFormValues[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const payload = {
      ...form,
      usage: form.usage,
      badges: form.badges,
      stock: form.stock === "" ? null : form.stock,
    };
    const r = await fetch(
      editing ? `/api/partner/products/${productId}` : "/api/partner/products",
      {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    setBusy(false);
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      setError(d.error ?? "저장에 실패했습니다.");
      return;
    }
    router.push("/partner");
    router.refresh();
  }

  const price = Number(form.price) || 0;
  const listPrice = Number(form.listPrice) || 0;
  const rate = listPrice > price && listPrice > 0 ? Math.round((1 - price / listPrice) * 100) : 0;

  return (
    <form onSubmit={submit} className="mt-8 space-y-5">
      {/* 미리보기 */}
      <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-100">
        <div className="text-sm font-semibold text-ink-muted">미리보기</div>
        <div className="mt-3 flex gap-4">
          <div
            className={`relative grid h-24 w-32 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${form.thumb} p-2 text-center text-xs font-bold text-white`}
          >
            {form.brand || "브랜드"}
            {rate > 0 && (
              <span className="absolute right-1 top-1 rounded-full bg-accent px-1.5 text-[10px] font-black">
                {rate}%
              </span>
            )}
          </div>
          <div>
            <div className="font-bold">{form.title || "상품명"}</div>
            <div className="text-sm text-ink-muted">{form.summary || "한 줄 소개"}</div>
            <div className="mt-1 font-extrabold">{won(price)}</div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-100 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-semibold">상품명 *</label>
            <input className="field mt-1.5" required value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="예: 아메리카노 2잔 교환권" />
          </div>
          <div>
            <label className="text-sm font-semibold">브랜드명 *</label>
            <input className="field mt-1.5" required value={form.brand} onChange={(e) => set("brand", e.target.value)} placeholder="예: 메가커피" />
          </div>
          <div>
            <label className="text-sm font-semibold">카테고리 *</label>
            <select className="field mt-1.5" value={form.category} onChange={(e) => set("category", e.target.value)}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold">유효기간 *</label>
            <input className="field mt-1.5" required value={form.validity} onChange={(e) => set("validity", e.target.value)} placeholder="구매일로부터 60일" />
          </div>
          <div>
            <label className="text-sm font-semibold">판매가(원) *</label>
            <input className="field mt-1.5" required inputMode="numeric" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="2900" />
          </div>
          <div>
            <label className="text-sm font-semibold">정가(원)</label>
            <input className="field mt-1.5" inputMode="numeric" value={form.listPrice} onChange={(e) => set("listPrice", e.target.value)} placeholder="4000 (할인율 표시용)" />
          </div>
          <div>
            <label className="text-sm font-semibold">재고(매)</label>
            <input className="field mt-1.5" inputMode="numeric" value={form.stock} onChange={(e) => set("stock", e.target.value)} placeholder="비워두면 무제한" />
          </div>
          <div>
            <label className="text-sm font-semibold">노출 상태</label>
            <select className="field mt-1.5" value={form.status} onChange={(e) => set("status", e.target.value as "active" | "inactive")}>
              <option value="active">판매중 (노출)</option>
              <option value="inactive">숨김</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold">한 줄 소개 *</label>
          <input className="field mt-1.5" required value={form.summary} onChange={(e) => set("summary", e.target.value)} placeholder="가성비 끝판왕 아메리카노 2잔 교환권" />
        </div>
        <div>
          <label className="text-sm font-semibold">상세 설명</label>
          <textarea className="field mt-1.5 min-h-24" value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="상품에 대한 자세한 설명 (비워두면 한 줄 소개로 대체)" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-semibold">사용 방법 (한 줄에 하나씩)</label>
            <textarea className="field mt-1.5 min-h-24" value={form.usage} onChange={(e) => set("usage", e.target.value)} placeholder={"매장 직원에게 쿠폰번호 제시\n사이즈 업그레이드 시 차액 결제"} />
          </div>
          <div>
            <label className="text-sm font-semibold">뱃지 (한 줄에 하나씩, 최대 4개)</label>
            <textarea className="field mt-1.5 min-h-24" value={form.badges} onChange={(e) => set("badges", e.target.value)} placeholder={"인기\n27% 할인"} />
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold">썸네일 색상</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {THUMB_OPTIONS.map((t) => (
              <button
                type="button"
                key={t.id}
                onClick={() => set("thumb", t.cls)}
                className={`h-10 w-10 rounded-lg bg-gradient-to-br ${t.cls} ring-2 ${
                  form.thumb === t.cls ? "ring-ink" : "ring-transparent"
                }`}
                aria-label={t.label}
                title={t.label}
              />
            ))}
          </div>
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={busy} className="btn-primary flex-1">
          {busy ? "저장 중…" : editing ? "수정 완료" : "상품 등록"}
        </button>
        <button type="button" onClick={() => router.push("/partner")} className="btn-ghost">
          취소
        </button>
      </div>
    </form>
  );
}
