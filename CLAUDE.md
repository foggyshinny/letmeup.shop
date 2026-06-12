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
  coupons/                      # 목록 / [id] 상세 (시드 + 판매자 상품 병합)
  cart/ checkout/ checkout/complete/
  account/                      # 마이페이지, orders(구매내역), payment-methods(지갑)
  login/ signup/
  sell/                         # 파트너 입점 안내(랜딩) → /partner/*로 연결
  partner/                      # ★ 판매자(파트너) 센터
    login/ signup/              #   판매자 로그인 / 입점 신청
    page.tsx                    #   대시보드(매출·정산·내 상품)
    products/new/ [id]/edit/    #   상품 등록·수정
    settings/                   #   담당자 정보·정산 계좌
  admin/ admin/login/           # 관리자 대시보드 + Authy 로그인
  admin/sellers/                #   판매자 승인·정지 관리
  api/
    auth/        signup·login·logout·me
    partner/     signup·login·logout·me·settings·products[/id]
    orders/      GET(내역)·POST(생성)
    coupons/     GET(시드+판매자 상품 병합)
    payment-methods/ [id]/
    location/
    payments/ksnet/ ready·callback
    admin/       login·logout·setup·sellers/[id](승인/정지)
components/                     # Header, Footer, CartContext, AuthContext,
                                # CouponCard, AddToCart, PayMethodSelector,
                                # NearbyStores, AdminLogoutButton,
                                # Partner*(ProductForm/ProductActions/SettingsForm/LogoutButton),
                                # AdminSellerActions
lib/
  types.ts     도메인 타입(단일 출처) — Coupon/User/Order/Seller 등
  data.ts      쿠폰/카테고리 시드 데이터(플랫폼 직접 상품)
  catalog.ts   ★ 시드 + 판매자 상품 병합 카탈로그 (서버 전용, async)
  product.ts   판매자 상품 입력 검증/정규화 + 썸네일 옵션
  places.ts    매장 위치 시드 + 거리(하버사인)
  store.ts     ★ 저장소 공개 API (orders/users/paymentMethods/locations/sellers/products)
  format.ts    won(), classNames()
  device.ts    getDeviceId() / getOwnerId()
  auth.ts      회원 비번 해시(scrypt)·세션(HMAC)
  seller.ts    판매자 세션(lmu_seller)·수수료율
  admin.ts     관리자 설정·세션
  totp.ts      RFC6238 TOTP(Authy 호환, 무의존)
  ksnet.ts     KSNET 결제/빌링키 어댑터
  sms.ts       비즈뿌리오 문자 어댑터
  fulfill.ts   쿠폰코드 발급 + 문자 발송
middleware.ts  익명 기기 쿠키(lmu_did) 보장
public/legacy/ 기존 키오스크 랜딩(정적) 보존
```

## 데이터 / 상태

`lib/store.ts`는 **비동기 공개 API**이며, 환경변수에 따라 백엔드를 자동 선택한다:

- `DYNAMODB_TABLE` 가 있으면 → **DynamoDB** (`lib/dynamo.ts`, 운영/영속)
- 없으면 → **프로세스 인메모리** (개발/데모, 재시작 시 초기화)

DynamoDB는 **단일 테이블 + GSI("gsi1")** 구조다. 키 설계는 `lib/dynamo.ts` 상단 주석 참고.
모든 store 함수는 async이므로 호출부는 `await`만 붙이면 백엔드와 무관하게 동작한다.

**테이블 생성**: `npm run db:create-table` (환경변수 `DYNAMODB_TABLE`, `AWS_REGION`).
로컬 테스트는 DynamoDB Local + `DYNAMODB_ENDPOINT=http://localhost:8000`.

> 관리자 통계의 `listAllOrders`/`countUsers`는 Scan 기반이라 데이터가 많아지면
> 전용 GSI나 집계 테이블로 개선 필요(현재는 데모/저volume 가정).

## 인증 모델

- **회원**: 세션 쿠키 `lmu_session` = `userId.HMAC(AUTH_SECRET)`. 비번은 scrypt 해시.
- **소유자 키(getOwnerId)**: 로그인 시 회원ID, 비로그인 시 익명 기기ID(`lmu_did`).
  주문·결제수단·위치를 이 키로 분리·조회한다.
- **판매자(파트너)**: 별도 쿠키 `lmu_seller` = `seller:<id>.HMAC(AUTH_SECRET)`.
  비번은 회원과 동일한 scrypt(`lib/auth.ts`) 재사용. 입점 신청 시 `pending`,
  관리자 승인 시 `approved`가 되어야 상품 등록 가능. `lib/seller.ts` 참고.
- **관리자**: 별도 쿠키 `lmu_admin`. 아이디·비밀번호 + **Authy(TOTP) 2차 인증**.
  `lib/totp.ts`는 외부 의존성 없이 RFC6238 구현 → Authy/Google Authenticator 호환.

## 마켓플레이스(판매자) 모델

- 상품(`Coupon`)은 두 출처가 **카탈로그(`lib/catalog.ts`)에서 병합**된다:
  시드(`lib/data.ts`, `sellerId` 없음) + 판매자 등록 상품(저장소, `sellerId` 보유).
- 노출은 `status !== "inactive"`인 상품만. 서버(페이지/라우트)는 `lib/catalog.ts`를
  통해 읽고, 클라이언트(장바구니/결제)는 `/api/coupons`로 병합 목록을 받는다.
- 주문 금액은 항상 서버에서 `catalog.findCoupon`으로 **재계산**(클라이언트 값 불신).
- 정산: 판매자 대시보드가 결제완료 주문에서 자기 상품 매출을 집계하고
  수수료율(`commissionRate`, 기본 10%)을 적용해 정산 예정액을 보여준다.

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

1. ~~인메모리 → 실제 DB 이관~~ ✅ DynamoDB 백엔드 구현됨(`lib/dynamo.ts`). 배포 시 테이블 생성 + `DYNAMODB_TABLE` 설정.
2. KSNET/비즈뿌리오/Authy 실연동값 주입 및 규격 매핑
3. 쿠폰 **사용처리(코드 검증/차감) API**
4. 환불/주문취소
5. ~~판매자 상품 등록·관리~~ ✅ 파트너 센터(`/partner/*`)에서 판매자가 직접 등록·수정.
   남은 것: 결제 성공 시 **재고 차감**(현재 시드/판매자 상품 모두 미차감), 판매자별 **정산 실행/이체** 연동.
6. 회원 비밀번호 재설정
7. 사업자 정보(푸터의 `○○○`) 실제 값 반영
8. 관리자 통계 Scan → GSI/집계로 개선 (대량 데이터 시). 판매자 매출 집계도 현재 전체 주문 Scan.

## 배포 메모

- `amplify.yml`은 Next.js SSR 빌드로 구성됨(`npm ci && npm run build`).
- 환경변수는 Amplify 콘솔에 등록(.env.local은 커밋되지 않음).
- 인메모리 저장소 특성상 SSR 인스턴스가 여러 개면 데이터가 공유되지 않음 →
  DB 이관 전까지는 단일 인스턴스 또는 데모 용도로만.
