"use client";

import { useState } from "react";

export default function SellPage() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="container-page max-w-xl py-20 text-center">
        <div className="text-5xl">📩</div>
        <h1 className="mt-4 text-2xl font-extrabold">입점 신청이 접수되었습니다</h1>
        <p className="mt-2 text-ink-muted">
          담당자가 영업일 기준 2~3일 내에 연락드리겠습니다. 감사합니다.
        </p>
      </div>
    );
  }

  return (
    <div className="container-page max-w-2xl py-12">
      <h1 className="text-3xl font-extrabold">입점 신청</h1>
      <p className="mt-2 text-ink-muted">
        브랜드·매장의 쿠폰을 letmeup.shop에서 판매해 보세요. 도입비·고정비 없이
        판매가 일어났을 때만 수수료가 발생합니다.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          { t: "도입비 0원", d: "초기 비용 없이 시작" },
          { t: "정산 주 1회", d: "빠르고 투명한 정산" },
          { t: "마케팅 노출", d: "기획전·추천 영역 노출" },
        ].map((x) => (
          <div key={x.t} className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-100">
            <div className="font-extrabold text-brand">{x.t}</div>
            <div className="mt-1 text-sm text-ink-muted">{x.d}</div>
          </div>
        ))}
      </div>

      <form
        className="mt-8 space-y-4 rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-100"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-semibold">상호 / 브랜드명</label>
            <input className="field mt-1.5" required placeholder="예: 렛미업" />
          </div>
          <div>
            <label className="text-sm font-semibold">담당자명</label>
            <input className="field mt-1.5" required placeholder="홍길동" />
          </div>
          <div>
            <label className="text-sm font-semibold">연락처</label>
            <input className="field mt-1.5" required placeholder="010-1234-5678" inputMode="tel" />
          </div>
          <div>
            <label className="text-sm font-semibold">이메일</label>
            <input className="field mt-1.5" required placeholder="example@email.com" inputMode="email" />
          </div>
        </div>
        <div>
          <label className="text-sm font-semibold">판매하려는 쿠폰 소개</label>
          <textarea
            className="field mt-1.5 min-h-28"
            placeholder="어떤 상품/쿠폰을 어떤 가격대로 판매하고 싶으신가요?"
          />
        </div>
        <button type="submit" className="btn-primary w-full">
          입점 신청하기
        </button>
        <p className="text-center text-xs text-ink-muted">
          제출 시 개인정보 수집·이용에 동의하는 것으로 간주됩니다.
        </p>
      </form>
    </div>
  );
}
