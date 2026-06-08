import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-white">
      <div className="container-page grid gap-8 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="text-lg font-extrabold">
            letmeup<span className="text-brand">.shop</span>
          </div>
          <p className="mt-3 max-w-sm text-sm text-ink-muted">
            매일 새로운 할인 쿠폰을 가장 합리적인 가격에. 스터디카페 이용권부터
            카페·외식·기프트카드까지 한 곳에서.
          </p>
        </div>

        <div>
          <div className="text-sm font-bold">바로가기</div>
          <ul className="mt-3 space-y-2 text-sm text-ink-muted">
            <li><Link href="/coupons" className="hover:text-ink">전체 쿠폰</Link></li>
            <li><Link href="/cart" className="hover:text-ink">장바구니</Link></li>
            <li><Link href="/sell" className="hover:text-ink">입점 신청</Link></li>
            <li><a href="/legacy/index.html" className="hover:text-ink">렛미업 키오스크 소개</a></li>
          </ul>
        </div>

        <div>
          <div className="text-sm font-bold">고객센터</div>
          <ul className="mt-3 space-y-2 text-sm text-ink-muted">
            <li>전화 1688-4264</li>
            <li>samlab@samlab.co.kr</li>
            <li>평일 10:00 – 18:00</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-100">
        <div className="container-page flex flex-col gap-1 py-6 text-xs text-ink-muted">
          <p>샘랩주식회사 · 대표 ○○○ · 사업자등록번호 000-00-00000</p>
          <p>통신판매업신고 제0000-서울00-0000호 · 서울특별시 ○○구 ○○로 00</p>
          <p className="mt-2">© {new Date().getFullYear()} letmeup.shop. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
