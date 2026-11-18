# YES24 Open API 조사 — 알라딘 대체 가능성

조사일: 2026-11-18  
범위: 읽기 전용 코드 조사 + YES24 API 실제 호출(총 38회)  
키: `.env.local`의 `YES24_API_KEY`만 사용. 본 문서·로그에 키 값 미포함.  
참고 문서: [api-reference](https://github.com/yes24-AX/yes24-openapi-samples/blob/main/docs/api-reference.md), [error-codes](https://github.com/yes24-AX/yes24-openapi-samples/blob/main/docs/error-codes.md), OpenAPI JSON

---

## 1. AladinSearchItem ↔ YES24 필드 대응표

앱 타입 `AladinSearchItem` / `AladinSearchBookItem` 기준(코드상 11필드. `discount`는 타입에만 있고 `aladin.ts` 매핑에서는 현재 미설정).

| AladinSearchItem | YES24 대응 | 출처 | 비고 |
|---|---|---|---|
| `title` | `title` | 검색·상세 | 그대로 사용 가능 |
| `author` | `author` | 검색·상세 | 역할 접미사 포함 예: `유발 하라리 저/조현욱 역` |
| `publisher` | `publisher` | 검색·상세 | OK |
| `pubdate` | `publishDate` | 검색·상세 | 형식 `yyyyMMdd`(예: `20151123`). 알라딘은 `pubDate` 문자열. 변환 필요 |
| `isbn` | `isbn13` (보조 `isbn10`) | 검색·상세 | 일부 음반·eBook·특전은 `isbn13` 빈 문자열 |
| `price` | `salePrice` (판매가) | 검색·상세 | 알라딘은 문자열, YES24는 number |
| `discount` | **없음** | — | 별도 할인율 필드 없음. `shopPrice`(정가)·`salePrice`(판매가)로 유도 가능. 현 코드도 discount 미사용 |
| `link` | `link` | 검색·상세 | YES24 상품 URL. `mobileLink`는 `detail=Y`만 |
| `description` | `contentDetail.bookIntroduction` (보조 `bookSummary`) | 검색(`detail=Y`)·상세 | HTML/마크업 포함 가능. 알라딘처럼 선택 시 strip HTML 필요. `detail=N`에도 contentDetail이 오는 경우가 있음 |
| `image` | `cover` | 검색·상세 | URL. `backCover`/`sideCover`도 있음 |
| `total_pages` | `pages` | **`detail=Y`만** | `detail=N` 검색/상세에는 `pages` 키 자체가 없음 → **null**. 독서 진행도에 필수 |

추가 YES24 필드(앱 매핑 후보):

| YES24 | 용도 |
|---|---|
| `adultYn` (`Y`/`N`) | 성인 구분 → DB `is_adult` 자동 채움 가능 (현재 알라딘 선택 시 `is_adult: false` 하드코딩) |
| `goodsType` | `도서`/`만화`/`잡지`/`CD`/`eBook` 등 |
| `goodsSortNm` | 분류 경로 예: `국내도서-인문`, `국내도서-만화/라이트노벨` |
| `itemId` | YES24 상품번호. ISBN 없을 때 상세 조회 키 |
| `shopPrice` | 정가 |

---

## 2. 총 페이지 수·소개글 출처

| 데이터 | 검색 `detail=N` | 검색 `detail=Y` | 상세 `itemDetail detail=N` | 상세 `itemDetail detail=Y` | `/v1/goods/content` |
|---|---|---|---|---|---|
| `pages` (총 페이지) | 없음 | **있음** (예: 사피엔스 636) | 없음 | **있음** | 없음(목차만) |
| 소개글 | `contentDetail` 올 수 있음 | `bookIntroduction`/`bookSummary` | 동일 | 동일 | `contents`는 **목차** |

### 상세 호출

- `GET /v1/goods/itemDetail?searchType=ISBN13&query={isbn13}&detail=Y`
- 또는 `searchType=ItemId&query={itemId}`
- 실제 응답 `data` 형태는 문서의 DataWithMeta가 아니라 **PagedResult**: `{ meta, items[], currentPage, pageSize, totalCount }` (단건도 `items[0]`)

### 권장 확보 전략 (앱 관점)

1. 검색을 `detail=Y`로 치면 목록에서 `pages`·소개까지 한 번에 받을 수 있음 → 알라딘의 “검색 + ISBN LookUp” 2단을 1단으로 줄일 여지.
2. 목록이 무거우면 검색은 `detail=N`, 선택 시 `itemDetail?detail=Y`(또는 ISBN)로 `pages` 보강 — 현 알라딘 패턴과 동일.
3. 포토북/성인 eBook 일부는 `pages: 0` 또는 누락 → 수동 입력 폴백 유지 필요.

---

## 3. 페이지네이션

| 항목 | 문서 | 실측 |
|---|---|---|
| 파라미터 | `page`, `pageSize` | 동일 |
| `pageSize` 상한 | 카테고리 API는 1~100 명시. 검색 API 문서에는 상한 문구 약함 | `pageSize=100` 성공(100건), `pageSize=101` → **400 / PARAM_006** (“1에서 100”) |
| 전체 건수 | `totalCount` | 제공됨 (예: `만화` 검색 144877) |
| 페이지 이동 | `currentPage` | page=1 vs page=2 첫 항목 상이 확인 |

알라딘은 `start`+`MaxResults`(앱은 30건/`ALADIN_SEARCH_DISPLAY`). YES24는 `page`/`pageSize`로 바꾸면 됨. 앱 기본 30건은 `pageSize=30`으로 수용 가능.

---

## 4. 호출 한도·오류 응답

### 한도

| 출처 | 초당 | 일일 |
|---|---|---|
| 공식 문서/error-codes | 5회 / `RATE_001` | 5,000회 / `RATE_002` |
| **실측 응답 헤더** | `X-RateLimit-Limit-Second: 10` | `X-RateLimit-Limit-Day: 20000` |

헤더 예: `X-RateLimit-Remaining-Day`, `X-RateLimit-Reset-Day`, `X-RateLimit-Remaining-Second`, `X-RateLimit-Reset-Second`.  
문서와 헤더 수치가 다름 → **구현 시 헤더를 우선**하고, 문서 한도는 하한 가드로 두는 편이 안전.

### 실측 오류

| 상황 | HTTP | errorCode | message (요약) |
|---|---|---|---|
| `X-Api-Key` 없음 | 401 | `AUTH_001` | API Key 값이 없습니다 |
| 잘못된 키 | 401 | `AUTH_002` | 유효하지 않은 API Key입니다 |
| `query` 빈값 | 400 | `PARAM_003` | query 파라미터를 입력하세요 |
| `pageSize=101` | 400 | `PARAM_006` | pageSize는 1~100 |
| 결과 없음 | 404 | `SEARCH_001` | 검색 결과가 없습니다 |
| (문서) 한도 초과 | 429 | `RATE_001`/`RATE_002` | Retry-After | ※이번 조사에서 429는 미발생 |

공통 실패 바디: `{ success: false, message, data: null, errorCode }`

---

## 5. 검색 품질 실측 요약

호출: `GET /v1/goods/itemList`, 기본 `detail=Y`, `pageSize=10` (포토북 추가분은 `category=BOOK`).

### 5.1 도서 (인문·번역·외서)

| 검색어 | totalCount | 1페이지 적합성 | 표지 | ISBN13 | pages | 출간일 | 비고 |
|---|---|---|---|---|---|---|---|
| 사피엔스 (`category=BOOK`) | 739 | 1위 「사피엔스」 정확. 2위부터 수험서·그래픽 등 혼입 | 10/10 | 10/10 | 10/10 | 10/10 | `goodsSortNm=국내도서-인문`, pages=636 |
| 클린 코드 (필드 프로브) | — | 관련 도서 상단 | 있음 | 있음 | detail=Y만 | 있음 | |
| 데미안 / 총 균 쇠 | (호출함) | 관련 작품 포함 | 양호 | 양호 | detail=Y | 양호 | |
| Clean Code (`FOREIGN`) | 55 | 영/일 원서·관련서 혼재 | — | 1위 ISBN 있음 | 527 | 있음 | 외서 카테고리 필터 유효 |

소개 샘플(200자 이내, 사피엔스 `bookIntroduction`):  
「출간 10주년·200쇄·115만부 기념 유발 하라리 특별 서문 수록 “인공지능의 시대, 우리가 알아야 할 것은 코딩보다 인간의 마음.” 인간의 역사와 미래에 대한 가장 논쟁적이고 대담한 대서사…」

### 5.2 만화 (시리즈 권 단위)

| 검색어 | totalCount | 적합성 | 표지 | ISBN 누락 | pages | adultYn | 비고 |
|---|---|---|---|---|---|---|---|
| 원피스 1 | 360 | 최신권(115)이 인기순 상단, 1권은 4번째 | 0 누락 | 3/10 | 0 누락(detail=Y) | N | `sort=RELATION` 검토 가치 |
| 슬램덩크 완전판 | 88 | 완전판 박스 위주 | OK | 1/10 | OK | N | 권 단위 식별 가능 |
| 진격의 거인 1 | 90 | 스핀오프가 1위, 본편 1권은 3위 | OK | 6/10 | OK | N | 정확도 정렬 필요 |
| 베르세르크 | 383 | 권 단위 양호 | OK | 0 | OK | **10/10 Y** | 성인 만화 `adultYn=Y` 명확 |

`goodsType=만화`, `goodsSortNm=국내도서-만화/라이트노벨`로 필터 가능.

### 5.3 포토북·화보

| 검색어 | 조건 | 결과 요약 |
|---|---|---|
| 시노자키 아이 (ALL) | detail=Y | CD·음반이 상단. 화보 찾기 어려움 |
| 시노자키 아이 사진집 | `category=BOOK` | **1건** 「시노자키 아이 화보집 [몽환]」, 잡지, pages=240, ISBN 있음 |
| 요시자와 아키호 화보 / 미즈노 아사미 | ALL | 성인 eBook 위주, ISBN 전무·pages 0, `adultYn=Y` |
| 프로듀스 포토북 | ALL | OST/음반 오탐 |
| 사진집 / 화보집 | `category=BOOK` | 사진집·화보 다수. 표지·pages 대체로 있음. 성인 비율 높음(화보집 7/10 adult) |

**걸림돌:** 일본 모델 화보는 검색어·카테고리 없이는 음반/성인 eBook에 묻힘. `category=BOOK` + “사진집/화보집” 키워드 또는 `goodsType`/`goodsSortNm` 후필터가 필요.

---

## 6. 성인 구분·카테고리 필드

| 필드 | 형태 | 실측 |
|---|---|---|
| `adultYn` | `"Y"` / `"N"` | 베르세르크·일부 사진집·성인 eBook에서 `Y` |
| `goodsType` | 문자열 | 도서, 만화, 잡지, CD, eBook … |
| `goodsSortNm` | `대분류-중분류…` | 예: `국내도서-인문`, `국내도서-만화/라이트노벨`, `eBook-잡지-성인` |
| 검색 `category` 파라미터 | `ALL`/`BOOK`/`FOREIGN`/`EBOOK`/`MUSIC`/`DVD` | FOREIGN·BOOK 필터 동작 확인 |

앱 DB의 `category`(IT, 인문 등 자체 enum)와 YES24 `goodsSortNm`은 **1:1이 아님**. 자동 매핑 규칙을 새로 정하거나, 지금처럼 폼 기본값을 쓰고 사용자 수정에 맡기는 편이 안전.  
`is_adult`는 `adultYn === 'Y'`로 바로 채울 수 있음(현재 알라딘 경로에서는 항상 false).

---

## 7. 알라딘 의존 전수조사 (코드 읽기 전용)

### 7.1 사용처 표

| 파일 | 함수/지점 | 사용 알라딘 필드 | DB/타입 의존 |
|---|---|---|---|
| `src/lib/aladin.ts` | `searchAladinBooks`, `getAladinItemByIsbn` | 검색: title, author, publisher, pubDate→pubdate, isbn13, priceSales/Standard→price, link, description, cover→image, subInfo.itemPage→total_pages / LookUp: itemPage, description | 타입명 `AladinSearchItem`. env `ALADIN_TTB_KEY` |
| `src/app/books/actions.ts` | re-export + `saveBookToDB`/`updateBookInDB` | 폼의 isbn, description, cover_image_url, total_pages 등 → `books` 컬럼 | DB 컬럼명은 알라딘 비의존. 함수명만 Aladin |
| `src/app/comics/actions.ts` | 동일 패턴 | → `comics` | 동일 |
| `src/app/photobook/actions.ts` | 동일 패턴 | → `photobooks`(description 없음) | 동일 |
| `BooksLibraryContent.tsx` | `handleSearch` / `handleSelectBook` | items 전체 + LookUp으로 total_pages·description 보강. 선택 시 `is_adult: false` 고정 | 상태 타입 `AladinSearchBookItem` |
| `ComicsLibraryContent.tsx` | 동일 | 동일 | 동일 |
| `PhotobookLibraryContent.tsx` | 동일 | description 없이 total_pages만 LookUp | 동일 |
| `src/components/AladinSearchSection.tsx` | UI | title, author, publisher, pubdate, image 표시 | 컴포넌트·심볼명 Aladin |
| `src/app/api/book-recommend/route.ts` | `POST` | 외부 추천 도서 `detail_url`: `searchAladinBooks` 첫 `link`. 실패 시 **알라딘 웹 검색 URL** 폴백 (`aladinSearchFallbackUrl`) | 추천 자체는 Gemini. 링크만 알라딘 |

### 7.2 DB·타입에 “알라딘”이 박혀 있는지

- **DB 컬럼**: `title`, `author`, `publisher`, `publish_date`, `isbn`, `price`, `link`, `description`, `cover_image_url`, `total_pages`, `is_adult` 등 — 공급자 중립.
- **타입/심볼**: `AladinSearchItem`, `AladinSearchBookItem`, `ALADIN_SEARCH_DISPLAY`, `searchAladinBooks`, `getAladinItemByIsbn`, `AladinSearchSection` — **이름만** 알라딘. 스키마 변경 없이 어댑터 교체로 가능.
- **동작 공백**: 선택 시 `is_adult`를 알라딘에서 안 가져옴(항상 false). YES24 `adultYn`이 오히려 이득.

### 7.3 book-recommend 검색 실패 시

1. Gemini 추천은 그대로 생성.
2. 외부 책 `detail_url`은 알라딘 검색 API 성공 시 상품 `link`, 실패(catch) 시 `https://www.aladin.co.kr/search/...` 웹 폴백.
3. 알라딘 API가 완전 종료된 현재는 **항상 웹 폴백 URL**로 떨어질 가능성 큼(빈 결과면 link 없음 → 폴백). YES24 교체 시 폴백 URL도 yes24.com 검색으로 바꿔야 함.

---

## 8. 교체 시 걸림돌

1. **`pages`는 `detail=Y` 전용** — `detail=N`만 쓰면 독서 진행도용 총 페이지가 비게 됨.
2. **출간일 포맷** `yyyyMMdd` → 앱/폼이 기대하는 형식(`YYYY-MM-DD` 등) 변환.
3. **저자 문자열**에 `저/역/감수` 접미 — 기존 `formatAuthorName`과 호환 확인.
4. **포토북 검색 품질** — 모델명만으로는 음반·성인 eBook 오염. BOOK 카테고리·키워드·goodsType 필터 필요.
5. **만화 인기순** — “원피스 1” 검색 시 최신권이 상단. `sort=RELATION` 실험·권수 파싱 UX 검토.
6. **ISBN 공란** 상품(특전·일부 잡지·eBook) — `itemId` 상세 경로 필요.
7. **심볼/UI 명칭** Aladin* 전면 rename은 동작과 무관하지만 교체 PR 범위에 포함할지 결정.
8. **한도 문서 vs 헤더 불일치** — 클라이언트는 헤더·429 처리 필수.
9. **discount 필드** — YES24에 없음(현 코드도 미사용) → 대응 불가로 두고 `salePrice`만 매핑하면 됨.

---

## 9. 권장 방향 (기본안)

**YES24로 교체 가능. 차단 이슈는 없음.** 총 페이지·표지·ISBN·소개·성인플래그가 실측으로 확보됨.

구현 기본안:

1. `src/lib/yes24.ts`(가칭)에 `searchBooks` / `getItemByIsbn`을 두고, 기존 `AladinSearchItem` shape으로 **어댑터 매핑**해 books/comics/photobook UI 변경을 최소화.
2. 검색 기본 `detail=Y`, `pageSize=30`(현 `ALADIN_SEARCH_DISPLAY`). 필요 시 선택 후 `itemDetail detail=Y`로 재확인.
3. `pubdate` ← `publishDate` 포맷 변환, `price` ← `String(salePrice)`, `image` ← `cover`, `total_pages` ← `pages`, `description` ← `contentDetail.bookIntroduction`(+ HTML strip), `is_adult` ← `adultYn === 'Y'`.
4. `discount`는 매핑 생략(없음).
5. `book-recommend`의 알라딘 link/웹 폴백을 YES24 `link` / yes24 검색 URL로 교체.
6. 포토북 검색 UX: 기본 `category=BOOK` 또는 결과에서 `goodsType`∈{도서,잡지}·`goodsSortNm` 필터.
7. env: `YES24_API_KEY` 사용, `ALADIN_TTB_KEY` 제거는 후속. 429 시 Retry-After 존중.

대안: 검색만 YES24, 페이지 수는 사용자 수기 — 비권장(현 앱이 LookUp으로 자동 채움에 의존).

---

## 부록: 조사 호출 수

| 단계 | 횟수 |
|---|---|
| 1차 프로브(필드·페이지·오류·도서4·만화4·포토4·성인) | 31 |
| 2차(itemDetail·content·포토북 BOOK·외서) | 7 |
| **합계** | **38** (한도 40 이내) |
