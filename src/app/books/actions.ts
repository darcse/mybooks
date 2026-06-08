'use server';

import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { searchAladinBooks as searchAladinBooksLib, getAladinItemByIsbn } from '@/lib/aladin';
import type { BookHighlight } from './types';

export async function searchAladinBooks(query: string, page: number = 1, display: number = 15) {
  const { items, totalResults } = await searchAladinBooksLib(query, page, display);
  return { items, total: totalResults };
}

export async function getAladinBookDetails(isbn: string) {
  return getAladinItemByIsbn(isbn);
}

const formatPubDate = (dateStr: string) => {
  if (dateStr && dateStr.length === 8 && !dateStr.includes('-')) {
    return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
  }
  return dateStr || null;
};

interface BookFormPayload {
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
  ownership_status: string;
  status: string;
  current_page: string;
  rank: number;
  bookmark: string;
  memo: string;
  finished_at: string;
  is_adult: boolean;
}

function buildBookRow(bookData: BookFormPayload) {
  return {
    title: bookData.title.replace(/<\/?[^>]+(>|$)/g, ''),
    author: bookData.author,
    publisher: bookData.publisher,
    publish_date: formatPubDate(bookData.publish_date),
    isbn: bookData.isbn,
    price: parseInt(bookData.price) || 0,
    link: bookData.link || null,
    description: bookData.description
      ? String(bookData.description).replace(/<\/?[^>]+(>|$)/g, '').trim() || null
      : null,
    cover_image_url: bookData.cover_image_url,
    total_pages: parseInt(bookData.total_pages) || 0,
    format: bookData.format,
    purchase_date: bookData.purchase_date || null,
    category: bookData.category,
    ownership_status:
      bookData.ownership_status ||
      (bookData.format === '방출' || bookData.status === '방출' ? '방출' : '보유중'),
    status: bookData.status,
    current_page: parseInt(bookData.current_page) || 0,
    rank: parseInt(String(bookData.rank)) || 0,
    bookmark: bookData.bookmark,
    memo: bookData.memo,
    is_adult: !!bookData.is_adult,
    finished_at: bookData.finished_at || null,
  };
}

export async function saveBookToDB(bookData: BookFormPayload) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');
  const supabase = await createClient();
  const { data, error } = await supabase.from('books').insert([buildBookRow(bookData)]);
  if (error) throw error;
  return data;
}

export async function updateBookInDB(id: number, bookData: BookFormPayload) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');
  const supabase = await createClient();
  const { data, error } = await supabase.from('books').update(buildBookRow(bookData)).eq('id', id);
  if (error) throw error;
  return data;
}

export async function deleteBookFromDB(id: number) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');
  const supabase = await createClient();
  const { error } = await supabase.from('books').delete().eq('id', id);
  if (error) throw error;
  return true;
}

export async function updateBookPartialInDB(
  id: number,
  fields: {
    current_page?: number;
    rank?: number;
    memo?: string | null;
  }
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('books')
    .update(fields)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function getBookHighlights(bookId: number) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('book_highlights')
    .select('*')
    .eq('book_id', bookId)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as BookHighlight[]) || [];
}

export async function createBookHighlight(bookId: number, content: string, tags: string[]) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('book_highlights')
    .insert({
      book_id: bookId,
      user_id: user.id,
      content,
      tags,
      source_app: 'mybooks',
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as BookHighlight;
}

export async function updateBookHighlight(
  highlightId: number,
  bookId: number,
  content: string,
  tags: string[]
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('book_highlights')
    .update({
      content,
      tags,
      updated_at: new Date().toISOString(),
      source_app: 'mybooks',
    })
    .eq('id', highlightId)
    .eq('book_id', bookId)
    .eq('user_id', user.id)
    .select('*')
    .single();
  if (error) throw error;
  return data as BookHighlight;
}

export async function deleteBookHighlight(highlightId: number, bookId: number) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');
  const supabase = await createClient();
  const { error } = await supabase
    .from('book_highlights')
    .delete()
    .eq('id', highlightId)
    .eq('book_id', bookId)
    .eq('user_id', user.id);
  if (error) throw error;
  return true;
}
