# BUG-001~006 검수 결과

**날짜:** 2026-06-12
**검토자:** Claude Code (검증 전용)
**결과:** BUG-001~006 **전원 통과** → BUG.json passes false→true 6건 변경
**빌드:** `npx tsc --noEmit` 에러 0 / `npm run build` 성공(13 페이지 생성, `<img>` 경고만)

| ID | 결과 | 핵심 확인 |
|----|------|-----------|
| BUG-001 | ✅ 통과 | `MonthlyTimeline.tsx:190` `shadow-sm` 제거 → `bg-surface-elevated`. 프로젝트 전체 `shadow-` 0건 |
| BUG-002 | ✅ 통과 | `lib/aladin.ts` 반환 shape `{items, total}` 통일, `formatPubDate`→`lib/format.ts`, 3개 actions가 lib import·재export, 3개 클라 `result.total ?? 0` |
| BUG-003 | ✅ 통과 | `searchAladinBooks` `page/display`→`start`/`MaxResults` 반영, `ToastDemo.tsx` 삭제 확인 |
| BUG-004 | ✅ 통과 | `ReadingStatsModal` 1029→**167줄**, 차트/코멘트 5개 컴포넌트+`useReadingStatsData` 훅 분리 |
| BUG-005 | ✅ 통과 | `Navigation` `isLoginPage` 분기 — `/login`서 메뉴·햄버거 숨김, `themeToggle`만 유지, 타 페이지 정상 |
| BUG-006 | ✅ 통과 | `aladin.ts` fetch 2곳+JSON 파싱 try/catch, 한글 에러 throw, 호출부와 충돌 없음 |

### 세부 메모 (통과, 후속 참고용)
- **BUG-003**: `page/display` 파라미터는 API 요청에 반영되나, 현재 클라 호출부는 모두 `(query, 1, ALADIN_SEARCH_DISPLAY)`로 고정 1페이지만 요청. 실제 페이지네이션 UI는 별도 항목으로 추후 추가 여지(이번 step 범위는 "파라미터 반영"이므로 통과).
- **BUG-006**: `getAladinItemByIsbn`가 기존 `!res.ok → return null`에서 `throw`로 동작 변경됨. 호출부 3곳(`Books/Comics/PhotobookLibraryContent`)이 `.catch(() => {})`로 흡수하므로 ISBN 자동조회 실패 시 조용히 무시(기존 동작과 사실상 동일). `book-recommend/route.ts`는 try/catch 내부라 안전. 충돌 없음.
- **라이트/다크 시각 확인(BUG-001)**: `--surface-elevated` 토큰이 양 테마에 정의되어 토큰 기반 구분은 충족. 픽셀 단위 수동 확인은 미실시(Playwright 미사용 정책).

---

# 코드 품질 진단 — 전체 검토 (이전 세션)

**날짜:** 2026-06-12
**검토자:** Claude Code (진단 전용 — 코드 수정 없음)
**범위:** `src/app`, `src/components`, `src/lib` (69개 파일)

> 우선순위: 🔴 즉시 수정 / 🟡 개선 권장 / 🟢 양호(확인됨)

---

## 1. CLAUDE.md 규칙 위반

### 🟢 any 타입 — 위반 없음
`: any` / `as any` / `<any>` 전수 검색 결과 0건. `gemini.ts`는 `catch (error: unknown)` + 타입 가드로 올바르게 처리.

### 🟢 default export — 위반 아님
`export default`는 `app/**/page.tsx`, `app/login/page.tsx` 등 Next.js App Router가 **강제하는** 파일에만 존재. 일반 컴포넌트는 전부 named export 준수. (규칙 "컴포넌트는 named export"는 page/layout 제외이므로 정상)

### 🟢 use client — 대체로 정당
`use client`가 붙은 34개 파일은 모두 상태/이벤트/훅을 사용하는 인터랙티브 컴포넌트. 명백한 불필요 사용은 발견되지 않음. 서버 컴포넌트(대시보드 `page.tsx`, archive 페이지 등)는 `use client` 없이 유지.

### 🟡 인접 코드 무단 개선 흔적
정적 분석으로 직접 증거를 확정하기 어려움. 다만 아래 2번의 "병렬 모듈 미묘한 차이"(반환 shape 불일치)가 부분 수정의 흔적일 가능성 있음 — 2번 참조.

---

## 2. 구조적 이슈

### 🔴 거대 컴포넌트 (300줄+) — 9개
| 파일 | 줄수 |
|------|------|
| `src/app/books/_components/ReadingStatsModal.tsx` | **1029** |
| `src/app/books/_components/BooksLibraryContent.tsx` | 615 |
| `src/app/books/_components/BookDetailModal.tsx` | 517 |
| `src/app/photobook/_components/PhotobookLibraryContent.tsx` | 513 |
| `src/app/books/highlights/_components/BookHighlightsPageContent.tsx` | 448 |
| `src/app/comics/_components/ComicsLibraryContent.tsx` | 443 |
| `src/app/books/_components/BookList.tsx` | 364 |
| `src/app/archive/[year]/[month]/_components/MonthlyTimeline.tsx` | 344 |
| `src/app/books/_components/BookForm.tsx` | 329 |

- `ReadingStatsModal.tsx`(1029줄)이 특히 심각. 내부 SVG 차트(38~63, 105~174, 246~303줄 등)들을 별도 차트 컴포넌트로 분리 권장.
- `*LibraryContent.tsx`들은 검색·CRUD·모달 상태를 한 파일에 모두 들고 있음 → 검색 섹션/리스트/모달 컨테이너로 분리 여지.

### 🔴 중복 코드 — books/comics/photobook 3중 복제
세 모듈이 거의 동일한 구조(`actions.ts`, `LibraryContent`, `Form`, `List`, `DetailModal`, `SearchSection`, `constants`, `types`)를 병렬 복제하고 있음.

구체적 중복:
- **알라딘 래퍼 함수**: `searchAladinBooks` / `getAladin*Details`가 `books/actions.ts`, `comics/actions.ts`, `photobook/actions.ts`에 거의 동일하게 복붙됨. 이미 `lib/aladin.ts`에 원본이 있으므로 각 actions의 얇은 래퍼는 공용화 가능.
- **`formatPubDate`**: 동일 함수가 3개 actions.ts 파일에 중복 정의됨 → `lib/format.ts` 또는 `lib/aladin.ts`로 추출 권장.

### 🟡 병렬 모듈의 미묘한 불일치 (버그 위험)
알라딘 검색 래퍼의 **반환 shape가 모듈마다 다름**:
- `books/actions.ts:8` → `{ items, total: totalResults }` (키 이름 `total`)
- `comics/actions.ts:7`, `photobook/actions.ts:7` → `{ items, totalResults }`

클라이언트도 각각 `result.total ??`(books) / `result.totalResults ??`(comics/photobook)로 맞춰 쓰고 있어 현재는 동작하지만, 동일 목적 코드가 키 이름만 달라 향후 복붙 시 버그 유발. 한쪽으로 통일 권장.

### 🟡 미사용 파일 (dead code)
- `src/components/features/ToastDemo.tsx` — 정의만 있고 어디서도 import되지 않음. 토스트 데모용으로 보이며 제거 후보.

### 🟡 무시되는 함수 파라미터 (기능 미동작)
`lib/aladin.ts:22` `searchAladinBooks(query, _page, _display)`에서 `_page`/`_display`를 전혀 사용하지 않음(고정 `start=1`, `MaxResults=30`). 호출부(`BooksLibraryContent.tsx:205` 등)는 `(query, 1, ALADIN_SEARCH_DISPLAY)`로 인자를 넘기지만 무시됨 → 페이지네이션/표시개수 조절이 실제로는 동작하지 않음. 의도된 동작인지 확인 필요.

---

## 3. Supabase / RLS

### 🟢 user_id 하드코딩 — 위반 없음
모든 DB 접근이 `getCurrentUser()`로 받은 `user.id`를 사용. 하드코딩된 user_id 없음. `book_highlights`의 insert/update/delete 모두 `.eq('user_id', user.id)` 적용.

### 🟢 인증 가드 일관성
`actions.ts`의 모든 mutation이 `if (!user) throw new Error('Unauthorized')` 선행. 일관적.

### 🟡 RLS 정책 — 코드로 검증 불가
레포에 SQL/마이그레이션 파일이 없음(HARNESS상 SQL은 Supabase 콘솔에서 직접 실행). 따라서 4개 정책(SELECT/INSERT/UPDATE/DELETE) 누락 여부를 코드로 확인 불가.
→ **수동 확인 필요 테이블**: `books`, `comics`, `photobook`, `book_highlights`, `book_stats_comments`, `monthly_review_comments` — 각각 RLS 활성화 + 4개 정책 + `auth.uid() = user_id` 패턴 점검.

---

## 4. AI API 호출

### 🟢 Gemini — 양호
`lib/gemini.ts`: 3개 생성 함수 모두 `withRetry`(429/503 + retry delay 파싱) + `try/catch`로 감쌈. ✓

### 🟢 API Route — 양호
`book-recommend`, `book-stats-comment`, `monthly-review-comment` 3개 라우트 모두 핸들러 본문을 try/catch로 감쌈. 키도 서버 전용(`GEMINI_API_KEY`, `NEXT_PUBLIC_` 없음). ✓

### 🟡 알라딘 fetch — lib 레벨 try/catch 누락
`lib/aladin.ts:40`, `:90`의 `fetch()` 자체는 try/catch 없이 네트워크 에러를 상위로 throw. 현재는 호출부(클라이언트 `handleSearch`의 try/catch, `book-recommend/route.ts:99` try/catch)가 모두 잡아주므로 런타임 문제는 없음. 다만 CLAUDE.md "외부 fetch try/catch" 규칙의 엄격 해석상 lib 진입점에서 직접 감싸거나, "호출부 책임" 정책을 문서화하는 편이 안전.

---

## 5. 디자인 시스템 (DESIGN.md 기준)

### 🔴 drop shadow 사용 — 1건 위반
`src/app/archive/[year]/[month]/_components/MonthlyTimeline.tsx:190`
```
<div className="... bg-surface shadow-sm">
```
DESIGN.md "elevation은 배경색으로만 — drop shadow 절대 사용 금지" 위반. `shadow-sm` 제거하고 `--surface-elevated` 등 배경 단계로 표현 권장.

### 🟢 Inter ss03 — 적용됨
`globals.css:100` body에 `font-feature-settings: "calt", "kern", "liga", "ss03"` 전역 적용. ✓

### 🟢 차트 — SVG 사용
Recharts 미설치/미사용. `ReadingStatsModal` 등 차트는 SVG + CSS 변수로 구현(DESIGN.md 권장 방식). ✓

### 🟢 테마 토글 — 전 페이지 일관
`layout.tsx:45`에서 `<Navigation />`(테마 토글 포함, light/dark/auto 3모드)을 전역 배치 → 모든 페이지에 일관 적용. `lib/theme.ts` + `localStorage('theme-mode')` 관리. ✓
- 🟡 참고: `login/page.tsx`도 layout을 거치므로 Navigation/테마 토글이 노출됨. 로그인 화면에서 의도된 노출인지 확인 권장(기능 문제는 아님).

---

## 우선순위 요약

| 우선 | 항목 |
|------|------|
| 🔴 | `MonthlyTimeline.tsx:190` drop shadow 제거 |
| 🔴 | `ReadingStatsModal.tsx`(1029줄) 차트 컴포넌트 분리 |
| 🔴 | books/comics/photobook 알라딘 래퍼·`formatPubDate` 중복 제거 |
| 🟡 | 알라딘 검색 반환 shape 통일(`total` vs `totalResults`) |
| 🟡 | `lib/aladin.ts` 페이지네이션 인자 미동작 확인 |
| 🟡 | `ToastDemo.tsx` dead code 제거 |
| 🟡 | RLS 4정책 수동 점검(6개 테이블) |
| 🟡 | 알라딘 fetch lib 레벨 try/catch 정책 정리 |

> 본 문서는 진단 전용입니다. 실제 수정은 feature_list/ 항목화 후 Cursor/Codex가 진행하세요.
