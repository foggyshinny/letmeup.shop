import crypto from "crypto";
import type { SettlementAccount } from "./types";

/**
 * 정산 이체(지급) 어댑터.
 *
 * "설정 없으면 mock" 패턴을 따른다:
 *  - PAYOUT_API_BASE / PAYOUT_API_KEY 가 설정되면 실제 이체 API 호출(아래 TODO 참고)
 *  - 미설정이면 모의 이체: 항상 성공으로 처리하고 가짜 거래참조를 반환
 *
 * 실연동 시: 사용하는 펌뱅킹/이체 API(예: 토스페이먼츠 지급대행, 세틀뱅크 등)의
 * 인증·요청 규격에 맞춰 callTransferApi 를 교체한다.
 */

export interface PayoutResult {
  success: boolean;
  /** 이체 거래 참조번호 */
  ref?: string;
  message?: string;
}

export function isPayoutLive(): boolean {
  return Boolean(process.env.PAYOUT_API_BASE && process.env.PAYOUT_API_KEY);
}

function mockRef(): string {
  return "PMOCK-" + crypto.randomBytes(6).toString("hex").toUpperCase();
}

/**
 * 정산액을 판매자 계좌로 이체한다.
 * @param amount 이체 금액(원)
 * @param account 입금 계좌
 * @param memo 입금 메모(주로 정산 ID/판매자명)
 */
export async function transfer(
  amount: number,
  account: SettlementAccount | undefined,
  memo: string,
): Promise<PayoutResult> {
  if (amount <= 0) {
    return { success: false, message: "정산 금액이 0원 이하입니다." };
  }
  if (!account) {
    return { success: false, message: "정산 계좌가 등록되지 않았습니다." };
  }

  if (!isPayoutLive()) {
    // 모의 이체: 실제 송금 없이 성공 처리
    return { success: true, ref: mockRef(), message: "모의 이체 완료" };
  }

  return callTransferApi(amount, account, memo);
}

/**
 * 실제 이체 API 호출부 (실연동 시 구현).
 * TODO: 사용하는 지급대행/펌뱅킹 API 규격에 맞춰 엔드포인트·인증·바디를 작성.
 */
async function callTransferApi(
  amount: number,
  account: SettlementAccount,
  memo: string,
): Promise<PayoutResult> {
  try {
    const res = await fetch(`${process.env.PAYOUT_API_BASE}/transfer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.PAYOUT_API_KEY}`,
      },
      body: JSON.stringify({
        bank: account.bank,
        account: account.account,
        holder: account.holder,
        amount,
        memo,
      }),
    });
    if (!res.ok) {
      return { success: false, message: `이체 실패 (HTTP ${res.status})` };
    }
    const data = (await res.json()) as { ref?: string; transactionId?: string };
    return { success: true, ref: data.ref ?? data.transactionId };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : "이체 중 오류" };
  }
}
