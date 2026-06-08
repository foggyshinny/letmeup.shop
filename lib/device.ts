import { cookies } from "next/headers";
import { getSessionUserId } from "./auth";

export const DEVICE_COOKIE = "lmu_did";

/** 요청 쿠키에서 익명 기기 식별자를 읽습니다. (미들웨어가 항상 설정) */
export async function getDeviceId(): Promise<string> {
  const store = await cookies();
  return store.get(DEVICE_COOKIE)?.value ?? "anon";
}

/**
 * 데이터 소유자 키. 로그인 상태면 회원 ID, 아니면 익명 기기 ID.
 * 결제수단/위치/주문을 이 키로 분리·조회합니다.
 */
export async function getOwnerId(): Promise<string> {
  const userId = await getSessionUserId();
  if (userId) return userId;
  return getDeviceId();
}
