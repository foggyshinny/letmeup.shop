import Link from "next/link";
import type { Coupon } from "@/lib/types";
import { discountRate } from "@/lib/data";
import { won } from "@/lib/format";

export default function CouponCard({ coupon }: { coupon: Coupon }) {
  const rate = discountRate(coupon);

  return (
    <Link
      href={`/coupons/${coupon.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-float"
    >
      <div
        className={`relative aspect-[4/3] bg-gradient-to-br ${coupon.thumb} p-4`}
      >
        <div className="flex flex-wrap gap-1.5">
          {coupon.badges.map((b) => (
            <span
              key={b}
              className="chip bg-white/90 text-ink backdrop-blur"
            >
              {b}
            </span>
          ))}
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <div className="text-xs font-semibold text-white/80">{coupon.brand}</div>
          <div className="mt-0.5 line-clamp-2 text-lg font-extrabold leading-tight text-white drop-shadow">
            {coupon.title}
          </div>
        </div>
        {rate > 0 && (
          <div className="absolute right-4 top-4 grid h-12 w-12 place-items-center rounded-full bg-accent text-sm font-black text-white shadow">
            {rate}%
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="line-clamp-2 text-sm text-ink-muted">{coupon.summary}</p>
        <div className="mt-auto pt-3">
          {rate > 0 && (
            <div className="text-xs text-slate-400 line-through">
              {won(coupon.listPrice)}
            </div>
          )}
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-extrabold">{won(coupon.price)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
