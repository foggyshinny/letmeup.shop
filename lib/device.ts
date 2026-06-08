import { cookies } from "next/headers";

export const DEVICE_COOKIE = "lmu_did";

/** 요청 쿠키에서 익명 기기 식별자를 읽습니다. (미들웨어가 항상 설정) */
export async function getDeviceId(): Promise<string> {
  const store = await cookies();
  return store.get(DEVICE_COOKIE)?.value ?? "anon";
}
