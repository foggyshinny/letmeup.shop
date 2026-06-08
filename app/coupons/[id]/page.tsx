import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { coupons, getCoupon, getCategory, discountRate } from "@/lib/data";
import { won } from "@/lib/format";
import AddToCart from "@/components/AddToCart";
import CouponCard from "@/components/CouponCard";

export function generateStaticParams() {
  return coupons.map((c) => ({ id: c.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const c = getCoupon(id);
  if (!c) return { title: "쿠폰을 찾을 수 없습니다 — letmeup.shop" };
  return { title: `${c.title} — letmeup.shop`, description: c.summary };
}

export default async function CouponDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const coupon = getCoupon(id);
  if (!coupon) notFound();

  const cat = getCategory(coupon.category);
  const rate = discountRate(coupon);
  const related = coupons
    .filter((c) => c.category === coupon.category && c.id !== coupon.id)
    .slice(0, 4);

  return (
    <div className="container-page py-8">
      {/* breadcrumb */}
      <nav className="text-sm text-ink-muted">
        <Link href="/coupons" className="hover:text-ink">전체 쿠폰</Link>
        {cat && (
          <>
            {" / "}
            <Link href={`/coupons?category=${cat.id}`} className="hover:text-ink">
              {cat.name}
            </Link>
          </>
        )}
      </nav>

      <div className="mt-6 grid gap-8 md:grid-cols-2">
        {/* Visual */}
        <div
          className={`relative flex aspect-[4/3] flex-col justify-between rounded-3xl bg-gradient-to-br ${coupon.thumb} p-6 text-white`}
        >
          <div className="flex flex-wrap gap-2">
            {coupon.badges.map((b) => (
              <span key={b} className="chip bg-white/90 text-ink">{b}</span>
            ))}
          </div>
          <div>
            <div className="text-sm font-semibold text-white/80">{coupon.brand}</div>
            <div className="mt-1 text-3xl font-extrabold leading-tight drop-shadow">
              {coupon.title}
            </div>
          </div>
          {rate > 0 && (
            <div className="absolute right-6 top-6 grid h-16 w-16 place-items-center rounded-full bg-accent text-lg font-black shadow">
              {rate}%
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <div className="text-sm font-semibold text-ink-muted">{coupon.brand}</div>
          <h1 className="mt-1 text-2xl font-extrabold leading-snug">{coupon.title}</h1>
          <p className="mt-3 text-ink-muted">{coupon.summary}</p>

          <div className="mt-6 rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-100">
            {rate > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-accent">{rate}%</span>
                <span className="text-sm text-slate-400 line-through">
                  {won(coupon.listPrice)}
                </span>
              </div>
            )}
            <div className="mt-1 text-3xl font-extrabold">{won(coupon.price)}</div>

            <dl className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-muted">유효기간</dt>
                <dd className="font-semibold">{coupon.validity}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">판매자</dt>
                <dd className="font-semibold">{coupon.seller}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">재고</dt>
                <dd className="font-semibold">
                  {coupon.stock === null ? "충분" : `${coupon.stock}매`}
                </dd>
              </div>
            </dl>

            <div className="mt-6">
              <AddToCart coupon={coupon} />
            </div>
          </div>
        </div>
      </div>

      {/* Description / usage */}
      <div className="mt-12 grid gap-8 md:grid-cols-2">
        <section>
          <h2 className="text-lg font-extrabold">상품 안내</h2>
          <p className="mt-3 whitespace-pre-line leading-relaxed text-ink-muted">
            {coupon.description}
          </p>
        </section>
        <section>
          <h2 className="text-lg font-extrabold">사용 방법</h2>
          <ul className="mt-3 space-y-2 text-sm text-ink-muted">
            {coupon.usage.map((u, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-brand">✓</span>
                <span>{u}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-5 text-xl font-extrabold">같은 카테고리 쿠폰</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {related.map((c) => (
              <CouponCard key={c.id} coupon={c} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
