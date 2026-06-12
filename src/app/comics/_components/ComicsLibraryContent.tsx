'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { ALADIN_SEARCH_DISPLAY } from '@/lib/aladin';
import { createClient } from '@/lib/supabase/client';
import { useAuthState } from '@/hooks/useAuthState';
import {
  deleteComicFromDB,
  getAladinItemByIsbn,
  saveComicToDB,
  searchAladinBooks,
  updateComicInDB,
} from '../actions';
import { categoryOptions } from '../constants';
import type { AladinSearchBookItem, Comic, SelectedComic } from '../types';
import { ComicsDetailModal } from './ComicsDetailModal';
import { ComicsForm } from './ComicsForm';
import { ComicsList } from './ComicsList';
import { ComicsSearchSection } from './ComicsSearchSection';

type SortOrder = 'created_desc' | 'publish_desc' | 'publish_asc';

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
  category: '코믹',
  status: '',
  current_page: '',
  rank: 0,
  bookmark: '',
  memo: '',
  is_adult: false,
};

function comicToFormData(comic: Comic) {
  return {
    title: comic.title || '',
    author: comic.author || '',
    publisher: comic.publisher || '',
    publish_date: comic.publish_date || '',
    isbn: comic.isbn || '',
    price: String(comic.price ?? ''),
    cover_image_url: comic.cover_image_url || '',
    link: comic.link || '',
    description: comic.description || '',
    total_pages: String(comic.total_pages ?? ''),
    format: comic.format || '종이책',
    purchase_date: comic.purchase_date || '',
    category: comic.category || '코믹',
    status: comic.status || '',
    current_page: String(comic.current_page ?? ''),
    rank: comic.rank ?? 0,
    bookmark: comic.bookmark || '',
    memo: comic.memo || '',
    is_adult: !!comic.is_adult,
  };
}

function isUnauthorizedError(error: unknown) {
  return error instanceof Error && error.message === 'Unauthorized';
}

export function ComicsLibraryContent() {
  const searchParams = useSearchParams();
  const isAuthenticated = useAuthState();

  const [query, setQuery] = useState('');
  const [searchItems, setSearchItems] = useState<AladinSearchBookItem[]>([]);
  const [selectedComic, setSelectedComic] = useState<SelectedComic | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [formData, setFormData] = useState(initialFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewingComic, setViewingComic] = useState<Comic | null>(null);
  const [library, setLibrary] = useState<Comic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listSearchQuery, setListSearchQuery] = useState('');
  const [listCategoryFilter, setListCategoryFilter] = useState('전체');
  const [listStatusFilter, setListStatusFilter] = useState('전체');
  const [listSortOrder, setListSortOrder] = useState<SortOrder>('publish_desc');
  const [itemsPerPage] = useState(30);
  const [listCurrentPage, setListCurrentPage] = useState(1);

  const fetchLibrary = useCallback(async () => {
    setIsLoading(true);
    try {
      const client = createClient();
      const { data } = await client.from('comics').select('*').order('created_at', { ascending: false });
      setLibrary((data as Comic[]) || []);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

  useEffect(() => {
    const viewId = searchParams.get('view');
    if (!viewId || library.length === 0) return;
    const comic = library.find((c) => String(c.id) === String(viewId));
    if (comic) setViewingComic(comic);
  }, [library, searchParams]);

  useEffect(() => {
    const category = searchParams.get('category');
    if (category && (categoryOptions as readonly string[]).includes(category)) {
      setListCategoryFilter(category);
    }
    const status = searchParams.get('status');
    if (status) setListStatusFilter(status);
  }, [searchParams]);

  useEffect(() => {
    setListCurrentPage(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [listSearchQuery, listCategoryFilter, listStatusFilter, listSortOrder, itemsPerPage]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setHasSearched(true);
    setIsSearching(true);
    try {
      const result = await searchAladinBooks(query, 1, ALADIN_SEARCH_DISPLAY);
      setSearchItems(result.items || []);
      setTotalResults(result.total ?? 0);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '검색 중 오류가 발생했습니다.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setQuery('');
    setSearchItems([]);
    setTotalResults(0);
    setHasSearched(false);
  };

  const handleManualRegister = () => {
    if (!isAuthenticated) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    setSelectedComic({ isManual: true });
    setFormData(initialFormData);
  };

  const handleSelectItem = (item: AladinSearchBookItem) => {
    if (!isAuthenticated) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    setSelectedComic(item);
    const isbn = item.isbn ?? '';
    setFormData({
      title: item.title?.replace(/<\/?[^>]+(>|$)/g, '') || '',
      author: item.author || '',
      publisher: item.publisher || '',
      publish_date: item.pubdate || '',
      isbn,
      price: (item.discount != null && item.discount !== '' ? String(item.discount) : item.price) || '',
      link: item.link || '',
      description:
        (typeof item.description === 'string' ? item.description.replace(/<\/?[^>]+(>|$)/g, '') : '') || '',
      cover_image_url: item.image || '',
      total_pages: item.total_pages ?? '',
      format: '종이책',
      purchase_date: '',
      category: '코믹',
      status: '',
      current_page: '',
      rank: 0,
      bookmark: '',
      memo: '',
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

  const handleEditClick = (comic: Comic) => {
    if (comic.is_adult && !isAuthenticated) {
      toast.error('로그인 후 열람 가능한 만화책입니다.');
      return;
    }
    setViewingComic(comic);
  };

  const handleEditFromModal = () => {
    if (!viewingComic) return;
    if (!isAuthenticated) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    setSelectedComic(viewingComic);
    setFormData(comicToFormData(viewingComic));
    setViewingComic(null);
  };

  const handleDeleteFromModal = async () => {
    if (!viewingComic) return;
    if (!isAuthenticated) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    if (!confirm('정말 이 만화책을 라이브러리에서 삭제하시겠습니까?\n삭제 후에는 복구할 수 없습니다.')) return;
    setIsDeleting(true);
    try {
      await deleteComicFromDB(viewingComic.id);
      toast.success('만화책이 삭제되었습니다.');
      setViewingComic(null);
      fetchLibrary();
    } catch (error) {
      toast.error(isUnauthorizedError(error) ? '로그인이 필요합니다.' : '삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteClick = async () => {
    if (!selectedComic || !('id' in selectedComic) || !selectedComic.id) return;
    if (!isAuthenticated) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    if (!confirm('정말 이 만화책을 라이브러리에서 삭제하시겠습니까?\n삭제 후에는 복구할 수 없습니다.')) return;
    setIsDeleting(true);
    try {
      await deleteComicFromDB(Number(selectedComic.id));
      toast.success('만화책이 삭제되었습니다.');
      setSelectedComic(null);
      fetchLibrary();
    } catch (error) {
      toast.error(isUnauthorizedError(error) ? '로그인이 필요합니다.' : '삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async () => {
    if (!selectedComic) return;
    if (!isAuthenticated) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    setIsSaving(true);
    try {
      const updateId =
        'id' in selectedComic && selectedComic.id ? Number(selectedComic.id) : null;
      if ('id' in selectedComic && selectedComic.id) {
        await updateComicInDB(Number(selectedComic.id), formData);
        toast.success('만화책 정보가 성공적으로 수정되었습니다.');
      } else {
        await saveComicToDB(formData);
        toast.success('만화책이 라이브러리에 등록되었습니다.');
      }
      if (updateId != null) {
        const client = createClient();
        const { data: updatedRow } = await client
          .from('comics')
          .select('*')
          .eq('id', updateId)
          .single();
        if (updatedRow) setViewingComic(updatedRow as Comic);
      }
      setSelectedComic(null);
      handleClearSearch();
      fetchLibrary();
    } catch (error) {
      toast.error(isUnauthorizedError(error) ? '로그인이 필요합니다.' : '저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const statusOptions = useMemo(() => {
    const set = new Set<string>();
    library.forEach((comic) => {
      const value = comic.status?.trim();
      if (value) set.add(value);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ko'));
  }, [library]);

  const filteredLibrary = useMemo(
    () =>
      library.filter((comic) => {
        const matchesCategory =
          listCategoryFilter === '전체' || comic.category === listCategoryFilter;
        const matchesStatus =
          listStatusFilter === '전체' || comic.status === listStatusFilter;
        const lowerQuery = listSearchQuery.toLowerCase();
        const matchesSearch =
          !lowerQuery ||
          (comic.title && comic.title.toLowerCase().includes(lowerQuery)) ||
          (comic.author && comic.author.toLowerCase().includes(lowerQuery));
        return matchesCategory && matchesStatus && matchesSearch;
      }),
    [library, listSearchQuery, listCategoryFilter, listStatusFilter]
  );

  const sortedLibrary = useMemo(() => {
    return [...filteredLibrary].sort((a, b) => {
      if (listSortOrder === 'created_desc') {
        const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
        const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
        return tb - ta;
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
      <div className="mb-6 flex items-center gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-medium text-ink">
          <BookOpen className="size-7 shrink-0 text-mute" strokeWidth={1.5} />
          Comics
        </h1>
      </div>

      {isAuthenticated && (
        <ComicsSearchSection
          query={query}
          setQuery={setQuery}
          items={searchItems}
          hasSearched={hasSearched}
          totalResults={totalResults}
          isSearching={isSearching}
          onSearch={handleSearch}
          onClearSearch={handleClearSearch}
          onManualRegister={handleManualRegister}
          onSelectItem={handleSelectItem}
          isAuthenticated={isAuthenticated}
          inputBaseClass={inputBaseClass}
        />
      )}

      {viewingComic && (
        <ComicsDetailModal
          viewingComic={viewingComic}
          onClose={() => setViewingComic(null)}
          onEdit={handleEditFromModal}
          onDelete={handleDeleteFromModal}
          isAuthenticated={isAuthenticated}
          isDeleting={isDeleting}
        />
      )}

      {selectedComic && (
        <ComicsForm
          selectedComic={selectedComic}
          formData={formData}
          setFormData={setFormData}
          onClose={() => setSelectedComic(null)}
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
        <ComicsList
          paginatedLibrary={paginatedLibrary}
          listSearchQuery={listSearchQuery}
          setListSearchQuery={setListSearchQuery}
          listCategoryFilter={listCategoryFilter}
          setListCategoryFilter={setListCategoryFilter}
          listStatusFilter={listStatusFilter}
          setListStatusFilter={setListStatusFilter}
          statusOptions={statusOptions}
          listSortOrder={listSortOrder}
          setListSortOrder={(v) => setListSortOrder(v as SortOrder)}
          listCurrentPage={listCurrentPage}
          setListCurrentPage={setListCurrentPage}
          totalFilteredCount={totalFilteredCount}
          listTotalPages={listTotalPages}
          libraryEmpty={library.length === 0}
          isAuthenticated={isAuthenticated}
          onItemClick={handleEditClick}
        />
      )}
    </div>
  );
}
