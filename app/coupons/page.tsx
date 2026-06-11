import Link from "next/link";
import CouponCard from "@/components/CouponCard";
import { categories, coupons, getCategory } from "@/lib/data";
import { classNames } from "@/lib/format";

export default async function CouponsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string }>;
}) {
  const { category, sort } = await searchParams;
  const activeCat = category && getCategory(category) ? category : undefined;

  let list = coupons.filter((c) => (activeCat ? c.category === activeCat : true));

  if (sort === "price") list = [...list].sort((a, b) => a.price - b.price);
  else if (sort === "discount")
    list = [...list].sort(
      (a, b) => b.listPrice - b.price - (a.listPrice - a.price),
    );

  const sortHref = (s: string) =>
    `/coupons?${new URLSearchParams({
      ...(activeCat ? { category: activeCat } : {}),
      sort: s,
    }).toString()}`;

  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-extrabold">
        {activeCat ? getCategory(activeCat)!.name : "전체 쿠폰"}
      </h1>
      <p className="mt-2 text-ink-muted">
        {activeCat ? getCategory(activeCat)!.description : "letmeup.shop의 모든 할인 쿠폰"}
      </p>

      {/* Category tabs */}
      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href="/coupons"
          className={classNames(
            "chip border px-4 py-2",
            !activeCat
              ? "border-brand bg-brand text-white"
              : "border-slate-200 bg-white text-ink-muted hover:text-ink",
          )}
        >
          전체
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/coupons?category=${cat.id}`}
            className={classNames(
              "chip border px-4 py-2",
              activeCat === cat.id
                ? "border-brand bg-brand text-white"
                : "border-slate-200 bg-white text-ink-muted hover:text-ink",
            )}
          >
            {cat.emoji} {cat.name}
          </Link>
        ))}
      </div>

      {/* Sort */}
      <div className="mt-4 flex items-center gap-3 text-sm">
        <span className="font-semibold text-ink-muted">정렬</span>
        <Link
          href={activeCat ? `/coupons?category=${activeCat}` : "/coupons"}
          className={classNames("font-semibold", !sort ? "text-brand" : "text-ink-muted")}
        >
          추천순
        </Link>
        <Link
          href={sortHref("discount")}
          className={classNames("font-semibold", sort === "discount" ? "text-brand" : "text-ink-muted")}
        >
          할인율순
        </Link>
        <Link
          href={sortHref("price")}
          className={classNames("font-semibold", sort === "price" ? "text-brand" : "text-ink-muted")}
        >
          낮은가격순
        </Link>
      </div>

      {/* Grid */}
      {list.length > 0 ? (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {list.map((c) => (
            <CouponCard key={c.id} coupon={c} />
          ))}
        </div>
      ) : (
        <div className="mt-16 text-center text-ink-muted">
          해당 카테고리에 등록된 쿠폰이 아직 없습니다.
        </div>
      )}
    </div>
  );
}
