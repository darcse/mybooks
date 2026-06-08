'use server';

import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { searchAladinBooks as searchAladinBooksLib, getAladinItemByIsbn } from '@/lib/aladin';

export async function searchAladinBooks(query: string, page: number = 1, display: number = 15) {
  const { items, totalResults } = await searchAladinBooksLib(query, page, display);
  return { items, totalResults };
}

export async function getAladinPhotobookDetails(isbn: string) {
  return getAladinItemByIsbn(isbn);
}

const formatPubDate = (dateStr: string) => {
  if (dateStr && dateStr.length === 8 && !dateStr.includes('-')) {
    return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
  }
  return dateStr || null;
};

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

export async function updatePhotobookPartialInDB(
  id: number,
  fields: {
    rank?: number;
    memo?: string | null;
    status?: string;
  }
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('photobook')
    .update(fields)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}
