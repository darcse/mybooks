# 📚 mybooks — 개인 도서, 코믹스 및 포토북 라이브러리 명세서

mybooks는 개인이 보유하고 감상한 **도서(Books), 코믹스(Comics), 포토북(Photobook)**을 한곳에서 체계적으로 등록, 검색, 분류하고, **독서 진행도와 하이라이트(Highlights), 연간/월간 아카이브(Archive)**를 통해 독서 맥락을 영구 축적하는 프리미엄 개인 라이브러리 웹 애플리케이션입니다.

본 애플리케이션은 **YES24 Open API**를 연동하여 도서 메타데이터를 자동화하고, **Anthropic Claude(claude-sonnet-5)** 및 **Google Gemini(gemini-3.5-flash-lite)** 다중 AI 모델을 깊이 있게 결합하여 하이라이트 문장 심층 인문 해설, 완독 기반 맞춤 도서 추천, 연간·월간 독서 통계 코멘트 분석 기능을 제공합니다.

---

## 1. 기술 스택 (Tech Stack)

*   **Framework**: Next.js 15 (App Router, Server Actions, Route Handlers), React 19, TypeScript 5
*   **Styling & Design System**: 
    *   Tailwind CSS v4
    *   Raycast 마케팅 사이트 기반 디자인 시스템 (단일 테마 토큰 기반 서피스 래더)
    *   CSS 변수 기반 테마 시스템 (Light / Dark / Auto 모드 지원, `localStorage` 영속화)
    *   Inter 폰트 (`font-feature-settings: "calt", "kern", "liga", "ss03"` 전역 적용)
*   **Database & Auth**: Supabase (PostgreSQL, Supabase Auth, `@supabase/ssr`, Row Level Security)
    *   *주의: myaudio 서비스와 동일한 Supabase 인스턴스를 공유하며, mybooks 도메인 테이블만 독립적으로 사용합니다 (`monthly_review_comments`는 `app` 컬럼으로 구분).*
*   **AI Integration (Multi-Model Architecture)**:
    *   **Anthropic Claude**: `claude-sonnet-5` (인문·역사·사회·철학 하이라이트 문장 심층 AI 해설)
    *   **Google Gemini**: `gemini-3.5-flash-lite` (완독 이력 기반 도서 추천 + Google Search Grounding, 연도별 독서 통계 코멘트, 월별 아카이브 리뷰 코멘트)
*   **External APIs**:
    *   **YES24 Open API**: 도서/만화/화보 실시간 검색 및 메타데이터 자동 완성
    *   **Wikipedia API**: 포토북 모달 내 모델명 기반 일본어 위키피디아 서머리 및 썸네일 조회
*   **Icons & UI Utilities**: Lucide React, Sonner (Toast Provider), React Markdown

---

## 2. 프로젝트 폴더 구조 (Folder Structure)

```
mybooks/
├── public/                     # 정적 에셋 및 PWA 매니페스트 (manifest.json, 아이콘)
├── src/
│   ├── app/
│   │   ├── layout.tsx          # 전역 레이아웃 (Navigation, ThemeAwareToaster 등)
│   │   ├── globals.css         # Raycast 디자인 토큰, Tailwind v4 지시어
│   │   ├── page.tsx            # 메인 대시보드 (Summary, Recent Picks, Timeless)
│   │   ├── _components/        # 대시보드 전용 통계/섹션 컴포넌트
│   │   ├── books/              # 도서 라이브러리 도메인
│   │   │   ├── page.tsx        # 도서 목록/검색/필터
│   │   │   ├── actions.ts      # 도서 Server Actions (CRUD)
│   │   │   ├── types.ts        # 도서 데이터 타입 정의
│   │   │   ├── _components/    # 도서 리스트, 상세 모달, 통계 모달, 폼
│   │   │   └── highlights/     # 하이라이트 서브도메인
│   │   │       ├── page.tsx    # 하이라이트 보유 도서 카드 목록 허브
│   │   │       ├── [bookId]/   # 특정 도서의 하이라이트 상세 페이지
│   │   │       └── _components/# 하이라이트 카드, 인라인 폼, AI 해설 모달
│   │   ├── comics/             # 코믹스 라이브러리 도메인
│   │   │   ├── page.tsx        # 코믹스 목록/검색/필터
│   │   │   ├── actions.ts      # 코믹스 Server Actions (CRUD)
│   │   │   └── _components/    # 코믹스 카드 리스트, 상세 모달, 폼
│   │   ├── photobook/          # 포토북 라이브러리 도메인 (로그인 전용)
│   │   │   ├── page.tsx        # 포토북 목록/검색/필터
│   │   │   ├── actions.ts      # 포토북 Server Actions (CRUD)
│   │   │   └── _components/    # 포토북 그리드, 상세 모달, 동일 모델 모달
│   │   ├── archive/            # 월별 독서/구입 활동 아카이브
│   │   │   ├── page.tsx        # 연도별 월 카드 그리드
│   │   │   ├── [year]/[month]/ # 특정 연월 타임라인 상세 및 AI 리뷰
│   │   │   └── _components/    # 아카이브 그리드, 로그인 프롬프트
│   │   ├── login/              # 계정 로그인 페이지
│   │   │   └── page.tsx
│   │   └── api/                # AI 연동 및 백엔드 Route Handlers
│   │       ├── book-recommend/         # Gemini 완독 이력 기반 도서 추천
│   │       ├── book-stats-comment/     # Gemini 연도별 독서 통계 코멘트 생성/캐싱
│   │       ├── highlight-explanation/  # Claude Sonnet 5 하이라이트 심층 해설
│   │       └── monthly-review-comment/ # Gemini 월간 종합 리뷰 코멘트 생성/캐싱
│   ├── components/             # 공용 UI 컴포넌트
│   │   ├── ExternalBookSearchSection.tsx     # YES24 검색 공통 컴포넌트
│   │   ├── AsyncMutationUi.tsx         # 비동기 상태 피드백 UI
│   │   ├── InlineDeleteConfirm.tsx     # 인라인 삭제 확인 UI
│   │   └── layout/             # Navigation, ThemeAwareToaster
│   ├── hooks/
│   │   └── useAuthState.ts     # Supabase 클라이언트 인증 상태 구독 훅
│   ├── lib/
│   │   ├── supabase/           # Supabase 클라이언트 (client.ts, server.ts)
│   │   ├── yes24.ts            # YES24 Open API 통신 헬퍼
│   │   ├── anthropic.ts        # Anthropic Claude SDK 및 프롬프트 헬퍼
│   │   ├── gemini.ts           # Google Gemini AI SDK 및 프롬프트 헬퍼
│   │   ├── theme.ts            # 라이트/다크/자동 테마 관리 유틸리티
│   │   └── format.ts           # 날짜, 통계 포맷 유틸리티
│   ├── middleware.ts           # 세션 유지 및 라우트 보호 미들웨어
│   └── proxy.ts                # Supabase SSR 세션 갱신 프록시
├── docs/
│   ├── research/               # 외부 API 등 기술 조사 문서
│   └── tasks/                  # 완료된 TASK.json 보관 기록
├── feature_list/               # 하네스 검증 명세서 (BOOK, BUG, COMICS, PHOTOBOOK, SETUP, UX)
├── AGENTS.md                   # 에이전트 행동 규칙 (Cursor용)
├── CLAUDE.md                   # 에이전트 행동 규칙 (Claude Code용)
├── CONVENTIONS.md              # 코딩 컨벤션 및 도메인 규칙
├── DESIGN.md                   # 디자인 시스템 명세
├── HARNESS.md                  # 하네스 운용 및 dev/build 서버 규칙
├── PRODUCT_BRIEF.md            # 제품 브리프
├── TASK.json                   # 현재 작업 지시 1건
└── vercel.json                 # Vercel 배포 리전 설정 (icn1)
```

---

## 3. 데이터베이스 명세 (Database Schema)

mybooks는 myaudio와 동일한 Supabase 인스턴스를 공유하며 아래 6개 테이블만 격리하여 접근·운용합니다.

| 테이블 | 도메인 | 주요 역할 및 저장 정보 |
|---|---|---|
| `books` | 도서 컬렉션 | 기본 서지 정보(제목, 저자, 출판사, 표지, ISBN, 카테고리), 보유 상태, 독서 상태(미독/읽는중/완독), 총 페이지, 현재 페이지(`current_page`), 완독일자, 별점, 감상 메모 등 |
| `comics` | 만화 컬렉션 | 만화 서지 정보, 출판사, 표지, 카테고리, 상태(보유/방출), 진행도, 메모 등 |
| `photobook` | 포토북 컬렉션 | 화보/포토북 메타데이터, 저자/모델명, 출판사, 표지, 상태(소장/방출), 별점, 메모 (로그인 전용) |
| `book_highlights` | 도서 하이라이트 | 도서 외래키(`book_id`), 발췌 문장 본문(`content`), 태그 배열(`tags`), AI 심층 해설 내용(`ai_explanation`) |
| `book_stats_comments` | 독서 통계 코멘트 | 연도(`year`)별 완독 도서 데이터를 기반으로 Gemini가 분석한 독서 성향 총평 코멘트 캐시 |
| `monthly_review_comments` | 월별 아카이브 코멘트 | 연월(`year`, `month`)별 완독 도서·포토북 활동 기록을 요약하여 Gemini가 생성한 월간 리뷰 캐시 (myaudio와 공용이며 `app = 'mybooks'` 조건으로 구분, upsert 키 `year, month, app`) |

*   **Row Level Security (RLS)**: 모든 테이블에 RLS가 활성화되어 있으며, 기본 패턴 `auth.uid() = user_id` 정책으로 쓰기 권한이 엄격하게 격리됩니다.
*   **공개/보호 분기**: 일반 도서(`books`)와 만화(`comics`) 목록은 비로그인 사용자에게도 읽기 권한을 허용하며, 포토북(`photobook`), 아카이브(`archive`), 하이라이트(`/books/highlights`, `/books/highlights/[bookId]`) 및 모든 등록/수정/삭제 액션은 로그인 세션을 요구합니다.

---

## 4. 핵심 기능 명세 (Core Features)

### 4.1. 공통 UX & Raycast 디자인 시스템 & 메인 대시보드 (`/`)

*   **Raycast 스타일 미니멀 디자인 시스템**:
    *   **Surface Ladder**: Drop shadow를 일체 배제하고 배경 색상 계층(`canvas #07080a` → `surface #0d0d0d` → `surface-elevated #101111` → `surface-card #121212`)과 1px `hairline` 테두리만으로 깊이감을 구현.
    *   **타이포그래피**: Inter 폰트에 `calt`, `kern`, `liga`, `ss03` stylistic set을 전역 적용하여 정교한 숫자와 글리프 가독성 제공.
    *   **단일 Primary CTA**: 뷰포트당 1개의 화이트 필(Pill) 버튼(`bg-white text-black rounded-full`) 원칙 준수.
*   **반응형 메인 대시보드 (`/`)**:
    *   **Summary 카드**: 총 도서 수, 보유 도서 수, 읽는 중인 책, 완독 도서 수 통계 및 카테고리별 완독/보유 비율 시각화.
    *   **Recent Picks**: 최근 구입한 도서, 현재 읽고 있는 도서, 최근 구입한 코믹스를 가로형 스크롤 그리드로 신속 조회.
    *   **Timeless 섹션**: 포토북 컬렉션의 최근 항목을 매력적으로 노출.
*   **테마 토글 & 외부 패밀리 앱 연동**:
    *   라이트 / 다크 / 자동(System) 3가지 모드 지원 (`localStorage` 영속화 및 SSR 깜빡임 방지).
    *   GNB 우측에 개인 생태계 패밀리 앱 원클릭 이동 아이콘 탑재 (SSH Love 홈, Audio, SSH Write, My Stock).
*   **PWA(Progressive Web App)**: 모바일 및 데스크탑 웹 홈 화면 추가 지원 (`manifest.json`, 192x192 / 512x512 아이콘, 독립 창 실행).

### 4.2. 도서 라이브러리 (Books — `/books`)

*   **다각도 검색 & 필터링**:
    *   카테고리(IT, UX/UI, 마케팅/비즈니스, 역사, 신화/종교/판타지, 문학, 우주/과학, 인문/사회/철학, 화집/설정집 등), 보유 상태, 도서 형태, 독서 상태(읽기 전/읽는 중/완독) 필터.
    *   실시간 도서명/저자명 검색, 정렬(구입일순, 완독일순, 제목순, 별점순), 페이지네이션.
*   **YES24 검색 기반 도서 등록 및 관리**:
    *   YES24 검색창(`ExternalBookSearchSection`) 키워드 입력으로 서지 메타데이터(제목, 저자, 출판사, 출판일, 정가, 표지, ISBN 등) 원클릭 자동 완성 및 결과 상단 YES24 출처 표기·항목별 "YES24에서 보기" 링크 제공.
    *   YES24 응답의 `adultYn` 값을 반영해 성인 여부(`is_adult`) 자동 설정.
    *   검색 오류를 인증 오류(401/`AUTH_001`·`AUTH_002`), 요청 한도 초과(429/`RATE_001`·`RATE_002`), 일반 오류로 구분해 안내.
    *   도서 등록·수정·삭제의 Server Actions 처리 및 인라인 삭제 확인 UI(`InlineDeleteConfirm`) 적용.
*   **도서 상세 모달 (`BookDetailModal`)**:
    *   도서 정보 탭: 표지, 기본 출판 정보, 별점, 감상 메모 관리.
    *   **독서 진행 페이지 인라인 실시간 편집**: 별도 편집 모드 진입 없이 현재 읽은 페이지(`current_page`)를 즉시 입력·저장(Blur 및 Enter 시 자동 DB 동기화, 초과 페이지 클램핑).
    *   하이라이트 탭: 해당 도서에 기록된 하이라이트 목록 확인 및 신규 등록 연동.
*   **독서 통계 모달 (`ReadingStatsModal`)**:
    *   연도별 완독 수 막대 차트 및 카테고리별 독서 분포 차트 렌더링.
    *   **Gemini 독서 성향 코멘트**: 해당 연도의 완독 목록을 기반으로 독서 성향과 선호 장르를 분석해 5줄 요약 총평 생성 및 `book_stats_comments` 테이블 캐싱.
*   **AI 맞춤 도서 추천 (`BookRecommendModal`)**:
    *   사용자의 과거 완독 이력을 기반으로 Gemini AI가 다음에 읽기 적합한 **보유 중 미독서 1권**과 **외부 신규 도서 1권**을 추천 이유와 함께 제안 (Google Search Grounding 활용).

### 4.3. 하이라이트 시스템 (Highlights)

*   **하이라이트 CRUD & 인라인 편집**:
    *   발췌 문장, 사용자 지정 태그 배열 저장 및 하이라이트 목록 내 인라인 문장·태그 수정.
    *   하이라이트 삭제 시 브라우저 confirm 대신 인라인 확인 UI(`InlineDeleteConfirm`) 사용.
*   **전용 하이라이트 모아보기 허브 (`/books/highlights`)**:
    *   하이라이트가 1개 이상 등록된 도서들만 모아 카드형 뷰로 제공.
    *   도서 카테고리·상태 필터 및 도서명·저자명 실시간 검색.
    *   **도서 필터링 시 빠른 등록**: 특정 도서 카드가 선택된 상태에서 해당 도서의 정보가 자동 바인딩된 하이라이트 신규 등록 폼 모달 제공.
*   **도서별 하이라이트 상세 페이지 (`/books/highlights/[bookId]`)**:
    *   도서 기본 메타데이터 헤더와 해당 도서의 하이라이트 전체 타임라인 뷰.
    *   태그별 다중 필터링 및 날짜순(최신순/과거순) 정렬 토글.
*   **Claude Sonnet 5 기반 심층 AI 해설**:
    *   하이라이트 문장에서 'AI 해설' 클릭 시 **Anthropic Claude(`claude-sonnet-5`)**가 문장이 내포한 역사적·사회적 배경, 핵심 개념의 맥락, 저자의 문제의식, 현대적 시사점을 700자 내외의 한국어로 분석.
    *   생성된 해설은 `book_highlights.ai_explanation` 컬럼에 저장되어 재조회 시 즉시 렌더링되며, 원클릭 재생성(`force`) 및 인라인 확인(`InlineDeleteConfirm`)을 통한 해설 삭제(`DELETE /api/highlight-explanation`) 지원.

### 4.4. 코믹스 라이브러리 (Comics — `/comics`)

*   YES24 검색 연동을 통한 만화책 메타데이터 자동 완성(출처 표기·"YES24에서 보기" 링크, `adultYn` 성인 여부 자동 설정, 검색 오류 구분 안내) 및 등록/수정/인라인 확인 삭제(`InlineDeleteConfirm`).
*   카테고리 및 보유 상태 필터링, 검색, 페이지네이션.
*   코믹스 상세 모달을 통한 독서 진행도 및 권별 소장 메모 관리.

### 4.5. 포토북 라이브러리 (Photobook — `/photobook`, 로그인 전용)

*   YES24 검색 연동 시 도서 카테고리(`category: 'BOOK'`)로 한정하여 검색하며, `adultYn` 성인 여부 자동 설정 및 인라인 삭제 확인(`InlineDeleteConfirm`) 지원.
*   화보 및 포토북 컬렉션 메타데이터 관리, 별점 및 소장/방출 상태 추적.
*   **동일 저자/모델 그룹화 뷰**: 동일한 모델 또는 사진작가의 작품을 한데 모아보는 그룹 모달 제공.
*   **일본어 Wikipedia 연동**: 모델명이 등록된 경우 일본 Wikipedia API를 비동기 호출하여 모델 프로필 요약 서머리와 대표 썸네일 이미지를 상세 모달에 자동 렌더링.

### 4.6. 아카이브 (Archive — `/archive`, 로그인 전용)

*   **연도별 월 카드 그리드 (`/archive`)**:
    *   완독 도서(`books.status = '완독'`)와 포토북(`photobook`) 등록 이력을 월별로 자동 집계하여 매트릭스 카드로 시각화.
*   **월별 활동 상세 타임라인 (`/archive/[year]/[month]`)**:
    *   해당 월에 완료된 도서 완독 및 포토북 등록 타임라인 제공.
    *   타임라인 항목 클릭 시 각 도메인의 상세 정보 모달로 다이렉트 연결.
    *   **Gemini 월간 종합 리뷰 코멘트**: 한 달 동안의 완독 도서·포토북 활동을 분석하여 월간 회고 총평을 생성하고 `monthly_review_comments`(`app = 'mybooks'`)에 캐싱.

---

## 5. API 엔드포인트 명세 (API Endpoints)

모든 `/api/*` 엔드포인트는 Supabase 로그인 세션을 요구하며, 미인증 시 `401 Unauthorized`를 반환합니다.

| 엔드포인트 | 메서드 | 사용 AI / 모델 | 캐시 테이블 | 설명 |
|---|---|---|---|---|
| `/api/book-recommend` | `POST` | Google Gemini (`gemini-3.5-flash-lite`) | — | 완독 이력과 미독 보유 목록을 분석하여 보유 도서 1권 + 외부 도서 1권 맞춤 추천 반환 (YES24 검색으로 외부 링크 보강) |
| `/api/book-stats-comment` | `GET`, `POST` | Google Gemini (`gemini-3.5-flash-lite`) | `book_stats_comments` | 연도별 완독 도서 기반 독서 성향 총평 코멘트 캐시 조회(`GET`) 및 생성·저장(`POST`) |
| `/api/highlight-explanation` | `POST`, `DELETE` | Anthropic Claude (`claude-sonnet-5`) | `book_highlights` (`ai_explanation`) | 발췌 문장 700자 심층 해설 생성·재생성(`POST`) 및 저장된 해설 초기화(`DELETE`) |
| `/api/monthly-review-comment` | `GET` | Google Gemini (`gemini-3.5-flash-lite`) | `monthly_review_comments` (`app = 'mybooks'`) | 해당 월의 완독 도서·포토북 활동 내역 조회 및 월간 회고 코멘트 캐시 조회·생성(`?refresh=1` 재생성) |

---

## 6. 인증 및 세션 아키텍처 (Authentication)

*   **인증 프로바이더**: Supabase Auth (Email / Password).
*   **세션 지속성**: `@supabase/ssr`을 채택하여 브라우저 쿠키 기반으로 세션을 안전하게 동기화하며, Next.js Server Components 및 Server Actions에서 동일한 세션 컨텍스트 공유.
*   **접근 권한 통제**:
    *   공개 경로: 메인 대시보드(`/`), 도서 목록(`/books`), 코믹스 목록(`/comics`), 로그인(`/login`). (단, `is_adult` 항목은 비로그인 시 열람 제한, 대시보드 Timeless 포토북 섹션은 로그인 시에만 조회)
    *   보호 경로:
        *   미들웨어(`src/middleware.ts` → `src/proxy.ts`): `/archive` 및 하위 경로 비로그인 접근 시 `/login` 리다이렉트, 로그인 상태에서 `/login` 접근 시 `/` 리다이렉트.
        *   페이지 로그인 가드(비로그인 시 로그인 프롬프트 노출): 포토북(`/photobook`), 하이라이트 모아보기(`/books/highlights`), 도서별 하이라이트 상세(`/books/highlights/[bookId]`), 아카이브(`/archive`, `/archive/[year]/[month]`).
        *   모든 데이터 CUD Server Actions 및 `/api/*` Route Handlers는 로그인 세션 필수.

---

## 7. 개발 및 실행 가이드 (Development & Setup)

### 7.1. 로컬 환경 변수 설정 (`.env.local`)

프로젝트 루트의 `.env.local` 파일에 다음 환경 변수 키들을 설정합니다. (값은 비공개 유지)

```env
# Supabase 연결 설정 (공통 인스턴스)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# YES24 Open API 키 (서버 전용)
YES24_API_KEY=

# Google Gemini API 키 (도서 추천 및 통계/아카이브 코멘트)
GEMINI_API_KEY=

# Anthropic Claude API 키 (하이라이트 심층 AI 해설)
ANTHROPIC_API_KEY=
```

### 7.2. 명령어 가이드 (Scripts)

```bash
# 의존성 패키지 설치
npm install

# Turbopack 기반 로컬 개발 서버 기동 (http://localhost:3000)
npm run dev

# 빌드 및 타입 검사
npm run build

# 실행 중 개발 서버(.next)를 덮지 않는 빌드 검증 (.next-buildcheck 사용)
npm run build:check

# ESLint 린트 검사
npm run lint

# 프로덕션 빌드 서버 기동
npm start
```

### 7.3. 개발 문서

*   `AGENTS.md` / `CLAUDE.md`: 에이전트 공통 행동 규칙 및 작업 핸드오프 규칙
*   `HARNESS.md`: 하네스 운용 흐름 및 검증 규칙
*   `CONVENTIONS.md`: 프로젝트 스택·DB·도메인 규칙
*   `feature_list/`: 도메인별 기능 스펙 및 검증 명세
*   `TASK.json` / `docs/tasks/`: 현재 작업 지시 1건 및 지난 작업 기록
*   `docs/research/`: 외부 API 등 기술 조사 문서
