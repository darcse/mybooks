import { formatPubDate } from '@/lib/format';

export const ALADIN_SEARCH_DISPLAY = 30;

export type AladinSearchItem = {
  title?: string;
  author?: string;
  publisher?: string;
  pubdate?: string;
  isbn?: string;
  price?: string;
  discount?: string;
  link?: string;
  description?: string;
  image?: string;
  total_pages?: string;
  is_adult?: boolean;
};

export type AladinSearchResult = {
  items: AladinSearchItem[];
  total: number;
  error?: string;
};

type Yes24ContentDetail = {
  bookIntroduction?: string;
  bookSummary?: string;
  tableOfContents?: string;
};

type Yes24GoodsItem = {
  title?: string;
  author?: string;
  publisher?: string;
  publishDate?: string;
  isbn13?: string;
  shopPrice?: number;
  salePrice?: number;
  link?: string;
  cover?: string;
  pages?: number | null;
  adultYn?: string;
  contentDetail?: Yes24ContentDetail | null;
};

type Yes24ApiResponse = {
  success?: boolean;
  message?: string;
  errorCode?: string | null;
  data?: {
    items?: Yes24GoodsItem[];
    totalCount?: number;
    currentPage?: number;
    pageSize?: number;
  } | null;
};

function stripHtml(raw: string): string {
  return raw.replace(/<\/?[^>]+(>|$)/g, ' ').replace(/\s+/g, ' ').trim();
}

function toHttps(url: string): string {
  return url.replace(/^http:\/\//i, 'https://');
}

function mapPages(pages: number | null | undefined): string {
  if (pages == null || pages === 0) return '';
  return String(pages);
}

function mapItem(it: Yes24GoodsItem): AladinSearchItem {
  const intro =
    typeof it.contentDetail?.bookIntroduction === 'string'
      ? stripHtml(it.contentDetail.bookIntroduction)
      : '';
  const pub = formatPubDate(it.publishDate || '') || '';
  const sale = it.salePrice != null ? String(it.salePrice) : '';
  return {
    title: it.title ?? '',
    author: it.author ?? '',
    publisher: it.publisher ?? '',
    pubdate: pub,
    isbn: it.isbn13?.trim() || '',
    price: sale,
    link: it.link ? toHttps(it.link) : '',
    description: intro,
    image: it.cover ?? '',
    total_pages: mapPages(it.pages),
    is_adult: it.adultYn === 'Y',
  };
}

function errorMessageForStatus(status: number, errorCode?: string | null): string {
  if (status === 401 || errorCode === 'AUTH_001' || errorCode === 'AUTH_002') {
    return '검색 서비스 인증 오류가 발생했습니다.';
  }
  if (status === 429 || errorCode === 'RATE_001' || errorCode === 'RATE_002') {
    return '검색 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.';
  }
  return '검색 중 오류가 발생했습니다.';
}

async function yes24Fetch(pathname: string, params: Record<string, string>): Promise<{
  status: number;
  body: Yes24ApiResponse | null;
  parseError: boolean;
}> {
  const key = process.env.YES24_API_KEY;
  if (!key) {
    return { status: 0, body: null, parseError: false };
  }
  const url = new URL(pathname, 'https://apis.yes24.com');
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  let res: Response;
  try {
    res = await fetch(url.toString(), {
      headers: { 'X-Api-Key': key },
    });
  } catch {
    return { status: 0, body: null, parseError: false };
  }
  let body: Yes24ApiResponse | null = null;
  let parseError = false;
  try {
    body = (await res.json()) as Yes24ApiResponse;
  } catch {
    parseError = true;
  }
  return { status: res.status, body, parseError };
}

export type SearchAladinOptions = {
  category?: 'ALL' | 'BOOK' | 'FOREIGN' | 'EBOOK' | 'MUSIC' | 'DVD';
};

export async function searchAladinBooks(
  query: string,
  page: number = 1,
  display: number = 15,
  options?: SearchAladinOptions,
): Promise<AladinSearchResult> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { items: [], total: 0 };
  }
  if (!process.env.YES24_API_KEY) {
    return { items: [], total: 0, error: '검색 서비스 인증 오류가 발생했습니다.' };
  }

  const safePage = Math.max(1, page);
  const safeDisplay = Math.max(1, Math.min(display, 100));
  const category = options?.category ?? 'ALL';

  const { status, body, parseError } = await yes24Fetch('/v1/goods/itemList', {
    query: trimmed,
    page: String(safePage),
    pageSize: String(safeDisplay),
    detail: 'Y',
    category,
  });

  if (status === 404 && body?.errorCode === 'SEARCH_001') {
    return { items: [], total: 0 };
  }

  if (status === 0 || parseError || !body) {
    return { items: [], total: 0, error: '검색 중 오류가 발생했습니다.' };
  }

  if (!body.success || status >= 400) {
    return {
      items: [],
      total: 0,
      error: errorMessageForStatus(status, body.errorCode),
    };
  }

  const rawItems = body.data?.items ?? [];
  const items = rawItems.map(mapItem);
  const total =
    typeof body.data?.totalCount === 'number' ? body.data.totalCount : items.length;
  return { items, total };
}

export async function getAladinItemByIsbn(
  isbn: string,
): Promise<{ total_pages?: string; description?: string } | null> {
  const trimmed = isbn?.trim();
  if (!trimmed) return null;
  if (!process.env.YES24_API_KEY) return null;

  const { status, body, parseError } = await yes24Fetch('/v1/goods/itemDetail', {
    searchType: 'ISBN13',
    query: trimmed,
    detail: 'Y',
  });

  if (status === 404 || !body?.success || parseError || status >= 400) {
    return null;
  }

  const item = body.data?.items?.[0];
  if (!item) return null;

  const total_pages = mapPages(item.pages) || undefined;
  const description =
    typeof item.contentDetail?.bookIntroduction === 'string'
      ? stripHtml(item.contentDetail.bookIntroduction) || undefined
      : undefined;

  if (total_pages == null && description == null) return null;
  return { total_pages, description };
}

export function yes24SearchFallbackUrl(title: string): string {
  return `https://www.yes24.com/Product/Search?query=${encodeURIComponent(title.trim())}`;
}
