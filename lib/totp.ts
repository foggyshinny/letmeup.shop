import crypto from "crypto";

/**
 * RFC 6238 TOTP 검증 (외부 의존성 없음).
 * Authy / Google Authenticator 등 표준 OTP 앱과 호환됩니다.
 */

function base32Decode(input: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const clean = input.replace(/=+$/, "").toUpperCase().replace(/\s/g, "");
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const idx = alphabet.indexOf(ch);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

function hotp(secret: Buffer, counter: number): string {
  const buf = Buffer.alloc(8);
  buf.writeUInt32BE(Math.floor(counter / 2 ** 32), 0);
  buf.writeUInt32BE(counter >>> 0, 4);
  const hmac = crypto.createHmac("sha1", secret).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return (code % 1_000_000).toString().padStart(6, "0");
}

/** 6자리 TOTP 코드 검증. 시간 오차를 위해 앞뒤 window 만큼 허용 (기본 ±1 = ±30초) */
export function verifyTotp(secretBase32: string, token: string, window = 1): boolean {
  if (!/^\d{6}$/.test(token.trim())) return false;
  const key = base32Decode(secretBase32);
  if (key.length === 0) return false;
  const counter = Math.floor(Date.now() / 1000 / 30);
  const input = token.trim();
  for (let w = -window; w <= window; w++) {
    const candidate = hotp(key, counter + w);
    const a = Buffer.from(candidate);
    const b = Buffer.from(input);
    if (a.length === b.length && crypto.timingSafeEqual(a, b)) return true;
  }
  return false;
}

/** OTP 앱(Authy 등)에 등록할 수 있는 otpauth:// URI 생성 */
export function otpauthUri(secretBase32: string, label: string, issuer = "letmeup.shop"): string {
  const params = new URLSearchParams({
    secret: secretBase32,
    issuer,
    algorithm: "SHA1",
    digits: "6",
    period: "30",
  });
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(label)}?${params}`;
}

/** 새 base32 시크릿 생성 (관리자 최초 설정용) */
export function generateBase32Secret(length = 32): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes)
    .map((b) => alphabet[b % alphabet.length])
    .join("");
}
