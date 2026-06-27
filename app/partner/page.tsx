import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSeller } from "@/lib/seller";
import {
  listProductsBySeller,
  listAllOrders,
  listSettlementsBySeller,
} from "@/lib/store";
import { computeUnsettled } from "@/lib/settlement";
import { won } from "@/lib/format";
import PartnerLogoutButton from "@/components/PartnerLogoutButton";
import PartnerProductActions from "@/components/PartnerProductActions";

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<string, { text: string; cls: string }> = {
  pending: { text: "승인 대기", cls: "bg-amber-50 text-amber-700" },
  approved: { text: "승인 완료", cls: "bg-brand-light text-brand" },
  suspended: { text: "정지", cls: "bg-red-50 text-red-600" },
};

export default async function PartnerDashboard() {
  const seller = await getCurrentSeller();
  if (!seller) redirect("/partner/login?next=/partner");

  const products = await listProductsBySeller(seller.id);

  // 내 상품이 포함된 결제완료 주문에서 매출 집계 (주문 항목의 sellerId 기준)
  const allOrders = await listAllOrders();
  let gross = 0;
  let soldCount = 0;
  for (const o of allOrders) {
    if (o.status !== "paid") continue;
    for (const it of o.items) {
      if (it.sellerId === seller.id) {
        gross += it.unitPrice * it.qty;
        soldCount += it.qty;
      }
    }
  }

  // 정산: 미정산(예정) vs 정산 완료
  const unsettled = await computeUnsettled(seller);
  const settlements = await listSettlementsBySeller(seller.id);
  const settledNet = settlements
    .filter((s) => s.status === "paid")
    .reduce((sum, s) => sum + s.net, 0);

  const badge = STATUS_BADGE[seller.status] ?? STATUS_BADGE.pending;
  const approved = seller.status === "approved";

  const stats = [
    { label: "총 판매액", value: won(gross) },
    { label: "판매 건수", value: `${soldCount}건` },
    { label: "정산 예정액", value: won(unsettled.net) },
    { label: "정산 완료", value: won(settledNet) },
  ];

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold">{seller.businessName}</h1>
            <span className={`chip ${badge.cls}`}>{badge.text}</span>
          </div>
          <p className="mt-1 text-sm text-ink-muted">
            {seller.name}님 · 파트너 센터
          </p>
        </div>
        <PartnerLogoutButton />
      </div>

      {/* 상태 안내 */}
      {seller.status === "pending" && (
        <div className="mt-6 rounded-2xl bg-amber-50 p-5 text-amber-800 ring-1 ring-amber-100">
          <div className="font-bold">입점 신청이 접수되었습니다.</div>
          <p className="mt-1 text-sm">
            관리자 승인이 완료되면 상품을 등록하고 판매를 시작할 수 있습니다.
            보통 영업일 기준 1~2일이 소요됩니다.
          </p>
        </div>
      )}
      {seller.status === "suspended" && (
        <div className="mt-6 rounded-2xl bg-red-50 p-5 text-red-700 ring-1 ring-red-100">
          <div className="font-bold">판매가 정지된 계정입니다.</div>
          <p className="mt-1 text-sm">고객센터로 문의해 주세요.</p>
        </div>
      )}

      {/* 매출 통계 */}
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-100">
            <div className="text-sm text-ink-muted">{s.label}</div>
            <div className="mt-1 text-2xl font-extrabold">{s.value}</div>
          </div>
        ))}
      </div>

      {/* 내 상품 */}
      <div className="mt-10 flex items-center justify-between">
        <h2 className="text-lg font-extrabold">내 상품 ({products.length})</h2>
        {approved && (
          <Link href="/partner/products/new" className="btn-primary px-4 py-2">
            + 상품 등록
          </Link>
        )}
      </div>

      <div className="mt-3 overflow-x-auto rounded-2xl bg-white shadow-card ring-1 ring-slate-100">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 text-ink-muted">
            <tr>
              <th className="p-3 font-semibold">상품명</th>
              <th className="p-3 font-semibold">판매가</th>
              <th className="p-3 font-semibold">재고</th>
              <th className="p-3 font-semibold">노출</th>
              <th className="p-3 font-semibold">관리</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-ink-muted">
                  {approved
                    ? "아직 등록한 상품이 없습니다. ‘상품 등록’으로 첫 상품을 올려보세요."
                    : "승인 완료 후 상품을 등록할 수 있습니다."}
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="border-b border-slate-50">
                  <td className="p-3">
                    <Link href={`/coupons/${p.id}`} className="font-semibold hover:text-brand">
                      {p.title}
                    </Link>
                    <div className="text-xs text-ink-muted">{p.brand}</div>
                  </td>
                  <td className="p-3 font-semibold">{won(p.price)}</td>
                  <td className="p-3">{p.stock === null ? "무제한" : `${p.stock}매`}</td>
                  <td className="p-3">
                    <span
                      className={`chip ${
                        p.status === "inactive"
                          ? "bg-slate-100 text-ink-muted"
                          : "bg-brand-light text-brand"
                      }`}
                    >
                      {p.status === "inactive" ? "숨김" : "판매중"}
                    </span>
                  </td>
                  <td className="p-3">
                    <PartnerProductActions id={p.id} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 정산 계좌 */}
      <h2 className="mt-10 text-lg font-extrabold">정산 정보</h2>
      <div className="mt-3 rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-100 text-sm">
        {seller.settlement ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-ink-muted">
              {seller.settlement.bank} {seller.settlement.account} ({seller.settlement.holder})
            </span>
            <Link href="/partner/settings" className="font-semibold text-brand">
              변경
            </Link>
          </div>
        ) : (
          <div className="text-ink-muted">
            정산 계좌가 등록되지 않았습니다. 정산을 받으려면 계좌를 먼저 등록해 주세요.{" "}
            <Link href="/partner/settings" className="font-semibold text-brand">
              계좌 등록하기
            </Link>
          </div>
        )}
      </div>

      {/* 정산 내역 */}
      <h2 className="mt-10 text-lg font-extrabold">정산 내역</h2>
      <div className="mt-3 overflow-x-auto rounded-2xl bg-white shadow-card ring-1 ring-slate-100">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 text-ink-muted">
            <tr>
              <th className="p-3 font-semibold">정산번호</th>
              <th className="p-3 font-semibold">정산액</th>
              <th className="p-3 font-semibold">주문수</th>
              <th className="p-3 font-semibold">상태</th>
              <th className="p-3 font-semibold">일시</th>
            </tr>
          </thead>
          <tbody>
            {settlements.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-ink-muted">
                  아직 정산 내역이 없습니다. 정산은 관리자가 주기적으로 실행합니다.
                </td>
              </tr>
            ) : (
              settlements.map((s) => (
                <tr key={s.id} className="border-b border-slate-50">
                  <td className="p-3 font-mono text-xs">{s.id}</td>
                  <td className="p-3 font-semibold">{won(s.net)}</td>
                  <td className="p-3">{s.orderIds.length}건</td>
                  <td className="p-3">
                    <span
                      className={`chip ${
                        s.status === "paid"
                          ? "bg-brand-light text-brand"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {s.status === "paid" ? "정산완료" : "실패"}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-ink-muted">
                    {new Date(s.createdAt).toLocaleString("ko-KR")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
