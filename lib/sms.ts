/**
 * 비즈뿌리오(Bizppurio) 문자 발송 어댑터.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * ⚠️ 실제 발송에 필요한 값(계정 ID/비밀번호, 발신번호)은 아직 비어 있습니다.
 *    아래 환경변수를 채우면 실제 SMS/LMS가 발송됩니다. 비어 있으면 "모의 모드"로
 *    동작해(콘솔 로그만), 발송 호출부 흐름을 그대로 확인할 수 있습니다.
 *
 * 환경변수:
 *   BIZPPURIO_USER       비즈뿌리오 계정 ID
 *   BIZPPURIO_PASSWORD   비즈뿌리오 계정 비밀번호
 *   BIZPPURIO_FROM       사전 등록된 발신번호 (예: 16884264)
 *   BIZPPURIO_API_BASE   API 베이스 URL (기본: https://api.bizppurio.com)
 *
 * 연동 흐름(비즈뿌리오 표준):
 *   1) POST {base}/v1/token  (Basic 인증: id:password) → accesstoken 발급
 *   2) POST {base}/v3/message (Bearer accesstoken) → 메시지 발송
 *      - 90바이트 이하: sms, 초과: lms 로 자동 분기
 * ──────────────────────────────────────────────────────────────────────────
 */

interface BizppurioConfig {
  user: string;
  password: string;
  from: string;
  apiBase: string;
}

function getConfig(): BizppurioConfig {
  return {
    user: process.env.BIZPPURIO_USER ?? "",
    password: process.env.BIZPPURIO_PASSWORD ?? "",
    from: process.env.BIZPPURIO_FROM ?? "",
    apiBase: process.env.BIZPPURIO_API_BASE ?? "https://api.bizppurio.com",
  };
}

function isLive(cfg: BizppurioConfig): boolean {
  return Boolean(cfg.user && cfg.password && cfg.from);
}

/** 비즈뿌리오 실발송 설정 여부 (관리자 상태 표시용) */
export function smsConfigured(): boolean {
  return isLive(getConfig());
}

export interface SmsResult {
  success: boolean;
  messageKey?: string;
  message?: string;
}

/** 접속 토큰 발급 (비즈뿌리오 v1/token) */
async function issueToken(cfg: BizppurioConfig): Promise<string | null> {
  const basic = Buffer.from(`${cfg.user}:${cfg.password}`).toString("base64");
  const res = await fetch(`${cfg.apiBase}/v1/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/json" },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { accesstoken?: string };
  return data.accesstoken ?? null;
}

/**
 * 문자 발송. 한 통의 SMS/LMS를 지정 번호로 보냅니다.
 * @param to    수신번호 (하이픈 제거)
 * @param text  본문
 * @param subject LMS 제목 (옵션)
 */
export async function sendSms(to: string, text: string, subject?: string): Promise<SmsResult> {
  const cfg = getConfig();
  const phone = to.replace(/\D/g, "");

  if (!isLive(cfg)) {
    // ── 모의 모드 ──
    console.log(`[SMS mock → ${phone}] ${subject ? `(${subject}) ` : ""}${text}`);
    return { success: true, messageKey: "MOCK" + Date.now(), message: "모의 발송 (비즈뿌리오 미설정)" };
  }

  try {
    const token = await issueToken(cfg);
    if (!token) return { success: false, message: "토큰 발급 실패" };

    // 본문 바이트 수로 sms/lms 분기 (EUC-KR 기준 한글 2바이트 근사)
    const bytes = Buffer.byteLength(text, "utf8");
    const type = bytes <= 90 ? "sms" : "lms";

    const res = await fetch(`${cfg.apiBase}/v3/message`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        account: cfg.user,
        type,
        from: cfg.from,
        to: phone,
        content: {
          [type]: type === "lms" ? { subject: subject ?? "렛미업", message: text } : { message: text },
        },
      }),
    });
    const data = (await res.json()) as { messagekey?: string; code?: string; description?: string };
    const ok = res.ok && (data.code === "1000" || !!data.messagekey);
    return { success: ok, messageKey: data.messagekey, message: data.description };
  } catch (e) {
    return { success: false, message: "문자 발송 중 오류: " + String(e) };
  }
}
