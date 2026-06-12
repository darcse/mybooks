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
interface ComicFormPayload {
  title: string;
  author: string;
  publisher: string;
  publish_date: string;
  isbn: string;
  price: string;
  link: string;
  description: string;
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

function buildComicRow(comicData: ComicFormPayload) {
  return {
    title: comicData.title.replace(/<\/?[^>]+(>|$)/g, ''),
    author: comicData.author,
    publisher: comicData.publisher,
    publish_date: formatPubDate(comicData.publish_date),
    isbn: comicData.isbn,
    price: parseInt(comicData.price) || 0,
    link: comicData.link || null,
    description: comicData.description
      ? String(comicData.description).replace(/<\/?[^>]+(>|$)/g, '').trim() || null
      : null,
    cover_image_url: comicData.cover_image_url,
    total_pages: parseInt(comicData.total_pages) || 0,
    format: comicData.format,
    purchase_date: comicData.purchase_date || null,
    category: comicData.category,
    status: comicData.status,
    current_page: parseInt(comicData.current_page) || 0,
    rank: parseInt(String(comicData.rank)) || 0,
    bookmark: comicData.bookmark,
    memo: comicData.memo,
    is_adult: !!comicData.is_adult,
  };
}

export async function saveComicToDB(comicData: ComicFormPayload) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');
  const supabase = await createClient();
  const { data, error } = await supabase.from('comics').insert([buildComicRow(comicData)]);
  if (error) throw error;
  return data;
}

export async function updateComicInDB(id: number, comicData: ComicFormPayload) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');
  const supabase = await createClient();
  const { data, error } = await supabase.from('comics').update(buildComicRow(comicData)).eq('id', id);
  if (error) throw error;
  return data;
}

export async function deleteComicFromDB(id: number) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');
  const supabase = await createClient();
  const { error } = await supabase.from('comics').delete().eq('id', id);
  if (error) throw error;
  return true;
}
