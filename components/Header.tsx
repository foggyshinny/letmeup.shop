"use client";

import Link from "next/link";
import { useCart } from "./CartContext";

export default function Header() {
  const { count, ready } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="container-page flex h-[var(--header-h)] items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-white font-black">
            L
          </span>
          <span className="text-lg font-extrabold tracking-tight">
            letmeup<span className="text-brand">.shop</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-semibold text-ink-muted md:flex">
          <Link href="/coupons" className="hover:text-ink">
            전체 쿠폰
          </Link>
          <Link href="/coupons?category=cafe" className="hover:text-ink">
            스터디카페
          </Link>
          <Link href="/coupons?category=gift" className="hover:text-ink">
            기프트카드
          </Link>
          <Link href="/sell" className="hover:text-ink">
            입점 신청
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/account/payment-methods"
            className="btn-ghost hidden px-3 py-2 sm:inline-flex"
          >
            <span aria-hidden>👛</span>
            <span className="hidden md:inline">내 지갑</span>
          </Link>
          <Link href="/cart" className="btn-ghost relative px-3 py-2">
            <span aria-hidden>🛒</span>
            <span className="hidden sm:inline">장바구니</span>
            {ready && count > 0 && (
              <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
