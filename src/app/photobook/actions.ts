'use server';

import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { formatPubDate } from '@/lib/format';
import {
  searchAladinBooks as searchAladinBooksLib,
  getAladinItemByIsbn as getAladinItemByIsbnLib,
} from '@/lib/aladin';

export async function searchAladinBooks(query: string, page: number = 1, display: number = 15) {
  return searchAladinBooksLib(query, page, display);
}

export async function getAladinItemByIsbn(isbn: string) {
  return getAladinItemByIsbnLib(isbn);
}
interface PhotobookFormPayload {
  title: string;
  author: string;
  publisher: string;
  publish_date: string;
  isbn: string;
  price: string;
  cover_image_url: string;
  total_pages: string;
  format: string;
  purchase_date: string;
  category: string;
  status: string;
  current_page: string;
  rank: number;
  bookmark: string;
  memo: string;
  is_adult: boolean;
}

function buildPhotobookRow(bookData: PhotobookFormPayload) {
  return {
    title: bookData.title.replace(/<\/?[^>]+(>|$)/g, ''),
    author: bookData.author,
    publisher: bookData.publisher,
    publish_date: formatPubDate(bookData.publish_date),
    isbn: bookData.isbn,
    price: parseInt(bookData.price) || 0,
    cover_image_url: bookData.cover_image_url,
    total_pages: parseInt(bookData.total_pages) || 0,
    format: bookData.format,
    purchase_date: bookData.purchase_date || null,
    category: bookData.category,
    status: bookData.status,
    current_page: parseInt(bookData.current_page) || 0,
    rank: parseInt(String(bookData.rank)) || 0,
    bookmark: bookData.bookmark,
    memo: bookData.memo,
    is_adult: !!bookData.is_adult,
  };
}

export async function savePhotobookToDB(bookData: PhotobookFormPayload) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');
  const supabase = await createClient();
  const { data, error } = await supabase.from('photobook').insert([buildPhotobookRow(bookData)]);
  if (error) throw error;
  return data;
}

export async function updatePhotobookInDB(id: number, bookData: PhotobookFormPayload) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('photobook')
    .update(buildPhotobookRow(bookData))
    .eq('id', id);
  if (error) throw error;
  return data;
}

export async function deletePhotobookFromDB(id: number) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');
  const supabase = await createClient();
  const { error } = await supabase.from('photobook').delete().eq('id', id);
  if (error) throw error;
  return true;
}
