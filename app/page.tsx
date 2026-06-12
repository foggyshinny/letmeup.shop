import Link from "next/link";
import CouponCard from "@/components/CouponCard";
import NearbyStores from "@/components/NearbyStores";
import { categories } from "@/lib/data";
import { listCatalog } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const catalog = await listCatalog();
  const featured = catalog.filter((c) => c.featured);
  const deals = [...catalog]
    .sort((a, b) => b.listPrice - b.price - (a.listPrice - a.price))
    .slice(0, 8);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand to-brand-dark text-white">
        <div className="container-page grid gap-8 py-16 md:grid-cols-2 md:py-24">
          <div className="flex flex-col justify-center">
            <span className="chip w-fit bg-white/20 text-white">
              매일 업데이트되는 할인 쿠폰
            </span>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight sm:text-5xl">
              필요한 쿠폰만,
              <br />
              가장 싸게.
            </h1>
            <p className="mt-4 max-w-md text-white/85">
              스터디카페 이용권부터 카페·외식·기프트카드까지. letmeup.shop에서
              제값 주고 사지 마세요.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/coupons" className="btn-accent">
                쿠폰 구경하기
              </Link>
              <Link
                href="/coupons?category=cafe"
                className="btn bg-white/15 text-white ring-1 ring-white/30 hover:bg-white/25"
              >
                스터디카페 이용권
              </Link>
            </div>
          </div>

          <div className="relative hidden md:block">
            <div className="absolute right-0 top-4 w-72 rotate-3 rounded-2xl bg-white p-5 text-ink shadow-float">
              <div className="text-xs font-semibold text-ink-muted">렛미업</div>
              <div className="mt-1 text-lg font-extrabold">
                스터디카페 4시간 이용권
              </div>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <div className="text-xs text-slate-400 line-through">7,000원</div>
                  <div className="text-2xl font-extrabold text-brand">4,900원</div>
                </div>
                <span className="chip bg-accent text-white">30%</span>
              </div>
            </div>
            <div className="absolute right-32 top-40 w-64 -rotate-3 rounded-2xl bg-white p-5 text-ink shadow-float">
              <div className="text-xs font-semibold text-ink-muted">올리브영</div>
              <div className="mt-1 text-lg font-extrabold">금액권 3만원</div>
              <div className="mt-4 flex items-end justify-between">
                <div className="text-2xl font-extrabold text-brand">27,900원</div>
                <span className="chip bg-accent text-white">7%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container-page py-12">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/coupons?category=${cat.id}`}
              className="flex flex-col items-center gap-2 rounded-2xl bg-white p-4 text-center shadow-card ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-float"
            >
              <span className="text-3xl">{cat.emoji}</span>
              <span className="text-xs font-bold leading-tight">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="container-page py-6">
        <div className="mb-5 flex items-end justify-between">
          <h2 className="text-2xl font-extrabold">🔥 지금 인기 쿠폰</h2>
          <Link href="/coupons" className="text-sm font-semibold text-brand">
            전체보기 →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {featured.map((c) => (
            <CouponCard key={c.id} coupon={c} />
          ))}
        </div>
      </section>

      {/* Nearby stores (위치 수집) */}
      <NearbyStores />

      {/* Best deals */}
      <section className="container-page py-10">
        <div className="mb-5 flex items-end justify-between">
          <h2 className="text-2xl font-extrabold">💸 할인율 높은 순</h2>
          <Link href="/coupons" className="text-sm font-semibold text-brand">
            전체보기 →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {deals.map((c) => (
            <CouponCard key={c.id} coupon={c} />
          ))}
        </div>
      </section>

      {/* Seller CTA */}
      <section className="container-page py-10">
        <div className="flex flex-col items-center justify-between gap-6 rounded-3xl bg-ink px-8 py-12 text-center text-white md:flex-row md:text-left">
          <div>
            <h2 className="text-2xl font-extrabold">쿠폰을 판매하고 싶으신가요?</h2>
            <p className="mt-2 text-white/80">
              브랜드·매장 사장님이라면 letmeup.shop에 입점해 새로운 고객을 만나보세요.
            </p>
          </div>
          <Link href="/partner/signup" className="btn-accent shrink-0">
            입점 신청하기
          </Link>
        </div>
      </section>
    </div>
  );
}
