# PRODUCT_BRIEF.md — mybooks

## 1. 앱 목적 및 개요

mybooks는 개인이 보유하거나 감상한 도서·코믹스·포토북을 한 곳에서 등록·검색·분류·회고하는 개인 라이브러리 앱이다.
알라딘 TTB 기반 메타데이터 자동 완성, Gemini 기반 도서 추천 및 독서 통계 분석, 하이라이트 관리, 월별 Archive를 제공해 컬렉션의 소장 정보와 감상 맥락을 함께 축적한다.

배포 URL: https://books.sshlove.com

---

## 2. 기술 스택

- Framework: Next.js 15 App Router, React 19, TypeScript 5
- 스타일링: Tailwind CSS v4, CSS 변수 기반 **다크 전용** (라이트/자동 테마 없음), Raycast 디자인 시스템
- Font: Inter (font-feature-settings: "calt", "kern", "liga", "ss03" 전역 적용)
- DB/Auth/Storage: Supabase PostgreSQL, Supabase Auth, @supabase/ssr
- 배포: Vercel
- AI: Gemini API (`gemini-3.1-flash-lite-preview`)
- 외부 API: 알라딘 TTB
- 주요 라이브러리: lucide-react, sonner, react-markdown, recharts

---

## 3. 도메인 범위

| 도메인 | 테이블 | 설명 |
|--------|--------|------|
| Books | `books`, `book_highlights`, `book_stats_comments` | 도서 컬렉션 및 하이라이트 |
| Comics | `comics` | 만화 컬렉션 |
| Photobook | `photobook` | 포토북 컬렉션 (로그인 전용) |
| Archive | `monthly_review_comments` | 도서/코믹스/포토북 기준 월별 회고 |

---

## 4. 주요 기능

### 공통/UX
- 네비게이션: Books, Comics, Photobook, Archive, 로그인/로그아웃
- **다크 전용** — 테마 토글 없음, 라이트/자동 모드 미지원
- 모바일 햄버거 메뉴
- Sonner 기반 toast
- 홈 대시보드: 도서 통계, 최근 완독, 코믹스 섹션, 포토북 Timeless 섹션

### 인증
- 이메일/비밀번호 로그인 (Supabase Auth)
- SSR 쿠키 세션 유지
- 비로그인: Books/Comics 읽기 허용, 쓰기 차단
- 로그인 전용: Photobook, Archive, Book Highlights

### Books
- 알라딘 TTB 검색 및 ISBN 상세 조회로 폼 자동 완성
- 도서 등록/수정/삭제
- 카테고리·보유상태·형태·독서상태 필터, 검색/정렬/페이지네이션
- 상세 모달: 표지, 출판 정보, 진행도, 별점, 메모, 도서 정보/하이라이트 탭
- 독서 통계 모달: 연도별 완독, 카테고리 분포
- Gemini 기반 연도별 독서 통계 코멘트 캐싱
- Gemini 기반 도서 추천 (완독 이력 기반)
- 하이라이트 CRUD, 태그 저장·수정·삭제
- `/books/highlights` 전체 하이라이트 모아보기

### Comics
- 알라딘 TTB 검색으로 폼 자동 완성
- 코믹스 등록/수정/삭제
- 카테고리·상태 필터, 페이지네이션

### Photobook
- 알라딘 TTB 검색으로 폼 자동 완성 (로그인 전용)
- 포토북 등록/수정/삭제
- 동일 저자/모델 그룹 표시

### Archive
- 연도별 월 카드 그리드 (로그인 전용)
- 완독 도서·코믹스·포토북 기준 월별 집계
- Gemini 월간 종합 코멘트 캐싱
- 월별 상세 타임라인

---

## 5. 인증 구조

- Supabase Auth 이메일/비밀번호
- 서버: `src/lib/supabase/server.ts` createClient() / getCurrentUser()
- 브라우저: `src/lib/supabase/client.ts` createClient()
- `src/proxy.ts`: 쿠키 기반 세션 갱신
- 등록/수정/삭제 Server Action: getCurrentUser() 없으면 Unauthorized

---

## 7. 디자인 시스템

Raycast 마케팅 사이트 디자인 언어 기반. 상세 토큰과 적용 규칙은 CONVENTIONS.md 참조.

- 다크 전용 — `#07080a` canvas 기반 단일 다크 모드
- elevation: 서피스 래더(`canvas → surface → surface-elevated → surface-card`)로만 표현, drop shadow 금지
- Inter + ss03 전역 적용
- primary CTA: 흰색 pill 단일
- accent 색상(blue/green/red/yellow): 일러스트 전용, chrome 사용 금지

- mylibrary, myaudio와 동일한 Supabase 인스턴스를 사용한다
- 이 앱에서 접근하는 테이블만 CONVENTIONS.md에 명시되어 있다
- 다른 앱의 테이블(album, headfi, lyrics 등)은 이 앱에서 접근하지 않는다
