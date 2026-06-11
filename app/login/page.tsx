"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthContext";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="container-page py-16 text-center text-ink-muted">불러오는 중…</div>}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const { refresh } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/account";
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setBusy(false);
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      setError(d.error ?? "로그인에 실패했습니다.");
      return;
    }
    await refresh();
    router.push(next);
  }

  return (
    <div className="container-page max-w-md py-16">
      <h1 className="text-3xl font-extrabold">로그인</h1>
      <p className="mt-2 text-ink-muted">letmeup.shop 계정으로 로그인하세요.</p>

      <form onSubmit={submit} className="mt-8 space-y-4 rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-100">
        <div>
          <label className="text-sm font-semibold">이메일</label>
          <input
            className="field mt-1.5"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="example@email.com"
            required
          />
        </div>
        <div>
          <label className="text-sm font-semibold">비밀번호</label>
          <input
            className="field mt-1.5"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="••••••••"
            required
          />
        </div>
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? "로그인 중…" : "로그인"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-ink-muted">
        아직 회원이 아니신가요?{" "}
        <Link href="/signup" className="font-semibold text-brand">회원가입</Link>
      </p>
    </div>
  );
}
