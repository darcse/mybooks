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
};

export type AladinSearchResult = {
  items: AladinSearchItem[];
  total: number;
};

export async function searchAladinBooks(
  query: string,
  page: number = 1,
  display: number = 15
): Promise<AladinSearchResult> {
  const key = process.env.ALADIN_TTB_KEY;
  if (!key) throw new Error('ALADIN_TTB_KEY가 설정되지 않았습니다.');

  const safePage = Math.max(1, page);
  const safeDisplay = Math.max(1, Math.min(display, 50));
  const start = (safePage - 1) * safeDisplay + 1;

  const url = new URL('http://www.aladin.co.kr/ttb/api/ItemSearch.aspx');
  url.searchParams.set('ttbkey', key);
  url.searchParams.set('Query', query);
  url.searchParams.set('QueryType', 'Title');
  url.searchParams.set('MaxResults', String(safeDisplay));
  url.searchParams.set('start', String(start));
  url.searchParams.set('SearchTarget', 'All');
  url.searchParams.set('output', 'js');
  url.searchParams.set('Version', '20131101');

  let res: Response;
  try {
    res = await fetch(url.toString());
  } catch {
    throw new Error('알라딘 API 호출에 실패했습니다.');
  }
  if (!res.ok) {
    throw new Error('알라딘 API 호출에 실패했습니다.');
  }
  let data: {
    item?: Array<{
      title?: string;
      link?: string;
      author?: string;
      pubDate?: string;
      isbn13?: string;
      isbn?: string;
      publisher?: string;
      priceStandard?: number;
      priceSales?: number;
      cover?: string;
      description?: string;
      subInfo?: { itemPage?: number };
    }>;
    totalResults?: number;
  };
  try {
    data = await res.json();
  } catch {
    throw new Error('알라딘 API 응답을 해석하지 못했습니다.');
  }

  const rawItems = data?.item ?? [];
  const items: AladinSearchItem[] = rawItems.map((it) => ({
    title: it.title ?? '',
    author: it.author ?? '',
    publisher: it.publisher ?? '',
    pubdate: it.pubDate ?? '',
    isbn: it.isbn13 ?? it.isbn ?? '',
    price: it.priceSales != null ? String(it.priceSales) : (it.priceStandard != null ? String(it.priceStandard) : ''),
    link: it.link ?? '',
    description: it.description ?? '',
    image: it.cover ?? '',
    total_pages: it.subInfo?.itemPage != null ? String(it.subInfo.itemPage) : '',
  }));

  const total = typeof data.totalResults === 'number' ? data.totalResults : items.length;
  return { items, total };
}

export async function getAladinItemByIsbn(isbn: string): Promise<{ total_pages?: string; description?: string } | null> {
  if (!isbn?.trim()) return null;
  const key = process.env.ALADIN_TTB_KEY;
  if (!key) return null;

  const url = new URL('http://www.aladin.co.kr/ttb/api/ItemLookUp.aspx');
  url.searchParams.set('ttbkey', key);
  url.searchParams.set('itemIdType', 'ISBN13');
  url.searchParams.set('ItemId', isbn.trim());
  url.searchParams.set('output', 'js');
  url.searchParams.set('Version', '20131101');

  let res: Response;
  try {
    res = await fetch(url.toString());
  } catch {
    throw new Error('알라딘 API 호출에 실패했습니다.');
  }
  if (!res.ok) {
    throw new Error('알라딘 API 호출에 실패했습니다.');
  }
  let text: string;
  try {
    text = await res.text();
  } catch {
    throw new Error('알라딘 API 응답을 해석하지 못했습니다.');
  }
  const jsonStr = text.replace(/;\s*$/, '');
  let data: { item?: Array<{ subInfo?: { itemPage?: number }; description?: string }> };
  try {
    data = JSON.parse(jsonStr);
  } catch {
    throw new Error('알라딘 API 응답을 해석하지 못했습니다.');
  }
  const item = data?.item?.[0];
  if (!item) return null;

  const total_pages = item.subInfo?.itemPage != null ? String(item.subInfo.itemPage) : undefined;
  const description = typeof item.description === 'string' ? item.description : undefined;
  return { total_pages, description };
}
