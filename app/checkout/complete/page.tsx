import Link from "next/link";
import { getOrder } from "@/lib/store";
import { won } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CompletePage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: orderId } = await searchParams;
  const order = orderId ? await getOrder(orderId) : undefined;

  if (!order) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="text-2xl font-extrabold">주문 정보를 찾을 수 없습니다</h1>
        <p className="mt-2 text-ink-muted">주문번호를 다시 확인해 주세요.</p>
        <Link href="/" className="btn-primary mt-6">홈으로</Link>
      </div>
    );
  }

  const ok = order.status === "paid";

  return (
    <div className="container-page max-w-2xl py-14">
      <div className="rounded-3xl bg-white p-8 text-center shadow-card ring-1 ring-slate-100">
        <div className="text-6xl">{ok ? "🎉" : "⚠️"}</div>
        <h1 className="mt-4 text-2xl font-extrabold">
          {ok ? "결제가 완료되었습니다!" : "결제가 완료되지 않았습니다"}
        </h1>
        <p className="mt-2 text-ink-muted">
          {ok
            ? "구매하신 쿠폰은 입력하신 이메일과 문자로 발송됩니다."
            : "결제가 정상 처리되지 않았습니다. 다시 시도해 주세요."}
        </p>

        <div className="mt-6 rounded-2xl bg-slate-50 p-5 text-left text-sm">
          <div className="flex justify-between py-1">
            <span className="text-ink-muted">주문번호</span>
            <span className="font-mono font-semibold">{order.id}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-ink-muted">결제금액</span>
            <span className="font-bold">{won(order.amount)}</span>
          </div>
          {order.payment?.approvalNo && (
            <div className="flex justify-between py-1">
              <span className="text-ink-muted">승인번호</span>
              <span className="font-mono">{order.payment.approvalNo}</span>
            </div>
          )}
          <div className="flex justify-between py-1">
            <span className="text-ink-muted">받는 이메일</span>
            <span className="font-semibold">{order.buyerEmail}</span>
          </div>
        </div>

        <div className="mt-6 space-y-2 text-left">
          <div className="text-sm font-bold">구매 상품</div>
          {order.items.map((it) => (
            <div
              key={it.couponId}
              className="flex justify-between rounded-xl border border-slate-100 px-4 py-3 text-sm"
            >
              <span>
                {it.title} <span className="text-slate-400">× {it.qty}</span>
              </span>
              <span className="font-semibold">{won(it.unitPrice * it.qty)}</span>
            </div>
          ))}
        </div>

        {/* 자동 발급된 쿠폰 코드 */}
        {ok && order.issuedCoupons && order.issuedCoupons.length > 0 && (
          <div className="mt-6 rounded-2xl bg-brand-light p-5 text-left">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold">🎫 발급된 쿠폰 코드</div>
              {order.smsSent && <span className="text-xs font-semibold text-brand">문자 발송 완료</span>}
            </div>
            <ul className="mt-3 space-y-2">
              {order.issuedCoupons.map((c, i) => (
                <li key={i} className="rounded-lg bg-white px-3 py-2">
                  <div className="text-xs text-ink-muted">{c.title}</div>
                  <div className="font-mono text-sm font-bold">{c.code}</div>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-ink-muted">
              쿠폰 코드는 입력하신 휴대폰({order.buyerPhone})으로도 발송됩니다.
              구매내역에서 언제든 다시 확인할 수 있어요.
            </p>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link href="/coupons" className="btn-primary">계속 쇼핑하기</Link>
          <Link href="/" className="btn-ghost">홈으로</Link>
        </div>
      </div>
    </div>
  );
}
