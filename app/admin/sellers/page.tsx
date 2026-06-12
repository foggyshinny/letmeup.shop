import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { listSellers, listAllProducts } from "@/lib/store";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import AdminSellerActions from "@/components/AdminSellerActions";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  pending: { text: "승인 대기", cls: "bg-amber-50 text-amber-700" },
  approved: { text: "승인됨", cls: "bg-brand-light text-brand" },
  suspended: { text: "정지", cls: "bg-red-50 text-red-600" },
};

export default async function AdminSellersPage() {
  if (!(await isAdmin())) redirect("/admin/login");

  const sellers = await listSellers();
  const products = await listAllProducts();
  const productCount = new Map<string, number>();
  for (const p of products) {
    if (p.sellerId) productCount.set(p.sellerId, (productCount.get(p.sellerId) ?? 0) + 1);
  }

  const pending = sellers.filter((s) => s.status === "pending").length;

  return (
    <div className="container-page py-10">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin" className="text-sm font-semibold text-ink-muted hover:text-ink">
            ← 관리자 대시보드
          </Link>
          <h1 className="mt-2 text-3xl font-extrabold">판매자(파트너) 관리</h1>
          <p className="mt-1 text-sm text-ink-muted">
            총 {sellers.length}곳 · 승인 대기 {pending}곳
          </p>
        </div>
        <AdminLogoutButton />
      </div>

      <div className="mt-8 overflow-x-auto rounded-2xl bg-white shadow-card ring-1 ring-slate-100">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 text-ink-muted">
            <tr>
              <th className="p-3 font-semibold">상호</th>
              <th className="p-3 font-semibold">담당자</th>
              <th className="p-3 font-semibold">연락처</th>
              <th className="p-3 font-semibold">상품</th>
              <th className="p-3 font-semibold">수수료</th>
              <th className="p-3 font-semibold">상태</th>
              <th className="p-3 font-semibold">신청일</th>
              <th className="p-3 font-semibold">관리</th>
            </tr>
          </thead>
          <tbody>
            {sellers.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-ink-muted">
                  아직 입점 신청한 판매자가 없습니다.
                </td>
              </tr>
            ) : (
              sellers.map((s) => {
                const st = STATUS_LABEL[s.status] ?? STATUS_LABEL.pending;
                return (
                  <tr key={s.id} className="border-b border-slate-50 align-top">
                    <td className="p-3">
                      <div className="font-semibold">{s.businessName}</div>
                      <div className="text-xs text-ink-muted">{s.email}</div>
                    </td>
                    <td className="p-3">{s.name}</td>
                    <td className="p-3 text-xs">{s.phone}</td>
                    <td className="p-3">{productCount.get(s.id) ?? 0}개</td>
                    <td className="p-3">{Math.round(s.commissionRate * 100)}%</td>
                    <td className="p-3">
                      <span className={`chip ${st.cls}`}>{st.text}</span>
                    </td>
                    <td className="p-3 text-xs text-ink-muted">
                      {new Date(s.createdAt).toLocaleDateString("ko-KR")}
                    </td>
                    <td className="p-3">
                      <AdminSellerActions id={s.id} status={s.status} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
