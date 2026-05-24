# letmeup.shop 검수 리포트

> 검수 대상: `C:\samagt\letmeup.shop\pages\index.html` (262KB, 자족버전)
> 검수 일자: 2026-05-23
> 검수 방법: 정적 코드 분석 + Playwright(Chromium) 헤드리스 렌더링 (Desktop 1440 / Mobile 390)

---

## 0. 검수 요약 (한 줄)

전체 마크업·디자인은 양호. ~~README에 명시된 동적 동작 3종이 JS에 구현되어 있지 않음.~~ → **§1에서 발견된 누락 JS는 lp.classup.io 패턴을 참조해 적용 완료(✅).** 남은 작업은 SEO 메타 + ··· 자리표시자 9개 + 검토 항목.

---

## 1. ✅ 누락 JS — 적용 완료 (2026-05-23)

README가 약속한 동적 동작 중 실제 누락된 2가지를 `lp.classup.io/pages/homepage-zero/index.html` 의 패턴을 참고해 이식. 백업은 `pages/index.backup-20260523-032603.html`.

### 1.1 Stats 카운트업 애니메이션 ✅ 적용 완료
- 진단: 마크업의 `data-target` 속성을 읽는 JS 부재 → 4개 지표가 `0` 고정.
- 패치: `IntersectionObserver(threshold 0.4)` + `easeOutCubic` 보간으로 진입 시 0→목표값. `toLocaleString('ko-KR')`로 천 단위 콤마(1,825).
- 검증: 120 / 12 / 360 / 1,825 정상 표시 (스크린샷 `verify-stats.png`).

### 1.2 Floating CTA 스크롤 제어 ✅ 적용 완료
- 진단: `.scrolled`/`.hidden` CSS 훅은 있으나 JS 없음 → 말풍선 항상 표시.
- 패치: scroll 이벤트에 `requestAnimationFrame` rAF throttle, 두 분기:
  - `scrollY > heroBottom * 0.5` → `.scrolled` (말풍선 fade out)
  - FinalCTA `getBoundingClientRect().top < viewport*0.8` → `.hidden` (전체 숨김)
- DOMContentLoaded로 감싸 floatCta `<div>`가 script 뒤에 와도 동작.
- 검증: 두 클래스 모두 스크롤 위치에 따라 정확히 토글 (Playwright 자동 검증 통과).

### 1.3 Hero 3D 틸트 — 오진단 정정
- 처음엔 누락으로 표시했으나, 실제로는 CSS `transform: perspective(1200px) rotateY(-6deg) rotateX(2deg)` (line 834) + hover 효과로 이미 구현되어 있음. mousemove 기반 인터랙티브 틸트는 아니지만 README가 약속한 "3D 틸트"는 정적 CSS로 충족.

> 분리버전 `index.assets-separated.html`에도 동일 패치 적용 완료. 백업은 `pages/index.assets-separated.backup-*.html`.

---

## 2. ··· 자리표시자 9곳 — 실수치 필요

| # | 위치 | 라인 | 현재 문구 |
|---|---|---:|---|
| 1 | Problems 04 | 1655 | "새 키오스크 한 대 사려면 **···만 원**" |
| 2 | AdoptOptions 옵션2 | 1974 | 설치기간 "약 **···일**" |
| 3 | AdoptOptions 옵션3 | 2008 | 설치기간 "약 **···일**" |
| 4 | Testimonial 1 본문 | 2153 | "새 거 사려니 **···만 원**" |
| 5 | Testimonial 1 작성자 | 2158 | "**···스터디카페** · 운영 **···년차**" |
| 6 | Testimonial 2 작성자 | 2170 | "**···스터디카페** · 2호점 준비 중" |
| 7 | Testimonial 3 본문 | 2177 | "들어온 지 **···개월**" |
| 8 | Testimonial 3 작성자 | 2182 | "**···스터디카페** · **···지점**" |
| 9 | FAQ 설치기간 | 2271 | "평균 **···일 이내**" |

---

## 3. SEO / 공유 메타 — 누락

현재 `<head>`에는 charset / viewport / description / title 만 있음. 마케팅 랜딩페이지로서 다음이 빠져 있어 카톡·페북·트위터 공유 시 미리보기가 깨지거나 빈약하게 보입니다.

누락된 항목: `og:title`, `og:description`, `og:image`, `og:url`, `og:type`, `twitter:card`, `<link rel="canonical">`, `<link rel="icon">` (파비콘), `application/ld+json` 구조화 데이터.

권장: OG 이미지(1200×630) 1장 제작 후 위 메타 일괄 추가. 약 15줄.
---

## 4. 검토 필요 (대표님 의사결정)

| 항목 | 현재 상태 | 결정 필요 |
|---|---|---|
| 메인 전화번호 | `1688-4264` | 렛미업 전용 번호 / 채널톡 / 카카오 상담 채널로 교체 여부 |
| 메인 이메일 | `samlab@samlab.co.kr` | 렛미업 전용 메일로 교체 여부 |
| GTM/Pixel | 미설치 | classup처럼 `GTM-P9GD9RPR` 또는 별도 컨테이너 삽입 여부 |
| 옵션 카드 비주얼 | SVG 아이콘 (icon-cursor, icon-kiosk, icon-face) | 키오스크 실제 사진으로 교체 예정 → 이미지 수령 시 `assets/`에 배치 후 마크업 교체 |
| 베리어프리 사양 (옵션3) | "점자/음성/고대비" 명시 | 실제 제품 사양과 대조 검증 |

---

## 5. 렌더링 검수 결과 (시각)

### Desktop (1440px)
- 페이지 총 높이: 13,582px (스크롤 14화면)
- Hero · Stats · Problems · Compare · AdoptOptions · Pillars · Features · Testimonials · Process · FAQ · FinalCTA · Footer 모두 정상 표시
- 색상: 시안 `#13C4D3` / 오렌지 `#F5A05B` / 그린 `#5BB948` 의도대로 적용
- 폰트: Pretendard(본문) / Plus Jakarta Sans(영문 라벨) 정상 로드

### Mobile (390px)
- 페이지 총 높이: 18,982px
- 모든 섹션 1-column 자동 전환 정상
- Hero 헤드라인 줄바꿈 자연스러움 ("지금 쓰는 키오스크, / 바꾸고 싶어도 / 못 바꾸셨죠?")
- Floating CTA 하단 풀폭바로 잘 떠 있음 (단, 항상 표시 → §1.2 참고)

### 발견된 경미한 시각 이슈
- **푸터 로고**: 디자인적 의도로 보이는 흰색 변환(`filter: brightness(0) invert(1)`) 정상. 다만 원본 SVG가 PNG 래스터를 패턴으로 채운 형태라 확대 시 흐릿. 향후 진짜 벡터 로고로 교체 권장.
- **Adopt 옵션 카드 OPTION 02**: "가장 많은 선택" 배지가 카드 우상단에서 약간 잘림 (모바일).
- **Stats 섹션**: 모든 값이 "0"으로 고정 (§1.1 참고).

---

## 6. 코드 품질 체크

| 항목 | 결과 |
|---|---|
| HTML 태그 균형 (div/section/span/p/a/button/ul/li) | ✅ 모두 균형 |
| `<html lang="ko">` | ✅ |
| `<meta name="viewport">` | ✅ |
| `<title>` | ✅ "스터디카페 키오스크, 사장님 손해 본 것만 다시 설계했습니다 · 렛미업" |
| `<meta name="description">` | ✅ (158자, 적정) |
| 헤딩 위계 (h1 1개, h2 12개, h3/h4 적절) | ✅ |
| 이미지 alt 속성 | ✅ 9개 의도적 빈 alt (장식용), 본문 이미지는 alt 있음 |
| 빈 href/src | ✅ 없음 |
| `target="_blank"` 보안 (rel) | ✅ 해당 없음 |
| `aria-label` | ✅ FloatCTA 전화 버튼에 부착됨 |
| 외부 의존성 | Google Fonts CDN(Pretendard, Plus Jakarta Sans) 1건만 |

---

## 7. 권장 작업 순서

1. **§1 누락 JS 3종 추가** — 가장 임팩트 큼. ~50줄로 README와 실제 동작 정렬.
2. **§2 ··· 자리표시자 9개 채우기** — 대표님께 실수치 받아서 일괄 교체.
3. **§3 SEO 메타 추가** — OG 이미지 1장 제작 + 메타 15줄 추가.
4. **§4 검토 항목 의사결정** — 전화번호 / 추적코드 / 옵션카드 이미지.
5. **소소한 시각 다듬기** — 푸터 로고 벡터화, OPTION 02 배지 잘림 보정.

---

## 8. 다음 액션 (제안)

위 1~5번 중 어느 것부터 작업할지 알려주시면 바로 진행합니다. 가장 추천하는 순서는:

- **단기(오늘 30분)**: §1 JS 패치 → 페이지가 README 약속대로 살아 움직임
- **중기(이번 주)**: §2 ···· 실수치 + §3 SEO 메타 → 마케팅 송출 가능 상태
- **장기**: §4 의사결정 항목들 + 새 옵션카드 이미지 수령 후 교체

