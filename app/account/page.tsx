"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthContext";

export default function AccountPage() {
  const { user, ready, logout } = useAuth();

  if (!ready) {
    return <div className="container-page py-16 text-center text-ink-muted">불러오는 중…</div>;
  }

  if (!user) {
    return (
      <div className="container-page max-w-md py-20 text-center">
        <div className="text-5xl">🔒</div>
        <h1 className="mt-4 text-2xl font-extrabold">로그인이 필요합니다</h1>
        <p className="mt-2 text-ink-muted">마이페이지는 로그인 후 이용할 수 있어요.</p>
        <div className="mt-6 flex justify-center gap-2">
          <Link href="/login?next=/account" className="btn-primary">로그인</Link>
          <Link href="/signup" className="btn-ghost">회원가입</Link>
        </div>
      </div>
    );
  }

  const menu = [
    { href: "/account/orders", icon: "🧾", title: "구매내역", desc: "주문·쿠폰 코드 확인" },
    { href: "/account/payment-methods", icon: "💳", title: "내 지갑", desc: "결제수단 등록·관리" },
    { href: "/coupons", icon: "🎫", title: "쿠폰 둘러보기", desc: "할인 쿠폰 쇼핑" },
  ];

  return (
    <div className="container-page max-w-3xl py-10">
      <div className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-extrabold">{user.name}님</div>
            <div className="text-sm text-ink-muted">{user.email}</div>
          </div>
          <button onClick={logout} className="btn-ghost">로그아웃</button>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {menu.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-float"
          >
            <div className="text-3xl">{m.icon}</div>
            <div className="mt-2 font-bold">{m.title}</div>
            <div className="text-sm text-ink-muted">{m.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
