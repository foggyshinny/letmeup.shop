"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface SetupInfo {
  configured: boolean;
  username?: string;
  secret?: string;
  otpauthUri?: string;
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "", code: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [setup, setSetup] = useState<SetupInfo | null>(null);

  useEffect(() => {
    fetch("/api/admin/setup")
      .then((r) => r.json())
      .then(setSetup)
      .catch(() => {});
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await fetch("/api/admin/login", {
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
    router.push("/admin");
  }

  return (
    <div className="container-page max-w-md py-16">
      <div className="rounded-2xl bg-white p-7 shadow-card ring-1 ring-slate-100">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-ink text-white font-black">A</span>
          <h1 className="text-2xl font-extrabold">관리자 로그인</h1>
        </div>
        <p className="mt-2 text-sm text-ink-muted">
          아이디·비밀번호와 <span className="font-semibold text-ink">Authy</span> 인증 코드를 입력하세요.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-semibold">아이디</label>
            <input
              className="field mt-1.5"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="admin"
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
              required
            />
          </div>
          <div>
            <label className="text-sm font-semibold">Authy 인증 코드 (6자리)</label>
            <input
              className="field mt-1.5 tracking-[0.4em]"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="000000"
              inputMode="numeric"
              maxLength={6}
              required
            />
          </div>
          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? "인증 중…" : "로그인"}
          </button>
        </form>

        {/* 데모 모드 안내: 운영 시크릿 미설정 시 Authy 등록 정보 표시 */}
        {setup && !setup.configured && (
          <div className="mt-6 rounded-xl bg-amber-50 p-4 text-xs text-amber-800">
            <div className="font-bold">⚙️ 데모 모드 (Authy 미설정)</div>
            <p className="mt-1">
              운영 전 <code className="font-mono">ADMIN_TOTP_SECRET</code> 환경변수를 설정하세요.
              테스트하려면 아래 시크릿을 Authy 앱에 수동 추가하면 코드가 생성됩니다.
            </p>
            <div className="mt-2 break-all rounded bg-white p-2 font-mono">
              아이디: {setup.username} · 비밀번호: letmeup-admin
            </div>
            <div className="mt-1 break-all rounded bg-white p-2 font-mono">
              TOTP 시크릿: {setup.secret}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
