import { redirect } from "next/navigation";
import { isAdmin, getAdminConfig } from "@/lib/admin";
import { countUsers, listAllOrders } from "@/lib/store";
import { isLive as ksnetLive } from "@/lib/ksnet";
import { smsConfigured } from "@/lib/sms";
import { won } from "@/lib/format";
import AdminLogoutButton from "@/components/AdminLogoutButton";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  paid: { text: "결제완료", cls: "bg-brand-light text-brand" },
  pending: { text: "대기", cls: "bg-slate-100 text-ink-muted" },
  failed: { text: "실패", cls: "bg-red-50 text-red-600" },
  canceled: { text: "취소", cls: "bg-slate-100 text-ink-muted" },
};

export default async function AdminDashboard() {
  if (!(await isAdmin())) redirect("/admin/login");

  const orders = listAllOrders();
  const paid = orders.filter((o) => o.status === "paid");
  const revenue = paid.reduce((s, o) => s + o.amount, 0);
  const issuedCount = paid.reduce((s, o) => s + (o.issuedCoupons?.length ?? 0), 0);
  const users = countUsers();
  const admin = getAdminConfig();

  const integrations = [
    { name: "KSNET 결제", on: ksnetLive(), env: "KSNET_MID 외" },
    { name: "비즈뿌리오 문자", on: smsConfigured(), env: "BIZPPURIO_USER 외" },
    { name: "Authy 관리자 2FA", on: admin.totpConfigured, env: "ADMIN_TOTP_SECRET" },
  ];

  const stats = [
    { label: "총 매출", value: won(revenue) },
    { label: "결제완료 주문", value: `${paid.length}건` },
    { label: "발급 쿠폰", value: `${issuedCount}장` },
    { label: "가입 회원", value: `${users}명` },
  ];

  return (
    <div className="container-page py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold">관리자 대시보드</h1>
          <p className="mt-1 text-sm text-ink-muted">letmeup.shop 운영 현황</p>
        </div>
        <AdminLogoutButton />
      </div>

      {/* 통계 */}
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-100">
            <div className="text-sm text-ink-muted">{s.label}</div>
            <div className="mt-1 text-2xl font-extrabold">{s.value}</div>
          </div>
        ))}
      </div>

      {/* 연동 상태 */}
      <h2 className="mt-10 text-lg font-extrabold">연동 상태</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {integrations.map((it) => (
          <div
            key={it.name}
            className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-100"
          >
            <div>
              <div className="font-bold">{it.name}</div>
              <div className="font-mono text-xs text-ink-muted">{it.env}</div>
            </div>
            <span
              className={`chip ${it.on ? "bg-brand-light text-brand" : "bg-amber-50 text-amber-700"}`}
            >
              {it.on ? "설정됨" : "미설정(모의)"}
            </span>
          </div>
        ))}
      </div>

      {/* 최근 주문 */}
      <h2 className="mt-10 text-lg font-extrabold">최근 주문</h2>
      <div className="mt-3 overflow-x-auto rounded-2xl bg-white shadow-card ring-1 ring-slate-100">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 text-ink-muted">
            <tr>
              <th className="p-3 font-semibold">주문번호</th>
              <th className="p-3 font-semibold">구매자</th>
              <th className="p-3 font-semibold">금액</th>
              <th className="p-3 font-semibold">상태</th>
              <th className="p-3 font-semibold">쿠폰</th>
              <th className="p-3 font-semibold">문자</th>
              <th className="p-3 font-semibold">일시</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-ink-muted">
                  아직 주문이 없습니다.
                </td>
              </tr>
            ) : (
              orders.slice(0, 30).map((o) => {
                const st = STATUS_LABEL[o.status] ?? STATUS_LABEL.pending;
                return (
                  <tr key={o.id} className="border-b border-slate-50">
                    <td className="p-3 font-mono text-xs">{o.id}</td>
                    <td className="p-3">{o.buyerName}</td>
                    <td className="p-3 font-semibold">{won(o.amount)}</td>
                    <td className="p-3"><span className={`chip ${st.cls}`}>{st.text}</span></td>
                    <td className="p-3">{o.issuedCoupons?.length ?? 0}</td>
                    <td className="p-3">{o.smsSent ? "✓" : "–"}</td>
                    <td className="p-3 text-xs text-ink-muted">
                      {new Date(o.createdAt).toLocaleString("ko-KR")}
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
