'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BarChart2, BookOpen, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { ALADIN_SEARCH_DISPLAY } from '@/lib/aladin';
import { createClient } from '@/lib/supabase/client';
import { useAuthState } from '@/hooks/useAuthState';
import {
  deleteBookFromDB,
  getAladinItemByIsbn,
  saveBookToDB,
  searchAladinBooks,
  updateBookInDB,
} from '../actions';
import { categoryOptions } from '../constants';
import type { AladinSearchBookItem, Book, SelectedBook } from '../types';
import { getOwnershipStatus } from '../utils';
import { BookDetailModal } from './BookDetailModal';
import { BookForm } from './BookForm';
import { BookList } from './BookList';
import { BookRecommendModal, type BookRecommendPayload } from './BookRecommendModal';
import { BookSearchSection } from './BookSearchSection';
import { ReadingStatsModal } from './ReadingStatsModal';

type SortOrder = 'created_desc' | 'purchase_desc' | 'purchase_asc' | 'publish_desc' | 'publish_asc';

const inputBaseClass =
  'h-[42px] rounded-md border border-hairline bg-surface-elevated px-3 text-sm text-ink outline-none focus:border-[var(--hairline-strong)]';

const initialFormData = {
  title: '',
  author: '',
  publisher: '',
  publish_date: '',
  isbn: '',
  price: '',
  link: '',
  description: '',
  cover_image_url: '',
  total_pages: '',
  format: '종이책',
  purchase_date: '',
  category: 'IT',
  ownership_status: '보유중',
  status: '읽기 전',
  current_page: '',
  rank: 0,
  bookmark: '',
  memo: '',
  finished_at: '',
  is_adult: false,
};

function bookToFormData(book: Book) {
  return {
    title: book.title || '',
    author: book.author || '',
    publisher: book.publisher || '',
    publish_date: book.publish_date || '',
    isbn: book.isbn || '',
    price: String(book.price ?? ''),
    cover_image_url: book.cover_image_url || '',
    link: book.link || '',
    description: book.description || '',
    total_pages: String(book.total_pages ?? ''),
    format: book.format || '종이책',
    purchase_date: book.purchase_date || '',
    category: book.category || 'IT',
    ownership_status:
      book.ownership_status ||
      (book.format === '방출' || book.status === '방출' ? '방출' : '보유중'),
    status: book.status || '읽기 전',
    current_page: String(book.current_page ?? ''),
    rank: book.rank ?? 0,
    bookmark: book.bookmark || '',
    memo: book.memo || '',
    finished_at: book.finished_at ?? '',
    is_adult: !!book.is_adult,
  };
}

function isUnauthorizedError(error: unknown) {
  return error instanceof Error && error.message === 'Unauthorized';
}

export function BooksLibraryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isAuthenticated = useAuthState();

  const [query, setQuery] = useState('');
  const [books, setBooks] = useState<AladinSearchBookItem[]>([]);
  const [selectedBook, setSelectedBook] = useState<SelectedBook | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [library, setLibrary] = useState<Book[]>([]);
  const [viewingBook, setViewingBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState(initialFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [consumedEditId, setConsumedEditId] = useState<string | null>(null);
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [recommendModalOpen, setRecommendModalOpen] = useState(false);
  const [recommendLoading, setRecommendLoading] = useState(false);
  const [recommendData, setRecommendData] = useState<BookRecommendPayload | null>(null);
  const [recommendEmptyMessage, setRecommendEmptyMessage] = useState<string | null>(null);

  const [listSearchQuery, setListSearchQuery] = useState('');
  const [listCategoryFilter, setListCategoryFilter] = useState('전체');
  const [listOwnershipFilter, setListOwnershipFilter] = useState<'전체' | '보유중' | '방출'>('보유중');
  const [listFormatFilter, setListFormatFilter] = useState('전체');
  const [listStatusFilter, setListStatusFilter] = useState('전체');
  const [listSortOrder, setListSortOrder] = useState<SortOrder>('purchase_desc');
  const [itemsPerPage] = useState(30);
  const [listCurrentPage, setListCurrentPage] = useState(1);

  const fetchLibrary = useCallback(async () => {
    setIsLoading(true);
    try {
      const client = createClient();
      const { data } = await client.from('books').select('*').order('created_at', { ascending: false });
      setLibrary((data as Book[]) || []);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

  const clearEditParam = () => {
    const sp = new URLSearchParams(searchParams.toString());
    if (!sp.has('edit')) return;
    sp.delete('edit');
    const next = sp.toString();
    router.replace(next ? `/books?${next}` : '/books');
  };

  useEffect(() => {
    const viewId = searchParams.get('view');
    if (!viewId || library.length === 0) return;
    const book = library.find((b) => String(b.id) === String(viewId));
    if (book) setViewingBook(book);
  }, [library, searchParams]);

  useEffect(() => {
    const editId = searchParams.get('edit');
    if (!editId || library.length === 0 || selectedBook || consumedEditId === editId) return;
    const book = library.find((b) => String(b.id) === String(editId));
    if (!book) return;
    setConsumedEditId(editId);
    setSelectedBook(book);
    setFormData(bookToFormData(book));
  }, [library, searchParams, selectedBook, consumedEditId]);

  useEffect(() => {
    const category = searchParams.get('category');
    if (category && (categoryOptions as readonly string[]).includes(category)) {
      setListCategoryFilter(category);
    }
    const ownership = searchParams.get('ownership');
    if (ownership === '보유중' || ownership === '방출' || ownership === '전체') {
      setListOwnershipFilter(ownership);
    }
    const status = searchParams.get('status');
    if (!status) return;
    if (status === '읽는중') {
      setListStatusFilter('읽는 중');
      return;
    }
    if (
      status === '읽는 중' ||
      status === '읽기 전' ||
      status === '완독' ||
      status === 'Collection' ||
      status === '전체'
    ) {
      setListStatusFilter(status);
    }
  }, [searchParams]);

  useEffect(() => {
    setListCurrentPage(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [
    listSearchQuery,
    listCategoryFilter,
    listOwnershipFilter,
    listFormatFilter,
    listStatusFilter,
    listSortOrder,
    itemsPerPage,
  ]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setHasSearched(true);
    setIsSearching(true);
    try {
      const result = await searchAladinBooks(query, 1, ALADIN_SEARCH_DISPLAY);
      setBooks(result.items || []);
      setTotalResults(result.total ?? 0);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '검색 중 오류가 발생했습니다.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setQuery('');
    setBooks([]);
    setTotalResults(0);
    setHasSearched(false);
  };

  const handleManualRegister = () => {
    if (!isAuthenticated) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    clearEditParam();
    setSelectedBook({ isManual: true });
    setFormData(initialFormData);
  };

  const handleSelectBook = (book: AladinSearchBookItem) => {
    if (!isAuthenticated) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    clearEditParam();
    setSelectedBook(book);
    const isbn = book.isbn ?? '';
    setFormData({
      title: book.title?.replace(/<\/?[^>]+(>|$)/g, '') || '',
      author: book.author || '',
      publisher: book.publisher || '',
      publish_date: book.pubdate || '',
      isbn,
      price: (book.discount != null && book.discount !== '' ? String(book.discount) : book.price) || '',
      link: book.link || '',
      description:
        (typeof book.description === 'string' ? book.description.replace(/<\/?[^>]+(>|$)/g, '') : '') || '',
      cover_image_url: book.image || '',
      total_pages: book.total_pages ?? '',
      format: '종이책',
      purchase_date: '',
      category: 'IT',
      ownership_status: '보유중',
      status: '읽기 전',
      current_page: '',
      rank: 0,
      bookmark: '',
      memo: '',
      finished_at: '',
      is_adult: false,
    });
    if (isbn) {
      getAladinItemByIsbn(isbn)
        .then((r) => {
          if (r && (r.total_pages != null || r.description != null)) {
            setFormData((prev) => ({
              ...prev,
              ...(r.total_pages != null && { total_pages: r.total_pages }),
              ...(r.description != null && {
                description: r.description.replace(/<\/?[^>]+(>|$)/g, '').trim() || prev.description,
              }),
            }));
          }
        })
        .catch(() => {});
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () =>
        setFormData((prev) => ({ ...prev, cover_image_url: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const handleEditFromModal = () => {
    if (!viewingBook) return;
    if (!isAuthenticated) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    clearEditParam();
    setSelectedBook(viewingBook);
    setFormData(bookToFormData(viewingBook));
    setViewingBook(null);
  };

  const handleDeleteFromModal = async () => {
    if (!viewingBook) return;
    if (!isAuthenticated) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    if (!confirm('정말 이 도서를 라이브러리에서 삭제하시겠습니까?\n삭제 후에는 복구할 수 없습니다.')) return;
    setIsDeleting(true);
    try {
      await deleteBookFromDB(viewingBook.id);
      toast.success('도서가 삭제되었습니다.');
      setViewingBook(null);
      fetchLibrary();
    } catch (error) {
      toast.error(isUnauthorizedError(error) ? '로그인이 필요합니다.' : '삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteClick = async () => {
    if (!selectedBook || !('id' in selectedBook) || !selectedBook.id) return;
    if (!isAuthenticated) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    if (!confirm('정말 이 도서를 라이브러리에서 삭제하시겠습니까?\n삭제 후에는 복구할 수 없습니다.')) return;
    setIsDeleting(true);
    try {
      await deleteBookFromDB(Number(selectedBook.id));
      toast.success('도서가 삭제되었습니다.');
      setSelectedBook(null);
      clearEditParam();
      fetchLibrary();
    } catch (error) {
      toast.error(isUnauthorizedError(error) ? '로그인이 필요합니다.' : '삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async () => {
    if (!selectedBook) return;
    if (!isAuthenticated) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    setIsSaving(true);
    try {
      if ('id' in selectedBook && selectedBook.id) {
        const updateId = Number(selectedBook.id);
        await updateBookInDB(updateId, formData);
        toast.success('도서 정보가 성공적으로 수정되었습니다.');
        const client = createClient();
        const { data: updatedRow } = await client.from('books').select('*').eq('id', updateId).single();
        if (updatedRow) setViewingBook(updatedRow as Book);
      } else {
        await saveBookToDB(formData);
        toast.success('도서가 라이브러리에 등록되었습니다.');
      }
      setSelectedBook(null);
      clearEditParam();
      handleClearSearch();
      fetchLibrary();
    } catch (error) {
      toast.error(isUnauthorizedError(error) ? '로그인이 필요합니다.' : '저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredLibrary = useMemo(
    () =>
      library.filter((book) => {
        const matchesCategory = listCategoryFilter === '전체' || book.category === listCategoryFilter;
        const ownershipStatus = getOwnershipStatus(book);
        const matchesOwnership =
          listOwnershipFilter === '전체' || ownershipStatus === listOwnershipFilter;
        const matchesFormat = listFormatFilter === '전체' || book.format === listFormatFilter;
        const matchesStatus =
          listStatusFilter === '전체' ||
          book.status === listStatusFilter ||
          (listStatusFilter === 'Collection' && book.status === '컬렉션');
        const lowerQuery = listSearchQuery.toLowerCase();
        const matchesSearch =
          !lowerQuery ||
          (book.title && book.title.toLowerCase().includes(lowerQuery)) ||
          (book.author && book.author.toLowerCase().includes(lowerQuery)) ||
          (book.isbn && book.isbn.toLowerCase().includes(lowerQuery));
        return matchesCategory && matchesOwnership && matchesFormat && matchesStatus && matchesSearch;
      }),
    [
      library,
      listSearchQuery,
      listCategoryFilter,
      listOwnershipFilter,
      listFormatFilter,
      listStatusFilter,
    ]
  );

  const sortedLibrary = useMemo(() => {
    return [...filteredLibrary].sort((a, b) => {
      if (listSortOrder === 'created_desc') {
        const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
        const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
        return tb - ta;
      }
      if (listSortOrder === 'purchase_desc') {
        if (!a.purchase_date) return 1;
        if (!b.purchase_date) return -1;
        return (b.purchase_date || '').localeCompare(a.purchase_date || '');
      }
      if (listSortOrder === 'purchase_asc') {
        if (!a.purchase_date) return 1;
        if (!b.purchase_date) return -1;
        return (a.purchase_date || '').localeCompare(b.purchase_date || '');
      }
      if (listSortOrder === 'publish_desc') {
        if (!a.publish_date) return 1;
        if (!b.publish_date) return -1;
        return (b.publish_date || '').localeCompare(a.publish_date || '');
      }
      if (!a.publish_date) return 1;
      if (!b.publish_date) return -1;
      return (a.publish_date || '').localeCompare(b.publish_date || '');
    });
  }, [filteredLibrary, listSortOrder]);

  const totalFilteredCount = sortedLibrary.length;
  const listTotalPages = Math.ceil(totalFilteredCount / itemsPerPage) || 1;
  const listStartIndex = (listCurrentPage - 1) * itemsPerPage;
  const paginatedLibrary = sortedLibrary.slice(listStartIndex, listStartIndex + itemsPerPage);

  return (
    <div className="mx-auto max-w-[1240px] px-4 pb-16 pt-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="flex items-center gap-2 text-2xl font-medium text-ink">
          <BookOpen className="size-7 shrink-0 text-mute" strokeWidth={1.5} />
          Books
        </h1>
        {isAuthenticated && (
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setStatsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-md border border-hairline bg-surface-elevated px-4 py-2 text-sm font-medium text-body hover:text-ink"
            >
              <BarChart2 className="size-4" strokeWidth={1.5} />
              독서 기록
            </button>
            <button
              type="button"
              disabled={recommendLoading}
              onClick={async () => {
                setRecommendModalOpen(true);
                setRecommendData(null);
                setRecommendEmptyMessage(null);
                if (library.filter((b) => b.status === '완독').length === 0) {
                  setRecommendEmptyMessage('완독한 도서가 없어 추천을 생성할 수 없습니다.');
                  setRecommendLoading(false);
                  return;
                }
                setRecommendLoading(true);
                try {
                  const res = await fetch('/api/book-recommend', { method: 'POST' });
                  const json = (await res.json()) as BookRecommendPayload & { error?: string };
                  if (!res.ok) {
                    toast.error(
                      typeof json.error === 'string' ? json.error : '추천을 불러오지 못했습니다.'
                    );
                    setRecommendModalOpen(false);
                    return;
                  }
                  if (
                    !json.owned ||
                    !json.external ||
                    typeof json.unreadOwnedCount !== 'number' ||
                    typeof json.external.detail_url !== 'string' ||
                    !json.external.detail_url.trim()
                  ) {
                    toast.error('응답 형식이 올바르지 않습니다.');
                    setRecommendModalOpen(false);
                    return;
                  }
                  setRecommendData({
                    owned: json.owned,
                    external: json.external,
                    unreadOwnedCount: json.unreadOwnedCount,
                  });
                } catch {
                  toast.error('추천을 불러오지 못했습니다.');
                  setRecommendModalOpen(false);
                } finally {
                  setRecommendLoading(false);
                }
              }}
              className="inline-flex items-center gap-2 rounded-md border border-hairline bg-surface-elevated px-4 py-2 text-sm font-medium text-body hover:text-ink disabled:pointer-events-none disabled:opacity-50"
            >
              {recommendLoading ? (
                <span className="inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-hairline border-t-ink" />
              ) : (
                <Sparkles className="size-4" strokeWidth={1.5} />
              )}
              AI 추천
            </button>
          </div>
        )}
      </div>

      {isAuthenticated && (
        <BookSearchSection
          query={query}
          setQuery={setQuery}
          books={books}
          hasSearched={hasSearched}
          totalResults={totalResults}
          isSearching={isSearching}
          onSearch={handleSearch}
          onClearSearch={handleClearSearch}
          onManualRegister={handleManualRegister}
          onSelectBook={handleSelectBook}
          isAuthenticated={isAuthenticated}
          inputBaseClass={inputBaseClass}
        />
      )}

      {viewingBook && (
        <BookDetailModal
          viewingBook={viewingBook}
          onClose={() => setViewingBook(null)}
          onEdit={handleEditFromModal}
          onDelete={handleDeleteFromModal}
          isAuthenticated={isAuthenticated}
          isDeleting={isDeleting}
        />
      )}

      <BookRecommendModal
        open={recommendModalOpen}
        onClose={() => {
          setRecommendModalOpen(false);
          setRecommendData(null);
          setRecommendEmptyMessage(null);
        }}
        loading={recommendLoading}
        data={recommendData}
        emptyMessage={recommendEmptyMessage}
      />

      {statsModalOpen && (
        <ReadingStatsModal
          library={library}
          isAuthenticated={isAuthenticated === true}
          onClose={() => setStatsModalOpen(false)}
          onReadingBookClick={(book) => {
            setStatsModalOpen(false);
            setViewingBook(book);
          }}
        />
      )}

      {selectedBook && (
        <BookForm
          selectedBook={selectedBook}
          formData={formData}
          setFormData={setFormData}
          onClose={() => {
            setSelectedBook(null);
            clearEditParam();
          }}
          onSave={handleSave}
          onDelete={handleDeleteClick}
          onImageUpload={handleImageUpload}
          isSaving={isSaving}
          isDeleting={isDeleting}
        />
      )}

      {isLoading ? (
        <div className="py-20 text-center text-mute">로딩 중...</div>
      ) : (
        <BookList
          paginatedLibrary={paginatedLibrary}
          listSearchQuery={listSearchQuery}
          setListSearchQuery={setListSearchQuery}
          listCategoryFilter={listCategoryFilter}
          setListCategoryFilter={setListCategoryFilter}
          listOwnershipFilter={listOwnershipFilter}
          setListOwnershipFilter={setListOwnershipFilter}
          listFormatFilter={listFormatFilter}
          setListFormatFilter={setListFormatFilter}
          listStatusFilter={listStatusFilter}
          setListStatusFilter={setListStatusFilter}
          listSortOrder={listSortOrder}
          setListSortOrder={(v) => setListSortOrder(v as SortOrder)}
          listCurrentPage={listCurrentPage}
          setListCurrentPage={setListCurrentPage}
          totalFilteredCount={totalFilteredCount}
          listTotalPages={listTotalPages}
          isAuthenticated={isAuthenticated}
          libraryEmpty={library.length === 0}
          showHighlightsLink={isAuthenticated === true}
          onItemClick={(book) => {
            if (book.is_adult && !isAuthenticated) {
              toast.error('로그인 후 열람 가능한 도서입니다.');
              return;
            }
            setViewingBook(book);
          }}
        />
      )}
    </div>
  );
}
