# CONVENTIONS.md — mybooks

## 프로젝트 개요

개인 도서 라이브러리. 도서·코믹스·포토북을 관리한다.
배포 URL: https://books.sshlove.com

---

## 기술 스택

- Framework: Next.js 15 App Router + TailwindCSS v4
- Database: Supabase (Auth + PostgreSQL + RLS) — 형제 앱 myaudio와 동일 인스턴스 공유
- Deployment: Vercel
- AI:
  - Claude (`claude-sonnet-5`, `lib/anthropic.ts`) — 하이라이트 AI 해설 (`/api/highlight-explanation`)
  - Gemini (`gemini-3.5-flash-lite`, `lib/gemini.ts`) — 도서 추천, 연도별 독서 통계 코멘트, 월간 리뷰 코멘트
- External API: YES24 Open API (도서 검색·상세, 서버 전용 키 `YES24_API_KEY`)
- Font: Inter (ss03 feature flag 필수)
- dev 런처: Tauri 웹뷰(macOS). JW가 띄우며 에이전트는 실행·종료하지 않는다

---

## 폴더 구조

라우트별 `_components/` 패턴을 쓴다. 해당 라우트 전용 컴포넌트는 그 라우트의 `_components/`에 둔다.

```
mybooks/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                  # 대시보드
│   │   ├── globals.css
│   │   ├── _components/              # 대시보드 전용
│   │   ├── login/page.tsx
│   │   ├── books/
│   │   │   ├── page.tsx, actions.ts, types.ts, constants.ts, utils.ts
│   │   │   ├── _components/
│   │   │   └── highlights/
│   │   │       ├── page.tsx
│   │   │       ├── _components/
│   │   │       └── [bookId]/page.tsx
│   │   ├── comics/                   # page.tsx, actions.ts, types.ts, constants.ts, _components/
│   │   ├── photobook/                # page.tsx, actions.ts, types.ts, constants.ts, utils.ts, _components/
│   │   ├── archive/
│   │   │   ├── page.tsx, yearStats.ts, _components/
│   │   │   └── [year]/[month]/       # page.tsx, _components/
│   │   └── api/
│   │       ├── book-recommend/route.ts
│   │       ├── book-stats-comment/route.ts
│   │       ├── highlight-explanation/route.ts
│   │       └── monthly-review-comment/route.ts
│   ├── components/                   # 공용: ExternalBookSearchSection, AsyncMutationUi, layout/
│   ├── hooks/useAuthState.ts
│   ├── lib/
│   │   ├── supabase/client.ts, server.ts
│   │   ├── yes24.ts, anthropic.ts, gemini.ts
│   │   └── theme.ts, format.ts
│   ├── middleware.ts
│   └── proxy.ts
├── feature_list/                     # BOOK, BUG, COMICS, PHOTOBOOK, SETUP, UX (.json)
├── docs/tasks/                       # 지난 TASK.json 보관
├── TASK.json                         # 현재 작업 지시 1건
├── AGENTS.md, CLAUDE.md, HARNESS.md, CONVENTIONS.md
└── DESIGN.md
```

---

## DB 테이블

형제 앱 myaudio와 동일한 Supabase 인스턴스를 공유한다.
별도 prefix 없음 — 이 앱에서 사용하는 테이블만 접근한다.

### 사용 테이블

| 테이블 | 용도 |
|--------|------|
| `books` | 도서 컬렉션 |
| `comics` | 만화 컬렉션 |
| `photobook` | 포토북 컬렉션 |
| `book_highlights` | 도서 하이라이트 |
| `book_stats_comments` | 연도별 독서 통계 Gemini 코멘트 캐시 |
| `monthly_review_comments` | 월별 Archive Gemini 코멘트 캐시 (myaudio와 공용, `app` 컬럼으로 구분) |

### monthly_review_comments 공용 규칙

- myaudio와 같은 테이블을 `app` 컬럼으로 구분한다. upsert 키는 `(year, month, app)`이다.
- mybooks의 조회·저장 쿼리는 항상 `app` 조건을 건다.

### 접근하지 않는 테이블·버킷 (myaudio 전용)

- 앨범: `album`, `artists`, `album_listen_history`, `album_mood_groups`, `album_moods`
- 헤드파이: `headfi`, `headfi_combos`, `headfi_sales`, `headfi_accessories`, `headfi_accessory_links`, `headfi_device_settings`, `headfi_match_cache`
- 가사: `lyrics`, `lyrics_translations`, `lyrics_translation_tracks`
- Storage 버킷: `lyrics-audio`, `lyrics-covers`, `headfi-fr`

### 공용 요소 변경 주의

`auth.users`, user_id 기반 RLS, `monthly_review_comments`를 바꿀 때는 myaudio에 영향이 없는지 먼저 확인한다. 영향이 있으면 구현하지 말고 TASK.json result에 보고한다.

---

## 환경변수

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
GEMINI_API_KEY=
ANTHROPIC_API_KEY=
YES24_API_KEY=
```

주의: YES24·Gemini·Anthropic 키는 서버 전용 (NEXT_PUBLIC_ 없음)

---

## feature_list/ ID 규칙

| prefix | 카테고리 | 파일 |
|--------|----------|------|
| `SETUP-` | 프로젝트 초기 세팅, 인프라 | SETUP.json |
| `BOOK-` | 도서, 하이라이트, 독서 통계, 도서 추천 | BOOK.json |
| `COMICS-` | 코믹스 | COMICS.json |
| `PHOTO-` | 포토북 | PHOTOBOOK.json |
| `UX-` | 공통 UX, 레이아웃, 테마, 네비게이션, 인증 흐름 | UX.json |
| `BUG-` | 버그 수정 | BUG.json |

---

## 컴포넌트 패턴

- named export 사용
- 서버 컴포넌트 기본, 인터랙션 필요 시 `use client`
- props 타입은 인터페이스로 별도 정의
- 모달 상태 관리: stale state 방지를 위해 API 응답 후 `setViewingItem`과 `setLibrary` 동시 업데이트
- `window.confirm` / `alert` / `prompt` 사용 금지 — Tauri 웹뷰에서 깨질 수 있으므로 인라인 확인 UI를 쓴다

---

## YES24 Open API 이용 규칙 (이용약관 기준)

- 호출은 서버 코드에서만 하고 키는 `YES24_API_KEY` 환경변수로만 읽는다. 키 값을 로그·응답·문서에 남기지 않는다.
- 이 키는 mybooks 전용이다. 다른 앱(myaudio 등)과 공유하지 않는다.
- 검색 결과 화면에 출처를 표기("YES24")하고, 상품별 YES24 상세 링크를 제공한다. 로고·브랜드 색상은 쓰지 않는다(제휴로 오인 금지).
- 사용자가 직접 선택한 도서만 한 권씩 저장한다. 대량·체계적 수집, 별도 DB 구축, 재배포·재판매 금지.
- 무료 API라 예고 후 변경·중단될 수 있다. 공급자 교체가 쉬운 구조(`lib/yes24.ts` 어댑터)와 수기 등록 폴백을 유지한다.
- 호출 한도: 기본키 초당 10회, 하루 20,000회. 429 응답은 사용자에게 "잠시 후 다시 시도" 안내.
- 자세한 조사 내용: `docs/research/yes24-api.md`

---

## AI 규칙

- Claude·Gemini API 호출은 반드시 try/catch로 감싼다
- 하이라이트 AI 해설(Claude)은 `book_highlights.ai_explanation`에 저장하고 재생성·삭제를 지원한다
- `withRetry` 헬퍼로 429 에러 처리 (retry delay는 에러 메시지에서 파싱)
- AI 편향 방지: 후보 아이템 전달 전 random shuffle + slice 적용
- 응답 JSON이 markdown 코드블록으로 감싸진 경우 파싱 전 제거

---

## 디자인 시스템 — Raycast Style

mybooks는 Raycast 마케팅 사이트 디자인 언어를 기반으로 하되, 라이트/다크/자동 테마 토글을 지원한다.
상세 토큰·컴포넌트·반응형 규칙은 루트의 **DESIGN.md** 를 우선 참조한다.

### 색상 토큰

```css
--canvas:          #07080a;   /* 최하단 배경 */
--surface:         #0d0d0d;   /* 기본 카드 배경 */
--surface-elevated:#101111;   /* 한 단계 높은 카드 */
--surface-card:    #121212;   /* 가장 높은 표면 */
--hairline:        #242728;   /* 1px 테두리 */
--hairline-soft:   rgba(255,255,255,0.08);
--hairline-strong: rgba(255,255,255,0.16);
--ink:             #f4f4f6;   /* 헤딩 텍스트 */
--body:            #cdcdcd;   /* 본문 텍스트 */
--mute:            #9c9c9d;   /* 보조 텍스트 */
--ash:             #6a6b6c;   /* 비활성 텍스트 */
--primary:         #ffffff;   /* CTA 버튼 배경 */
--on-primary:      #000000;   /* CTA 버튼 텍스트 */
--accent-blue:     #57c1ff;
--accent-green:    #59d499;
--accent-red:      #ff6161;
--accent-yellow:   #ffc533;
```

### 테마

- 라이트/다크/자동 3가지 모드 지원
- `localStorage`의 `theme-mode` 값으로 관리 (`light` / `dark` / `auto`)
- 다크 토큰: Raycast 팔레트 그대로 사용
- 라이트 토큰: mylibrary 라이트 모드 기준으로 정의
- `<html>` 태그에 `data-theme` 또는 `class="dark"` 방식으로 적용

- **elevation은 배경색으로만** — drop shadow 절대 사용 금지
  - 페이지 배경: `--canvas`
  - 일반 카드: `--surface` + 1px `--hairline` 테두리
  - 모달/elevated 카드: `--surface-elevated`
  - 인터랙티브 요소: `--surface-card`
- **primary CTA는 흰색 단일** — `bg-white text-black` pill 형태, 뷰포트당 1개
- **accent 색상은 일러스트 전용** — 버튼·텍스트·chrome에 사용 금지
- **Inter ss03 필수** — `font-feature-settings: "calt", "kern", "liga", "ss03"` body에 전역 적용
- **border-radius** — 카드 6px, 버튼 9999px(pill), 인풋 8px
- **카드 패딩** — 16px (일반) / 24px (feature 카드), 32px 이상 금지
- 다크모드 차트: Recharts 대신 SVG + CSS 변수 사용
- 커스텀 클래스: `@layer utilities` 필수 (Tailwind v4)

---

## Archive 범위

mybooks Archive는 아래 항목만 집계한다:
- 완독 도서 (`books.status = '완독'`)
- 포토북 등록

코믹스는 Archive와 월간 리뷰 코멘트에서 집계하지 않는다(의도적 제외).