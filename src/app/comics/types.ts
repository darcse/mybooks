export interface Comic {
  id: number;
  title: string;
  author: string | null;
  publisher: string | null;
  publish_date: string | null;
  isbn: string | null;
  price: number;
  link: string | null;
  description: string | null;
  cover_image_url: string | null;
  total_pages: number;
  format: string;
  purchase_date: string | null;
  category: string;
  status: string;
  current_page: number;
  rank: number;
  bookmark: string | null;
  memo: string | null;
  is_adult?: boolean;
  created_at?: string;
}

export interface AladinSearchBookItem {
  title?: string;
  author?: string;
  publisher?: string;
  pubdate?: string;
  isbn?: string;
  price?: string;
  discount?: string;
  image?: string;
  link?: string;
  description?: string;
  total_pages?: string;
  [key: string]: unknown;
}

export type SelectedComic = Comic | AladinSearchBookItem | { isManual: true };
