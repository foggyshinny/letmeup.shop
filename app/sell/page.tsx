import Link from "next/link";

export const metadata = {
  title: "파트너 입점 — letmeup.shop",
  description: "letmeup.shop에 입점해 브랜드·매장의 쿠폰을 판매하세요.",
};

export default function SellPage() {
  return (
    <div className="container-page max-w-3xl py-12">
      <div className="chip w-fit bg-brand-light text-brand">파트너 센터</div>
      <h1 className="mt-3 text-3xl font-extrabold">letmeup.shop 파트너 입점</h1>
      <p className="mt-2 text-ink-muted">
        브랜드·매장의 쿠폰을 letmeup.shop에서 판매해 보세요. 도입비·고정비 없이
        판매가 일어났을 때만 수수료가 발생합니다. 입점 신청 후 관리자 승인이
        완료되면 직접 상품을 등록하고 판매·정산 현황을 관리할 수 있습니다.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          { t: "도입비 0원", d: "초기 비용 없이 시작" },
          { t: "직접 상품 관리", d: "등록·수정·재고를 셀프로" },
          { t: "투명한 정산", d: "수수료·정산 예정액 실시간 확인" },
        ].map((x) => (
          <div key={x.t} className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-100">
            <div className="font-extrabold text-brand">{x.t}</div>
            <div className="mt-1 text-sm text-ink-muted">{x.d}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-100">
        <h2 className="text-lg font-extrabold">입점 절차</h2>
        <ol className="mt-4 space-y-3 text-sm text-ink-muted">
          <li className="flex gap-3">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-light font-bold text-brand">1</span>
            <span>판매자 계정으로 <b className="text-ink">입점 신청</b> (상호·담당자·연락처·이메일)</span>
          </li>
          <li className="flex gap-3">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-light font-bold text-brand">2</span>
            <span>관리자 <b className="text-ink">승인</b> (영업일 기준 1~2일)</span>
          </li>
          <li className="flex gap-3">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-light font-bold text-brand">3</span>
            <span>파트너 센터에서 <b className="text-ink">상품 등록 → 판매 시작 → 정산</b></span>
          </li>
        </ol>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/partner/signup" className="btn-primary flex-1">
          입점 신청하기
        </Link>
        <Link href="/partner/login" className="btn-ghost flex-1">
          판매자 로그인
        </Link>
      </div>
    </div>
  );
}
