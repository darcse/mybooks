'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Camera } from 'lucide-react';
import { toast } from 'sonner';
import { ALADIN_SEARCH_DISPLAY } from '@/lib/aladin';
import { createClient } from '@/lib/supabase/client';
import { useAuthState } from '@/hooks/useAuthState';
import {
  deletePhotobookFromDB,
  getAladinItemByIsbn,
  savePhotobookToDB,
  searchAladinBooks,
  updatePhotobookInDB,
} from '../actions';
import { categoryOptions } from '../constants';
import type {
  AladinSearchBookItem,
  Photobook,
  PhotobookModelGroup,
  SelectedPhotobook,
} from '../types';
import { matchesPhotobookRankFilter, normalizePhotobookModelKey } from '../utils';
import { PhotobookDetailModal } from './PhotobookDetailModal';
import { PhotobookForm } from './PhotobookForm';
import { PhotobookList } from './PhotobookList';
import { PhotobookModelGroupsModal } from './PhotobookModelGroupsModal';
import { PhotobookSearchSection } from './PhotobookSearchSection';

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
  cover_image_url: '',
  total_pages: '',
  format: '종이책',
  purchase_date: '',
  category: 'idol',
  status: '보유중',
  current_page: '',
  rank: 0,
  bookmark: '',
  memo: '',
  is_adult: false,
};

function photobookToFormData(book: Photobook) {
  return {
    title: book.title || '',
    author: book.author || '',
    publisher: book.publisher || '',
    publish_date: book.publish_date || '',
    isbn: book.isbn || '',
    price: String(book.price ?? ''),
    cover_image_url: book.cover_image_url || '',
    total_pages: String(book.total_pages ?? ''),
    format: book.format || '종이책',
    purchase_date: book.purchase_date || '',
    category: book.category || 'idol',
    status: book.status || '보유중',
    current_page: String(book.current_page ?? ''),
    rank: book.rank ?? 0,
    bookmark: book.bookmark || '',
    memo: book.memo || '',
    is_adult: !!book.is_adult,
  };
}

function isUnauthorizedError(error: unknown) {
  return error instanceof Error && error.message === 'Unauthorized';
}

export function PhotobookLibraryContent() {
  const searchParams = useSearchParams();
  const isAuthenticated = useAuthState();

  const [query, setQuery] = useState('');
  const [searchItems, setSearchItems] = useState<AladinSearchBookItem[]>([]);
  const [selectedPhotobook, setSelectedPhotobook] = useState<SelectedPhotobook | null>(null);
  const [viewingPhotobook, setViewingPhotobook] = useState<Photobook | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [formData, setFormData] = useState(initialFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sameModelOpen, setSameModelOpen] = useState(false);
  const [library, setLibrary] = useState<Photobook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listSearchQuery, setListSearchQuery] = useState('');
  const [listCategoryFilter, setListCategoryFilter] = useState('전체');
  const [listRankFilter, setListRankFilter] = useState('전체');
  const [listSortOrder, setListSortOrder] = useState<SortOrder>('publish_desc');
  const [itemsPerPage] = useState(20);
  const [listCurrentPage, setListCurrentPage] = useState(1);
  const [modelModalOpen, setModelModalOpen] = useState(false);

  const fetchLibrary = useCallback(async () => {
    setIsLoading(true);
    try {
      const client = createClient();
      const { data } = await client
        .from('photobook')
        .select('*')
        .order('created_at', { ascending: false });
      setLibrary((data as Photobook[]) || []);
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
    const book = library.find((b) => String(b.id) === String(viewId));
    if (book) setViewingPhotobook(book);
  }, [library, searchParams]);

  useEffect(() => {
    const category = searchParams.get('category');
    if (category && (categoryOptions as readonly string[]).includes(category)) {
      setListCategoryFilter(category);
    }
    const q = searchParams.get('q');
    if (q != null) setListSearchQuery(q);
  }, [searchParams]);

  useEffect(() => {
    setListCurrentPage(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [listSearchQuery, listCategoryFilter, listRankFilter, listSortOrder, itemsPerPage]);

  const matchedSameModel = useMemo(() => {
    if (!viewingPhotobook?.id || !viewingPhotobook?.author?.trim()) return [];
    const key = normalizePhotobookModelKey(viewingPhotobook.author);
    return library
      .filter(
        (b) =>
          b.id !== viewingPhotobook.id &&
          !!b.author?.trim() &&
          normalizePhotobookModelKey(b.author) === key
      )
      .sort((a, b) => {
        const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
        const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
        return tb - ta;
      })
      .map((b) => ({
        id: b.id,
        title: b.title,
        author: b.author,
        cover_image_url: b.cover_image_url,
      }));
  }, [library, viewingPhotobook?.id, viewingPhotobook?.author]);

  useEffect(() => {
    setSameModelOpen(matchedSameModel.length > 0);
  }, [matchedSameModel]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    if (!isAuthenticated) {
      toast.error('로그인이 필요합니다.');
      return;
    }
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
    setSelectedPhotobook({ isManual: true });
    setFormData(initialFormData);
  };

  const handleSelectItem = (item: AladinSearchBookItem) => {
    if (!isAuthenticated) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    setSelectedPhotobook(item);
    const isbn = item.isbn ?? '';
    setFormData({
      title: item.title?.replace(/<\/?[^>]+(>|$)/g, '') || '',
      author: item.author || '',
      publisher: item.publisher || '',
      publish_date: item.pubdate || '',
      isbn,
      price: (item.discount != null && item.discount !== '' ? String(item.discount) : item.price) || '',
      cover_image_url: item.image || '',
      total_pages: item.total_pages ?? '',
      format: '종이책',
      purchase_date: '',
      category: 'idol',
      status: '보유중',
      current_page: '',
      rank: 0,
      bookmark: '',
      memo: '',
      is_adult: false,
    });
    if (isbn) {
      getAladinItemByIsbn(isbn)
        .then((r) => {
          if (r?.total_pages != null) {
            setFormData((prev) => ({ ...prev, total_pages: r.total_pages || prev.total_pages }));
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

  const handleItemClick = (book: Photobook) => {
    setViewingPhotobook(book);
  };

  const handleEditFromModal = () => {
    if (!viewingPhotobook) return;
    if (!isAuthenticated) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    setSelectedPhotobook(viewingPhotobook);
    setFormData(photobookToFormData(viewingPhotobook));
    setViewingPhotobook(null);
  };

  const handleDeleteFromModal = async () => {
    if (!viewingPhotobook) return;
    if (!isAuthenticated) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    if (!confirm('정말 이 사진집을 라이브러리에서 삭제하시겠습니까?\n삭제 후에는 복구할 수 없습니다.')) return;
    setIsDeleting(true);
    try {
      await deletePhotobookFromDB(viewingPhotobook.id);
      toast.success('사진집이 삭제되었습니다.');
      setViewingPhotobook(null);
      fetchLibrary();
    } catch (error) {
      toast.error(isUnauthorizedError(error) ? '로그인이 필요합니다.' : '삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteClick = async () => {
    if (!selectedPhotobook || !('id' in selectedPhotobook) || !selectedPhotobook.id) return;
    if (!isAuthenticated) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    if (!confirm('정말 이 사진집을 라이브러리에서 삭제하시겠습니까?\n삭제 후에는 복구할 수 없습니다.')) return;
    setIsDeleting(true);
    try {
      await deletePhotobookFromDB(Number(selectedPhotobook.id));
      toast.success('사진집이 삭제되었습니다.');
      setSelectedPhotobook(null);
      fetchLibrary();
    } catch (error) {
      toast.error(isUnauthorizedError(error) ? '로그인이 필요합니다.' : '삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async () => {
    if (!selectedPhotobook) return;
    if (!isAuthenticated) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    setIsSaving(true);
    try {
      const updateId =
        'id' in selectedPhotobook && selectedPhotobook.id ? Number(selectedPhotobook.id) : null;
      if ('id' in selectedPhotobook && selectedPhotobook.id) {
        await updatePhotobookInDB(Number(selectedPhotobook.id), formData);
        toast.success('사진집 정보가 수정되었습니다.');
      } else {
        await savePhotobookToDB(formData);
        toast.success('사진집이 라이브러리에 등록되었습니다.');
      }
      if (updateId != null) {
        const client = createClient();
        const { data: updatedRow } = await client
          .from('photobook')
          .select('*')
          .eq('id', updateId)
          .single();
        if (updatedRow) setViewingPhotobook(updatedRow as Photobook);
      }
      setSelectedPhotobook(null);
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
        const matchesCategory =
          listCategoryFilter === '전체' || book.category === listCategoryFilter;
        const matchesRank = matchesPhotobookRankFilter(book.rank ?? 0, listRankFilter);
        const lowerQuery = listSearchQuery.toLowerCase();
        const matchesSearch =
          !lowerQuery ||
          (book.title && book.title.toLowerCase().includes(lowerQuery)) ||
          (book.author && book.author.toLowerCase().includes(lowerQuery));
        return matchesCategory && matchesRank && matchesSearch;
      }),
    [library, listSearchQuery, listCategoryFilter, listRankFilter]
  );

  const modelGroups = useMemo(() => {
    const map = new Map<string, Photobook[]>();
    library.forEach((book) => {
      const key = normalizePhotobookModelKey(book.author);
      if (!key) return;
      const existing = map.get(key);
      if (existing) existing.push(book);
      else map.set(key, [book]);
    });
    return Array.from(map.entries())
      .map(([key, books]) => {
        const sorted = [...books].sort((a, b) => {
          const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
          const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
          return tb - ta;
        });
        return {
          key,
          modelName: sorted[0].author?.trim() || key,
          count: sorted.length,
          coverImageUrl: sorted[0].cover_image_url,
        };
      })
      .sort((a, b) => b.count - a.count) as PhotobookModelGroup[];
  }, [library]);

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

  const handleAuthorClick = (author: string) => {
    setListSearchQuery(author);
    setListCurrentPage(1);
  };

  const handleSelectModel = (modelName: string) => {
    setModelModalOpen(false);
    setListSearchQuery(modelName);
    setListCurrentPage(1);
  };

  return (
    <div className="mx-auto max-w-[1240px] px-4 pb-16 pt-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="flex items-center gap-2 text-2xl font-medium text-ink">
          <Camera className="size-7 shrink-0 text-mute" strokeWidth={1.5} />
          Photobook
        </h1>
        <button
          type="button"
          onClick={() => setModelModalOpen(true)}
          className="inline-flex h-[34px] shrink-0 items-center rounded-md border border-hairline bg-surface-elevated px-4 text-sm font-medium text-body hover:text-ink"
        >
          모델
        </button>
      </div>

      {isAuthenticated && (
        <PhotobookSearchSection
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

      {selectedPhotobook && (
        <PhotobookForm
          selectedPhotobook={selectedPhotobook}
          formData={formData}
          setFormData={setFormData}
          onClose={() => setSelectedPhotobook(null)}
          onSave={handleSave}
          onDelete={handleDeleteClick}
          onImageUpload={handleImageUpload}
          isSaving={isSaving}
          isDeleting={isDeleting}
        />
      )}

      {viewingPhotobook && (
        <PhotobookDetailModal
          viewingPhotobook={viewingPhotobook}
          matchedSameModel={matchedSameModel}
          sameModelOpen={sameModelOpen}
          setSameModelOpen={setSameModelOpen}
          onClose={() => setViewingPhotobook(null)}
          onEdit={handleEditFromModal}
          onDelete={handleDeleteFromModal}
          isAuthenticated={isAuthenticated}
          isDeleting={isDeleting}
        />
      )}

      {modelModalOpen && (
        <PhotobookModelGroupsModal
          groups={modelGroups}
          onClose={() => setModelModalOpen(false)}
          onSelectModel={handleSelectModel}
        />
      )}

      {isLoading ? (
        <div className="py-20 text-center text-mute">로딩 중...</div>
      ) : (
        <PhotobookList
            paginatedLibrary={paginatedLibrary}
            listSearchQuery={listSearchQuery}
            setListSearchQuery={setListSearchQuery}
            listCategoryFilter={listCategoryFilter}
            setListCategoryFilter={setListCategoryFilter}
            listRankFilter={listRankFilter}
            setListRankFilter={setListRankFilter}
            listSortOrder={listSortOrder}
            setListSortOrder={(v) => setListSortOrder(v as SortOrder)}
            listCurrentPage={listCurrentPage}
            setListCurrentPage={setListCurrentPage}
            totalFilteredCount={totalFilteredCount}
            listTotalPages={listTotalPages}
            libraryEmpty={library.length === 0}
            onAuthorClick={handleAuthorClick}
            onItemClick={handleItemClick}
        />
      )}
    </div>
  );
}
