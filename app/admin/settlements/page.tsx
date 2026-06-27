import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { listAllSettlements, listSellers } from "@/lib/store";
import { computeUnsettled } from "@/lib/settlement";
import { isPayoutLive } from "@/lib/payout";
import { won } from "@/lib/format";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import AdminSettlementAction from "@/components/AdminSettlementAction";

export const dynamic = "force-dynamic";

export default async function AdminSettlementsPage() {
  if (!(await isAdmin())) redirect("/admin/login");

  const sellers = await listSellers();
  const approved = sellers.filter((s) => s.status !== "pending");

  // 판매자별 미정산 집계
  const rows = await Promise.all(
    approved.map(async (s) => ({ seller: s, summary: await computeUnsettled(s) })),
  );
  rows.sort((a, b) => b.summary.net - a.summary.net);

  const history = await listAllSettlements();
  const totalPaid = history
    .filter((h) => h.status === "paid")
    .reduce((sum, h) => sum + h.net, 0);

  return (
    <div className="container-page py-10">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin" className="text-sm font-semibold text-ink-muted hover:text-ink">
            ← 관리자 대시보드
          </Link>
          <h1 className="mt-2 text-3xl font-extrabold">정산 관리</h1>
          <p className="mt-1 text-sm text-ink-muted">
            누적 정산 {won(totalPaid)} ·{" "}
            <span className={isPayoutLive() ? "text-brand" : "text-amber-600"}>
              이체 {isPayoutLive() ? "실연동" : "모의(mock)"} 모드
            </span>
          </p>
        </div>
        <AdminLogoutButton />
      </div>

      {/* 미정산 현황 */}
      <h2 className="mt-8 text-lg font-extrabold">미정산 현황</h2>
      <div className="mt-3 overflow-x-auto rounded-2xl bg-white shadow-card ring-1 ring-slate-100">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 text-ink-muted">
            <tr>
              <th className="p-3 font-semibold">판매자</th>
              <th className="p-3 font-semibold">미정산 판매액</th>
              <th className="p-3 font-semibold">수수료</th>
              <th className="p-3 font-semibold">정산 예정액</th>
              <th className="p-3 font-semibold">계좌</th>
              <th className="p-3 font-semibold">실행</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-ink-muted">
                  승인된 판매자가 없습니다.
                </td>
              </tr>
            ) : (
              rows.map(({ seller, summary }) => (
                <tr key={seller.id} className="border-b border-slate-50">
                  <td className="p-3">
                    <div className="font-semibold">{seller.businessName}</div>
                    <div className="text-xs text-ink-muted">
                      수수료율 {Math.round(seller.commissionRate * 100)}%
                    </div>
                  </td>
                  <td className="p-3 font-semibold">{won(summary.gross)}</td>
                  <td className="p-3 text-ink-muted">{won(summary.fee)}</td>
                  <td className="p-3 font-extrabold">{won(summary.net)}</td>
                  <td className="p-3 text-xs">
                    {seller.settlement ? (
                      <span className="text-ink-muted">
                        {seller.settlement.bank} {seller.settlement.account}
                      </span>
                    ) : (
                      <span className="text-amber-600">미등록</span>
                    )}
                  </td>
                  <td className="p-3">
                    {summary.gross > 0 ? (
                      <AdminSettlementAction
                        sellerId={seller.id}
                        net={summary.net}
                        disabled={!seller.settlement}
                      />
                    ) : (
                      <span className="text-xs text-ink-muted">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 정산 내역 */}
      <h2 className="mt-10 text-lg font-extrabold">정산 내역</h2>
      <div className="mt-3 overflow-x-auto rounded-2xl bg-white shadow-card ring-1 ring-slate-100">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 text-ink-muted">
            <tr>
              <th className="p-3 font-semibold">정산번호</th>
              <th className="p-3 font-semibold">판매자</th>
              <th className="p-3 font-semibold">정산액</th>
              <th className="p-3 font-semibold">주문수</th>
              <th className="p-3 font-semibold">상태</th>
              <th className="p-3 font-semibold">이체참조</th>
              <th className="p-3 font-semibold">일시</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-ink-muted">
                  아직 정산 내역이 없습니다.
                </td>
              </tr>
            ) : (
              history.slice(0, 50).map((h) => (
                <tr key={h.id} className="border-b border-slate-50">
                  <td className="p-3 font-mono text-xs">{h.id}</td>
                  <td className="p-3">{h.sellerName}</td>
                  <td className="p-3 font-semibold">{won(h.net)}</td>
                  <td className="p-3">{h.orderIds.length}건</td>
                  <td className="p-3">
                    <span
                      className={`chip ${
                        h.status === "paid"
                          ? "bg-brand-light text-brand"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {h.status === "paid" ? "완료" : "실패"}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-xs text-ink-muted">
                    {h.transferRef ?? (h.failReason ? `실패: ${h.failReason}` : "—")}
                  </td>
                  <td className="p-3 text-xs text-ink-muted">
                    {new Date(h.createdAt).toLocaleString("ko-KR")}
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
