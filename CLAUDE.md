# CLAUDE.md — letmeup.shop 프로젝트 가이드

> 이 파일은 Claude Code가 자동으로 읽는 프로젝트 컨텍스트입니다.
> 작업을 이어받는 사람(또는 Claude)은 이 문서를 먼저 읽으세요.

## 무엇인가

**letmeup.shop** — 할인/기프트 쿠폰을 판매하는 커머스 사이트.
스터디카페 이용권부터 카페·외식·뷰티·문화·기프트카드까지 판매하며,
판매자 입점(마켓플레이스) 확장을 염두에 두고 설계됨.

- **스택**: Next.js 15 (App Router) · TypeScript · Tailwind CSS
- **배포**: AWS Amplify Hosting (`amplify.yml`, Next.js SSR)
- **UI 언어**: 한국어
- 기존 정적 랜딩페이지는 `public/legacy/index.html`로 보존

## 개발 명령

```bash
npm install
cp .env.example .env.local   # 값은 비워둬도 됨 (모두 모의 모드로 동작)
npm run dev                  # http://localhost:3000
npm run build && npm start   # 프로덕션 빌드 확인
```

Node 22 / npm 10 기준. `.nvmrc` 참고.

## ⭐ 핵심 설계 원칙: "모의 모드(mock mode)"

외부 연동(결제·문자·관리자 2FA)은 **환경변수가 비어 있으면 자동으로 모의 모드**로
동작한다. 덕분에 키 없이도 전체 플로우를 끝까지 개발·시연할 수 있다.
실연동값을 채우면 자동으로 실거래 모드로 전환된다. 새 연동을 추가할 때도
이 패턴(설정 없으면 mock, 있으면 live)을 따를 것.

## 디렉터리 구조

```
app/
  layout.tsx, page.tsx          # 레이아웃(Auth/Cart Provider) + 홈
  coupons/                      # 목록 / [id] 상세
  cart/ checkout/ checkout/complete/
  account/                      # 마이페이지, orders(구매내역), payment-methods(지갑)
  login/ signup/
  sell/                         # 판매자 입점 신청
  admin/ admin/login/           # 관리자 대시보드 + Authy 로그인
  api/
    auth/        signup·login·logout·me
    orders/      GET(내역)·POST(생성)
    coupons/
    payment-methods/ [id]/
    location/
    payments/ksnet/ ready·callback
    admin/       login·logout·setup
components/                     # Header, Footer, CartContext, AuthContext,
                                # CouponCard, AddToCart, PayMethodSelector,
                                # NearbyStores, AdminLogoutButton
lib/
  types.ts     도메인 타입(단일 출처)
  data.ts      쿠폰/카테고리 시드 데이터
  places.ts    매장 위치 시드 + 거리(하버사인)
  store.ts     ★ 인메모리 저장소 (orders/users/paymentMethods/locations)
  format.ts    won(), classNames()
  device.ts    getDeviceId() / getOwnerId()
  auth.ts      회원 비번 해시(scrypt)·세션(HMAC)
  admin.ts     관리자 설정·세션
  totp.ts      RFC6238 TOTP(Authy 호환, 무의존)
  ksnet.ts     KSNET 결제/빌링키 어댑터
  sms.ts       비즈뿌리오 문자 어댑터
  fulfill.ts   쿠폰코드 발급 + 문자 발송
middleware.ts  익명 기기 쿠키(lmu_did) 보장
public/legacy/ 기존 키오스크 랜딩(정적) 보존
```

## 데이터 / 상태 — ⚠️ 가장 먼저 알아야 할 것

**모든 데이터는 `lib/store.ts`의 프로세스 인메모리(Map)에 저장된다.**
서버를 재시작하면 회원·주문·결제수단·위치가 모두 사라진다(개발/데모용).

→ **운영 전환 시 최우선 작업**: `lib/store.ts`의 함수 구현부를 실제 DB
(DynamoDB / RDS / Supabase 등)로 교체. 호출부(라우트/페이지)는 함수 시그니처를
유지하면 그대로 둘 수 있도록 설계되어 있다.

## 인증 모델

- **회원**: 세션 쿠키 `lmu_session` = `userId.HMAC(AUTH_SECRET)`. 비번은 scrypt 해시.
- **소유자 키(getOwnerId)**: 로그인 시 회원ID, 비로그인 시 익명 기기ID(`lmu_did`).
  주문·결제수단·위치를 이 키로 분리·조회한다.
- **관리자**: 별도 쿠키 `lmu_admin`. 아이디·비밀번호 + **Authy(TOTP) 2차 인증**.
  `lib/totp.ts`는 외부 의존성 없이 RFC6238 구현 → Authy/Google Authenticator 호환.

## 외부 연동 & 환경변수

`.env.example` 참고. 비워두면 모의 모드.

| 연동 | 코드 | 환경변수 | 실연동 시 할 일 |
|------|------|----------|----------------|
| KSNET 결제·빌링키 | `lib/ksnet.ts` | `KSNET_MID/MERCHANT_KEY/API_BASE/PAY_URL` | `TODO` 주석의 결제창 필드명·승인 API·해시 규격을 매뉴얼에 맞게 교체 |
| 비즈뿌리오 문자 | `lib/sms.ts` | `BIZPPURIO_USER/PASSWORD/FROM/API_BASE` | 계정·발신번호 입력. token→message 흐름은 구현됨 |
| 관리자 Authy | `lib/admin.ts`,`totp.ts` | `ADMIN_USERNAME/PASSWORD/TOTP_SECRET` | `ADMIN_TOTP_SECRET`(base32)를 Authy 앱에 등록 |
| 세션 서명 | `lib/auth.ts` | `AUTH_SECRET` | 운영에서 임의의 긴 문자열 필수 |
| 사이트 URL | — | `NEXT_PUBLIC_BASE_URL` | PG 콜백 리턴 URL 구성 |

## 결제 플로우

1. `/checkout` → `POST /api/orders` (금액은 **서버에서 재계산**, 클라이언트 값 불신)
2. `POST /api/payments/ksnet/ready` (method: card/saved/applepay/...)
   - `saved`: 빌링키로 즉시 자동결제
   - live + card/간편결제: KSNET 결제창 폼 반환 → 클라이언트가 POST 전송
   - mock: 즉시 승인
3. 승인 성공 시 `lib/fulfill.ts`가 **쿠폰코드 발급 + 비즈뿌리오 문자 발송**
4. `/checkout/complete` 또는 KSNET 콜백(`/api/payments/ksnet/callback`)에서 결과 표시

## 컨벤션

- 도메인 타입은 `lib/types.ts`에 단일 정의. 새 엔티티는 여기에 추가.
- 금액 표시는 `won()`, 클래스 결합은 `classNames()` 사용.
- 색상은 Tailwind 토큰(`brand`=#13C4D3, `accent`=#FF6B6B, `ink`) 사용.
- 민감값(비번 해시, 세션/관리자 토큰, 빌링키, TOTP 시크릿)은 **클라이언트 응답에서 제외**.
- 외부 연동 추가 시 "설정 없으면 mock" 패턴 유지.
- UI 텍스트는 한국어.

## 검증 방법

- 타입/빌드: `npm run build` (배포 전 항상 통과 확인)
- API 스모크: 서버 띄우고 `curl`로 주문→결제→발급 확인 (쿠키 jar 사용)
- 화면: Playwright로 스크린샷 캡처해 확인 가능

## 남은 작업(TODO) — 우선순위 순

1. **인메모리 → 실제 DB 이관** (`lib/store.ts`) — 운영 필수
2. KSNET/비즈뿌리오/Authy 실연동값 주입 및 규격 매핑
3. 쿠폰 **사용처리(코드 검증/차감) API**
4. 환불/주문취소
5. 관리자에서 쿠폰 상품 등록·재고 관리(현재 `lib/data.ts` 시드)
6. 회원 비밀번호 재설정
7. 사업자 정보(푸터의 `○○○`) 실제 값 반영

## 배포 메모

- `amplify.yml`은 Next.js SSR 빌드로 구성됨(`npm ci && npm run build`).
- 환경변수는 Amplify 콘솔에 등록(.env.local은 커밋되지 않음).
- 인메모리 저장소 특성상 SSR 인스턴스가 여러 개면 데이터가 공유되지 않음 →
  DB 이관 전까지는 단일 인스턴스 또는 데모 용도로만.
