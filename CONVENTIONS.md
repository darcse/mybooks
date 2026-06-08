# CONVENTIONS.md — mybooks

## 프로젝트 개요

개인 도서 라이브러리. 도서·코믹스·포토북을 관리한다.
배포 URL: https://books.sshlove.com

---

## 기술 스택

- Framework: Next.js 15 App Router + TailwindCSS v4
- Database: Supabase (Auth + PostgreSQL + RLS) — mylibrary와 동일 인스턴스 공유
- Deployment: Vercel
- AI: Gemini API (`gemini-3.1-flash-lite-preview`)
- External API: 알라딘 TTB
- Font: Inter (ss03 feature flag 필수)

---

## 폴더 구조

```
mybooks/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx              # 대시보드
│   │   ├── globals.css
│   │   ├── login/page.tsx
│   │   ├── books/
│   │   │   ├── page.tsx
│   │   │   └── highlights/page.tsx
│   │   ├── comics/page.tsx
│   │   ├── photobook/page.tsx
│   │   ├── archive/
│   │   │   ├── page.tsx
│   │   │   └── [year]/[month]/page.tsx
│   │   └── api/
│   │       ├── book-recommend/route.ts
│   │       ├── book-stats-comment/route.ts
│   │       └── monthly-review-comment/route.ts
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   └── features/
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   └── server.ts
│   │   ├── aladin.ts
│   │   └── utils.ts
│   ├── hooks/
│   └── types/
│       └── index.ts
├── feature_list/
│   ├── SETUP.json
│   ├── BOOK.json
│   ├── COMICS.json
│   ├── PHOTO.json
│   ├── UX.json
│   ├── AUTH.json
│   └── BUG.json
├── .env.local
├── CLAUDE.md
├── AGENTS.md
├── HARNESS.md
├── CONVENTIONS.md
├── claude-progress.txt
└── Codex-progress.txt
```

---

## DB 테이블

mylibrary와 동일한 Supabase 인스턴스를 공유한다.
별도 prefix 없음 — 이 앱에서 사용하는 테이블만 접근한다.

### 사용 테이블

| 테이블 | 용도 |
|--------|------|
| `books` | 도서 컬렉션 |
| `comics` | 만화 컬렉션 |
| `photobook` | 포토북 컬렉션 |
| `book_highlights` | 도서 하이라이트 |
| `book_stats_comments` | 연도별 독서 통계 Gemini 코멘트 캐시 |
| `monthly_review_comments` | 월별 Archive Gemini 코멘트 캐시 |

### 접근하지 않는 테이블 (myaudio 전용)

`album`, `headfi`, `lyrics`, `album_listen_history`, `album_mood_groups`, `album_moods`

---

## 환경변수

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
GEMINI_API_KEY=
ALADIN_TTB_KEY=
```

주의: 알라딘 키는 `ALADIN_TTB_KEY` (서버 전용, NEXT_PUBLIC_ 없음)

---

## feature_list/ ID 규칙

| prefix | 카테고리 |
|--------|----------|
| `SETUP-` | 프로젝트 초기 세팅 |
| `BOOK-` | 도서 |
| `COMICS-` | 코믹스 |
| `PHOTO-` | 포토북 |
| `UX-` | 공통 UX / 레이아웃 |
| `AUTH-` | 인증 |
| `BUG-` | 버그 수정 |

---

## 컴포넌트 패턴

- named export 사용
- 서버 컴포넌트 기본, 인터랙션 필요 시 `use client`
- props 타입은 인터페이스로 별도 정의
- 모달 상태 관리: stale state 방지를 위해 API 응답 후 `setViewingItem`과 `setLibrary` 동시 업데이트

---

## AI (Gemini) 규칙

- Gemini API 호출은 반드시 try/catch로 감싼다
- `withRetry` 헬퍼로 429 에러 처리 (retry delay는 에러 메시지에서 파싱)
- AI 편향 방지: 후보 아이템 전달 전 random shuffle + slice 적용
- 응답 JSON이 markdown 코드블록으로 감싸진 경우 파싱 전 제거

---

## 디자인 시스템 — Raycast Style

mybooks는 Raycast 마케팅 사이트 디자인 언어를 적용한다.
**다크 전용** — 라이트/자동 테마 없음. 테마 토글 UI 구현하지 않는다.

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

### 적용 규칙

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
- 코믹스 등록
- 포토북 등록
