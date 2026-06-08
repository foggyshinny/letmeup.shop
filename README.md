# letmeup.shop — 쿠폰 할인 마켓

스터디카페 이용권부터 카페·외식·뷰티·문화·기프트카드까지, 할인 쿠폰을 판매하는
커머스 사이트입니다. 할인/기프트 쿠폰 판매를 메인으로, 판매자 입점(마켓플레이스)
확장을 염두에 두고 설계했습니다.

- **프레임워크**: Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **결제**: KSNET PG 연동 (환경변수 미설정 시 자동으로 모의 결제 모드)
- **배포**: AWS Amplify Hosting (`amplify.yml`)

---

## 빠른 시작

```bash
npm install
cp .env.example .env.local   # 필요시 값 채우기 (없어도 모의 결제로 동작)
npm run dev                  # http://localhost:3000
```

프로덕션 빌드:

```bash
npm run build && npm start
```

---

## 화면 구성

| 경로 | 설명 |
|------|------|
| `/` | 홈 — 히어로, 카테고리, 인기/할인율 쿠폰 |
| `/coupons` | 전체 쿠폰 목록 (카테고리 필터 + 정렬) |
| `/coupons/[id]` | 쿠폰 상세 — 가격·유효기간·사용법, 장바구니/바로구매 |
| `/cart` | 장바구니 (localStorage 기반) |
| `/checkout` | 구매자 정보 입력 → 결제 진행 |
| `/checkout/complete` | 결제 완료/실패 결과 |
| `/sell` | 판매자 입점 신청 (마켓플레이스 확장) |
| `/legacy/index.html` | 기존 렛미업 키오스크 소개 랜딩페이지 (보존) |

## API

| 경로 | 메서드 | 설명 |
|------|--------|------|
| `/api/coupons` | GET | 쿠폰 목록 (`?category=` 필터) |
| `/api/orders` | POST | 주문 생성 (금액은 **서버에서 재계산**) |
| `/api/payments/ksnet/ready` | POST | 결제 준비 — 실거래 시 결제창 폼, 모의 시 즉시 승인 |
| `/api/payments/ksnet/callback` | GET/POST | KSNET 결제창 콜백 → 승인 후 완료 페이지로 리다이렉트 |

---

## KSNET PG 연동

연동에 필요한 값은 환경변수로 주입합니다. **값이 비어 있으면 자동으로 모의(mock)
결제 모드**로 동작하므로, 키 없이도 전체 구매 플로우를 시연·개발할 수 있습니다.

```
NEXT_PUBLIC_BASE_URL   사이트 base URL (콜백 리턴 URL 구성)
KSNET_MID              가맹점 ID
KSNET_MERCHANT_KEY     가맹점 라이선스/서명 키
KSNET_API_BASE         승인 API 베이스 URL
KSNET_PAY_URL          결제창 호출 URL
```

연동 코드는 `lib/ksnet.ts` 한 곳에 모여 있습니다. KSNET 계약 상품(KSPAY 표준결제 등)의
연동 매뉴얼을 받으면 다음 `TODO` 지점만 실제 규격에 맞추면 됩니다.

- `buildPaymentRequest()` — 결제창 POST 필드명/서명 규격
- `approve()` — 승인 API 엔드포인트·요청/응답 파싱
- `signRequest()` — 해시 대상 필드/순서/알고리즘
- `app/api/payments/ksnet/callback/route.ts` — 콜백 파라미터명 파싱

---

## 데이터 / 상태

현재 쿠폰 카탈로그는 `lib/data.ts`의 시드 데이터이며, 주문은 `lib/store.ts`의
인메모리 저장소(개발/데모용)에 보관됩니다. 운영 전환 시 `lib/store.ts`의 구현부만
DB(DynamoDB / RDS / Supabase 등)로 교체하면 호출부 변경 없이 연결됩니다.

> **참고**: 인메모리 저장소는 서버 재시작 시 초기화됩니다. 실제 운영에서는 반드시
> 영속 저장소로 교체하세요.

---

## 디렉터리 구조

```
app/
  layout.tsx, page.tsx          # 레이아웃 + 홈
  coupons/                      # 목록 / 상세
  cart/  checkout/  sell/       # 장바구니 / 결제 / 입점
  api/                          # orders, coupons, payments/ksnet
components/                     # Header, Footer, CouponCard, CartContext, AddToCart
lib/                           # types, data(시드), store(주문), ksnet(PG), format
public/legacy/                 # 기존 키오스크 랜딩페이지(정적) 보존
```

---

_쿠폰 판매 사이트로 개편 · Next.js 풀스택 · KSNET PG 연동 골격 포함_
