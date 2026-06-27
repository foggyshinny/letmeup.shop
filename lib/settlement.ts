import type { Seller, Settlement } from "./types";
import {
  listAllOrders,
  listSettlementsBySeller,
  newId,
  saveSettlement,
} from "./store";
import { transfer } from "./payout";

export interface UnsettledSummary {
  gross: number;
  fee: number;
  net: number;
  orderIds: string[];
  count: number; // 정산 대상 판매 건수(수량 합)
}

/**
 * 판매자의 미정산 매출을 집계한다.
 * 이미 정산 완료(status="paid")된 주문은 제외한다(실패 정산은 재시도 대상이라 포함).
 *
 * 주의: 전체 주문 Scan 기반(데모/저volume 가정).
 */
export async function computeUnsettled(seller: Seller): Promise<UnsettledSummary> {
  const prior = await listSettlementsBySeller(seller.id);
  const settledOrderIds = new Set<string>();
  for (const s of prior) {
    if (s.status === "paid") s.orderIds.forEach((id) => settledOrderIds.add(id));
  }

  const orders = await listAllOrders();
  let gross = 0;
  let count = 0;
  const orderIds: string[] = [];
  for (const o of orders) {
    if (o.status !== "paid" || settledOrderIds.has(o.id)) continue;
    let orderGross = 0;
    for (const it of o.items) {
      if (it.sellerId === seller.id) {
        orderGross += it.unitPrice * it.qty;
        count += it.qty;
      }
    }
    if (orderGross > 0) {
      gross += orderGross;
      orderIds.push(o.id);
    }
  }

  const fee = Math.round(gross * seller.commissionRate);
  return { gross, fee, net: gross - fee, orderIds, count };
}

/**
 * 판매자의 미정산 매출을 정산 실행(이체)하고 정산 레코드를 저장한다.
 * 매출이 없으면 실행하지 않는다.
 */
export async function executeSettlement(
  seller: Seller,
): Promise<{ ok: boolean; error?: string; settlement?: Settlement }> {
  const summary = await computeUnsettled(seller);
  if (summary.gross <= 0) {
    return { ok: false, error: "정산할 매출이 없습니다." };
  }

  const payout = await transfer(
    summary.net,
    seller.settlement,
    `${seller.businessName} 정산`,
  );

  const settlement: Settlement = {
    id: newId("ST"),
    sellerId: seller.id,
    sellerName: seller.businessName,
    orderIds: summary.orderIds,
    gross: summary.gross,
    commissionRate: seller.commissionRate,
    fee: summary.fee,
    net: summary.net,
    status: payout.success ? "paid" : "failed",
    account: seller.settlement,
    transferRef: payout.ref,
    failReason: payout.success ? undefined : payout.message,
    createdAt: new Date().toISOString(),
  };
  await saveSettlement(settlement);

  return payout.success
    ? { ok: true, settlement }
    : { ok: false, error: payout.message ?? "이체에 실패했습니다.", settlement };
}
