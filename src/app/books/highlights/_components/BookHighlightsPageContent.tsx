'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, ChevronUp, Pencil, Plus, RefreshCw, Sparkles, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { formatAuthorName } from '@/lib/format';
import { BookDetailModal } from '../../_components/BookDetailModal';
import { BookForm } from '../../_components/BookForm';
import {
  createBookHighlight,
  deleteBookHighlight,
  getBookHighlights,
  updateBookHighlight,
  updateBookInDB,
} from '../../actions';
import type { Book, BookHighlight } from '../../types';

export type BookHighlightListItem = BookHighlight & {
  book: Pick<Book, 'id' | 'title' | 'author' | 'cover_image_url'>;
};

type BookHighlightsPageContentProps = {
  items: BookHighlightListItem[];
  library: Book[];
  initialBookId?: string;
  fixedBookId?: number;
  backHref?: string;
};

function resolveInitialBookId(raw?: string) {
  if (!raw) return 'all';
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return 'all';
  return trimmed;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value));
}

function formatTime(value: string) {
  const date = new Date(value);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function normalizeTag(raw: string) {
  const trimmed = raw.trim().replace(/^#+/, '').replace(/\s+/g, '');
  return trimmed ? `#${trimmed}` : null;
}

function parseTagsFromInput(raw: string) {
  return raw
    .split(/\s+/)
    .map(normalizeTag)
    .filter((tag): tag is string => Boolean(tag));
}

function filterTagClass(active: boolean) {
  return active
    ? 'border border-primary bg-primary text-on-primary font-semibold shadow-sm'
    : 'border border-ash bg-surface text-body hover:border-ink/50 hover:text-ink';
}

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

function toBookSummary(book: Book) {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    cover_image_url: book.cover_image_url,
  };
}

function formatBookStatus(book: Book) {
  if (book.status === '완독' && book.finished_at) return `완독 (${book.finished_at})`;
  if (book.status === '컬렉션') return 'Collection';
  return book.status;
}

function formatReadingProgress(book: Book) {
  return `${book.current_page} / ${book.total_pages}p`;
}

export function BookHighlightsPageContent({
  items,
  library,
  initialBookId,
  fixedBookId,
  backHref,
}: BookHighlightsPageContentProps) {
  const isSingleBookView = fixedBookId != null;
  const [highlightItems, setHighlightItems] = useState(items);
  const [libraryState, setLibraryState] = useState(library);
  const [selectedViewingBookId, setSelectedViewingBookId] = useState<number | null>(null);
  const [selectedBookId, setSelectedBookId] = useState<string>(() =>
    fixedBookId != null ? String(fixedBookId) : resolveInitialBookId(initialBookId)
  );
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [dateSort, setDateSort] = useState<'desc' | 'asc'>('desc');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [editingTagInput, setEditingTagInput] = useState('');
  const [editingTags, setEditingTags] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [editBook, setEditBook] = useState<Book | null>(null);
  const [formData, setFormData] = useState(initialFormData);
  const [isSavingBook, setIsSavingBook] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createContent, setCreateContent] = useState('');
  const [createTagInput, setCreateTagInput] = useState('');
  const [createTags, setCreateTags] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [explainingId, setExplainingId] = useState<number | null>(null);
  const [clearingExplanationId, setClearingExplanationId] = useState<number | null>(null);

  useEffect(() => {
    setLibraryState(library);
  }, [library]);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 480);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const bookOptions = useMemo(() => {
    const seen = new Map<number, string>();
    highlightItems.forEach((item) => {
      if (!seen.has(item.book.id)) {
        seen.set(item.book.id, item.book.title);
      }
    });
    if (selectedBookId !== 'all') {
      const bookId = Number(selectedBookId);
      if (!seen.has(bookId)) {
        const fromLibrary = libraryState.find((book) => book.id === bookId);
        if (fromLibrary) {
          seen.set(fromLibrary.id, fromLibrary.title);
        }
      }
    }
    return Array.from(seen.entries())
      .map(([id, title]) => ({ id, title }))
      .sort((a, b) => a.title.localeCompare(b.title, 'ko'));
  }, [highlightItems, libraryState, selectedBookId]);

  const tagOptions = useMemo(() => {
    const tagSet = new Set<string>();
    const sourceItems = isSingleBookView
      ? highlightItems.filter((item) => item.book_id === fixedBookId)
      : highlightItems;
    sourceItems.forEach((item) => {
      (item.tags || []).forEach((tag) => {
        if (tag.trim()) tagSet.add(tag);
      });
    });
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b, 'ko'));
  }, [fixedBookId, highlightItems, isSingleBookView]);

  const filteredItems = useMemo(() => {
    const matched = highlightItems.filter((item) => {
      const matchesBook = selectedBookId === 'all' || String(item.book.id) === selectedBookId;
      const matchesTag = selectedTag === 'all' || (item.tags || []).includes(selectedTag);
      return matchesBook && matchesTag;
    });
    if (!isSingleBookView) return matched;
    return [...matched].sort((a, b) => {
      const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return dateSort === 'desc' ? -diff : diff;
    });
  }, [dateSort, highlightItems, isSingleBookView, selectedBookId, selectedTag]);

  const selectedViewingBook = useMemo(() => {
    return selectedViewingBookId == null
      ? null
      : libraryState.find((book) => book.id === selectedViewingBookId) || null;
  }, [libraryState, selectedViewingBookId]);

  const headerBook = useMemo(() => {
    if (!isSingleBookView || fixedBookId == null) return null;
    return libraryState.find((book) => book.id === fixedBookId) ?? null;
  }, [fixedBookId, isSingleBookView, libraryState]);

  const hasHighlights = isSingleBookView
    ? highlightItems.some((item) => item.book_id === fixedBookId)
    : highlightItems.length > 0;
  const isBookFiltered = isSingleBookView || selectedBookId !== 'all';
  const selectedFilterBook = useMemo(() => {
    if (!isBookFiltered) return null;
    const bookId = Number(selectedBookId);
    const fromLibrary = libraryState.find((book) => book.id === bookId);
    if (fromLibrary) return toBookSummary(fromLibrary);
    const fromOptions = bookOptions.find((book) => book.id === bookId);
    if (!fromOptions) return null;
    return {
      id: fromOptions.id,
      title: fromOptions.title,
      author: null as string | null,
      cover_image_url: null as string | null,
    };
  }, [bookOptions, isBookFiltered, libraryState, selectedBookId]);

  const applyBookUpdate = (updated: Book) => {
    setLibraryState((prev) => prev.map((book) => (book.id === updated.id ? updated : book)));
    setHighlightItems((prev) =>
      prev.map((item) =>
        item.book_id === updated.id ? { ...item, book: toBookSummary(updated) } : item
      )
    );
  };

  const resetEditing = () => {
    setEditingId(null);
    setEditingContent('');
    setEditingTagInput('');
    setEditingTags([]);
    setIsSaving(false);
  };

  const resetCreateForm = () => {
    setCreateContent('');
    setCreateTagInput('');
    setCreateTags([]);
    setIsCreating(false);
  };

  useEffect(() => {
    if (isBookFiltered) return;
    setIsCreateModalOpen(false);
    resetCreateForm();
  }, [isBookFiltered]);

  const closeCreateModal = () => {
    if (isCreating) return;
    setIsCreateModalOpen(false);
    resetCreateForm();
  };

  const commitCreatePendingTags = () => {
    const pendingTags = parseTagsFromInput(createTagInput);
    if (pendingTags.length === 0) return;
    setCreateTags((prev) => Array.from(new Set([...prev, ...pendingTags])));
    setCreateTagInput('');
  };

  const handleCreateTagKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    commitCreatePendingTags();
  };

  const handleRemoveCreateTag = (tagToRemove: string) => {
    setCreateTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  const handleCreateHighlight = async () => {
    if (!selectedFilterBook) return;
    const content = createContent.trim();
    const tags = Array.from(new Set([...createTags, ...parseTagsFromInput(createTagInput)]));
    if (!content) {
      toast.error('하이라이트 내용을 입력해 주세요.');
      return;
    }

    setIsCreating(true);
    try {
      const created = await createBookHighlight(selectedFilterBook.id, content, tags);
      const nextItem: BookHighlightListItem = {
        ...created,
        book: selectedFilterBook,
      };
      setHighlightItems((prev) =>
        [nextItem, ...prev].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      );
      setIsCreateModalOpen(false);
      resetCreateForm();
      toast.success('하이라이트가 저장되었습니다.');
    } catch {
      toast.error('하이라이트 저장 중 오류가 발생했습니다.');
      setIsCreating(false);
    }
  };

  const handleGenerateExplanation = async (item: BookHighlightListItem, force = false) => {
    if (explainingId != null || clearingExplanationId != null) return;
    setExplainingId(item.id);
    try {
      const res = await fetch('/api/highlight-explanation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ highlightId: item.id, force }),
      });
      const data = (await res.json()) as {
        explanation?: unknown;
        error?: unknown;
        message?: unknown;
      };
      if (!res.ok) {
        const msg =
          (typeof data.message === 'string' && data.message) ||
          (typeof data.error === 'string' && data.error) ||
          'AI 해설 생성에 실패했습니다.';
        toast.error(msg);
        return;
      }
      const explanation =
        typeof data.explanation === 'string' && data.explanation.trim() !== ''
          ? data.explanation.trim()
          : null;
      if (!explanation) {
        toast.error('AI 해설을 생성하지 못했습니다.');
        return;
      }
      setHighlightItems((prev) =>
        prev.map((entry) =>
          entry.id === item.id ? { ...entry, ai_explanation: explanation } : entry
        )
      );
    } catch {
      toast.error('AI 해설 생성에 실패했습니다.');
    } finally {
      setExplainingId(null);
    }
  };

  const handleClearExplanation = async (item: BookHighlightListItem) => {
    if (explainingId != null || clearingExplanationId != null) return;
    setClearingExplanationId(item.id);
    try {
      const res = await fetch('/api/highlight-explanation', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ highlightId: item.id }),
      });
      const data = (await res.json()) as { error?: unknown };
      if (!res.ok) {
        toast.error(
          typeof data.error === 'string' ? data.error : 'AI 해설 삭제에 실패했습니다.'
        );
        return;
      }
      setHighlightItems((prev) =>
        prev.map((entry) =>
          entry.id === item.id ? { ...entry, ai_explanation: null } : entry
        )
      );
    } catch {
      toast.error('AI 해설 삭제에 실패했습니다.');
    } finally {
      setClearingExplanationId(null);
    }
  };

  const beginEdit = (item: BookHighlightListItem) => {
    setEditingId(item.id);
    setEditingContent(item.content);
    setEditingTagInput('');
    setEditingTags(item.tags || []);
  };

  const commitPendingTags = () => {
    const pendingTags = parseTagsFromInput(editingTagInput);
    if (pendingTags.length === 0) return;
    setEditingTags((prev) => Array.from(new Set([...prev, ...pendingTags])));
    setEditingTagInput('');
  };

  const handleTagKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    commitPendingTags();
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditingTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  const handleSave = async (item: BookHighlightListItem) => {
    const content = editingContent.trim();
    const tags = Array.from(new Set([...editingTags, ...parseTagsFromInput(editingTagInput)]));
    if (!content) return;

    setIsSaving(true);
    try {
      const updated = await updateBookHighlight(item.id, item.book_id, content, tags);
      setHighlightItems((prev) =>
        prev.map((entry) => (entry.id === item.id ? { ...entry, ...updated } : entry))
      );
      resetEditing();
    } catch {
      toast.error('하이라이트 수정 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (item: BookHighlightListItem) => {
    if (!confirm('이 하이라이트를 삭제하시겠습니까?')) return;
    setDeletingId(item.id);
    try {
      await deleteBookHighlight(item.id, item.book_id);
      setHighlightItems((prev) => prev.filter((entry) => entry.id !== item.id));
      if (editingId === item.id) {
        resetEditing();
      }
    } catch {
      toast.error('하이라이트 삭제 중 오류가 발생했습니다.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleHighlightChange = async (bookId: number) => {
    try {
      const refreshed = await getBookHighlights(bookId);
      const sourceBook = libraryState.find((book) => book.id === bookId);
      const refreshedItems: BookHighlightListItem[] = refreshed.map((highlight) => ({
        ...highlight,
        book: sourceBook
          ? {
              id: sourceBook.id,
              title: sourceBook.title,
              author: sourceBook.author,
              cover_image_url: sourceBook.cover_image_url,
            }
          : {
              id: bookId,
              title: '알 수 없는 도서',
              author: null,
              cover_image_url: null,
            },
      }));

      setHighlightItems((prev) => {
        const withoutCurrentBook = prev.filter((item) => item.book_id !== bookId);
        return [...refreshedItems, ...withoutCurrentBook].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });
    } catch {
      toast.error('하이라이트 목록 동기화에 실패했습니다.');
    }
  };

  const handleEditFromModal = () => {
    if (!selectedViewingBook) return;
    setEditBook(selectedViewingBook);
    setFormData(bookToFormData(selectedViewingBook));
    setSelectedViewingBookId(null);
  };

  const handleBookFormSave = async () => {
    if (!editBook) return;
    setIsSavingBook(true);
    try {
      await updateBookInDB(editBook.id, formData);
      const client = createClient();
      const { data: updatedRow } = await client
        .from('books')
        .select('*')
        .eq('id', editBook.id)
        .single();
      if (updatedRow) {
        applyBookUpdate(updatedRow as Book);
      }
      toast.success('도서 정보가 성공적으로 수정되었습니다.');
      setEditBook(null);
    } catch {
      toast.error('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSavingBook(false);
    }
  };

  const handleBookImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () =>
      setFormData((prev) => ({ ...prev, cover_image_url: reader.result as string }));
    reader.readAsDataURL(file);
  };

  return (
    <div className="mt-8 space-y-6 border-t border-hairline pt-8">
      <div className="mb-2 flex flex-col items-start gap-4 lg:flex-row lg:items-center lg:gap-6">
        <div className="flex shrink-0 items-center gap-3">
          <Link
            href={backHref ?? '/books'}
            className="inline-flex items-center justify-center rounded-md border border-hairline bg-surface-elevated p-2 text-body hover:text-ink"
            aria-label={isSingleBookView ? '하이라이트 목록으로 돌아가기' : '소장 목록으로 돌아가기'}
            title={isSingleBookView ? '하이라이트 목록으로 돌아가기' : '소장 목록으로 돌아가기'}
          >
            <ArrowLeft className="size-4" strokeWidth={1.8} />
          </Link>
          <h2 className="text-lg font-medium text-ink">하이라이트</h2>
        </div>
      </div>

      {isSingleBookView && headerBook ? (
        <div className="flex items-start gap-4 rounded-sm border border-hairline bg-surface-elevated p-5">
          {headerBook.cover_image_url ? (
            <img
              src={headerBook.cover_image_url}
              alt=""
              className="h-32 w-24 shrink-0 rounded-sm border border-hairline object-cover"
            />
          ) : (
            <div className="flex h-32 w-24 shrink-0 items-center justify-center rounded-sm border border-hairline bg-surface text-xs text-mute">
              No cover
            </div>
          )}
          <div className="min-w-0 flex-1">
            <button
              type="button"
              onClick={() => setSelectedViewingBookId(headerBook.id)}
              className="text-left text-lg font-medium text-ink hover:text-body"
            >
              <span dangerouslySetInnerHTML={{ __html: headerBook.title }} />
            </button>
            {headerBook.author ? (
              <p className="mt-2 text-sm text-body">
                {formatAuthorName(headerBook.author)}
              </p>
            ) : null}
            <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 text-sm text-body sm:grid-cols-2">
              <p>
                <strong className="text-ink">출판사:</strong> {headerBook.publisher || '-'}
              </p>
              <p>
                <strong className="text-ink">발매일:</strong> {headerBook.publish_date || '-'}
              </p>
              <p>
                <strong className="text-ink">카테고리:</strong> {headerBook.category}
              </p>
              <p>
                <strong className="text-ink">상태:</strong>{' '}
                <span className="font-medium text-ink">{formatBookStatus(headerBook)}</span>
              </p>
              <p className="sm:col-span-2">
                <strong className="text-ink">독서 진행:</strong> {formatReadingProgress(headerBook)}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="rounded-sm border border-hairline bg-surface-elevated p-5">
        {isSingleBookView ? (
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <div className="space-y-2 text-sm">
              <span className="block font-medium text-mute">태그별 필터</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTag('all')}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${filterTagClass(selectedTag === 'all')}`}
                >
                  전체 태그
                </button>
                {tagOptions.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSelectedTag(tag)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${filterTagClass(selectedTag === tag)}`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <span className="block font-medium text-mute">날짜 정렬</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setDateSort('desc')}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${filterTagClass(dateSort === 'desc')}`}
                >
                  최근순
                </button>
                <button
                  type="button"
                  onClick={() => setDateSort('asc')}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${filterTagClass(dateSort === 'asc')}`}
                >
                  이전순
                </button>
              </div>
            </div>
          </div>
        ) : (
        <div className="grid gap-4 md:grid-cols-[minmax(0,260px)_1fr]">
          <label className="space-y-2 text-sm">
            <span className="block font-medium text-mute">도서별 필터</span>
            <select
              value={selectedBookId}
              onChange={(event) => setSelectedBookId(event.target.value)}
              className="h-[42px] w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-[var(--hairline-strong)]"
            >
              <option value="all">전체 도서</option>
              {bookOptions.map((book) => (
                <option key={book.id} value={String(book.id)}>
                  {book.title}
                </option>
              ))}
            </select>
          </label>
          <div className="space-y-2 text-sm">
            <span className="block font-medium text-mute">태그별 필터</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedTag('all')}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${filterTagClass(selectedTag === 'all')}`}
              >
                전체 태그
              </button>
              {tagOptions.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(tag)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${filterTagClass(selectedTag === tag)}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
        )}
      </div>

      {!hasHighlights ? (
        <div className="rounded-sm border border-hairline bg-surface-elevated px-5 py-12 text-center text-sm text-mute">
          아직 저장된 하이라이트가 없습니다.
        </div>
      ) : (
        <div className="space-y-4">
          {(isBookFiltered || filteredItems.length > 0) && (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-body">
                총 <span className="text-ink">{filteredItems.length}</span>개
              </p>
              {isBookFiltered && selectedFilterBook ? (
                <button
                  type="button"
                  onClick={() => {
                    resetCreateForm();
                    setIsCreateModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-md border border-hairline bg-surface px-3 py-1.5 text-sm font-medium text-body hover:text-ink"
                >
                  <Plus className="size-4" strokeWidth={1.8} />
                  등록
                </button>
              ) : null}
            </div>
          )}
          {filteredItems.length === 0 ? (
            <div className="rounded-sm border border-hairline bg-surface-elevated px-5 py-12 text-center text-sm text-mute">
              현재 필터에 맞는 하이라이트가 없습니다.
            </div>
          ) : (
            filteredItems.map((item) => (
            <article
              key={item.id}
              className="rounded-sm border border-hairline bg-surface-elevated p-5"
            >
              <div className="flex items-start gap-4">
                {!isSingleBookView && item.book.cover_image_url ? (
                  <img
                    src={item.book.cover_image_url}
                    alt=""
                    className="hidden h-24 w-16 rounded-sm border border-hairline object-cover sm:block"
                  />
                ) : null}
                <div className="min-w-0 flex-1">
                  <div className="mb-3 flex items-center justify-between gap-4">
                    <p className="text-base font-semibold text-ink tabular-nums">
                      {formatDate(item.created_at)}
                      <span className="ml-2 text-xs font-normal text-mute tabular-nums">
                        {formatTime(item.created_at)}
                      </span>
                    </p>
                    <div className="flex shrink-0 items-center gap-2">
                      {editingId === item.id ? (
                        <>
                          <button
                            type="button"
                            onClick={resetEditing}
                            className="inline-flex items-center justify-center rounded-md border border-hairline p-2 text-body hover:text-ink disabled:opacity-50"
                            disabled={isSaving}
                            aria-label="수정 취소"
                            title="취소"
                          >
                            <X className="size-4" strokeWidth={1.8} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSave(item)}
                            className="inline-flex items-center justify-center rounded-md border border-hairline bg-surface p-2 text-body hover:text-ink disabled:opacity-50"
                            disabled={isSaving}
                            aria-label="수정 저장"
                            title="저장"
                          >
                            <Check className="size-4" strokeWidth={1.8} />
                          </button>
                        </>
                      ) : (
                        <>
                          {!item.ai_explanation?.trim() ? (
                            <button
                              type="button"
                              onClick={() => handleGenerateExplanation(item, false)}
                              disabled={explainingId === item.id || clearingExplanationId != null}
                              className="inline-flex items-center justify-center rounded-md border border-hairline p-2 text-body hover:text-ink disabled:opacity-50"
                              aria-label="AI 해설"
                              title="AI 해설"
                            >
                              <Sparkles
                                className={`size-4 ${explainingId === item.id ? 'animate-pulse' : ''}`}
                                strokeWidth={1.8}
                              />
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => beginEdit(item)}
                            className="inline-flex items-center justify-center rounded-md border border-hairline p-2 text-body hover:text-ink"
                            aria-label="하이라이트 수정"
                            title="수정"
                          >
                            <Pencil className="size-4" strokeWidth={1.8} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            className="inline-flex items-center justify-center rounded-md border border-hairline p-2 text-body hover:text-ink disabled:opacity-50"
                            disabled={deletingId === item.id}
                            aria-label="하이라이트 삭제"
                            title="삭제"
                          >
                            <Trash2 className="size-4" strokeWidth={1.8} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {!isSingleBookView ? (
                    <div className="mb-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => setSelectedViewingBookId(item.book.id)}
                        className="text-left text-base font-medium text-ink hover:text-body"
                      >
                        <span dangerouslySetInnerHTML={{ __html: item.book.title }} />
                      </button>
                      {item.book.author ? (
                        <p className="mt-1 text-sm text-body">{formatAuthorName(item.book.author)}</p>
                      ) : null}
                    </div>
                  ) : null}
                  {editingId === item.id ? (
                    <div className="space-y-3">
                      <textarea
                        value={editingContent}
                        onChange={(event) => setEditingContent(event.target.value)}
                        className="min-h-28 w-full resize-y rounded-md border border-hairline bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-[var(--hairline-strong)]"
                      />
                      <input
                        value={editingTagInput}
                        onChange={(event) => setEditingTagInput(event.target.value)}
                        onKeyDown={handleTagKeyDown}
                        onBlur={commitPendingTags}
                        placeholder="#인용구 #아이디어 형태로 입력 후 스페이스 또는 엔터"
                        className="h-[42px] w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-[var(--hairline-strong)]"
                      />
                      {editingTags.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {editingTags.map((tag) => (
                            <button
                              key={`${item.id}-edit-${tag}`}
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              className="rounded-full border border-hairline bg-surface px-3 py-1 text-xs font-medium text-body hover:text-ink"
                            >
                              {tag} ×
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <>
                      <div className="rounded-sm border border-hairline bg-surface px-4 py-4">
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-body">
                          {item.content}
                        </p>
                      </div>
                      {(item.tags || []).length > 0 ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {(item.tags || []).map((tag) => (
                            <button
                              key={`${item.id}-${tag}`}
                              type="button"
                              onClick={() => setSelectedTag(tag)}
                              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${filterTagClass(selectedTag === tag)}`}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      ) : null}
                      {item.ai_explanation?.trim() ? (
                        <div className="mt-4 rounded-sm border border-hairline bg-surface px-4 py-3">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <p className="text-xs font-medium text-mute">AI 해설</p>
                            <div className="flex shrink-0 items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleGenerateExplanation(item, true)}
                                disabled={
                                  explainingId === item.id || clearingExplanationId === item.id
                                }
                                className="inline-flex items-center gap-1 rounded-md border border-hairline px-2 py-1 text-xs font-medium text-body hover:text-ink disabled:opacity-50"
                                aria-label="AI 해설 재생성"
                                title="재생성"
                              >
                                <RefreshCw
                                  className={`size-3.5 ${explainingId === item.id ? 'animate-spin' : ''}`}
                                  strokeWidth={1.8}
                                />
                                {explainingId === item.id ? '생성 중…' : '재생성'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleClearExplanation(item)}
                                disabled={
                                  explainingId === item.id || clearingExplanationId === item.id
                                }
                                className="inline-flex items-center gap-1 rounded-md border border-hairline px-2 py-1 text-xs font-medium text-body hover:text-ink disabled:opacity-50"
                                aria-label="AI 해설 삭제"
                                title="해설 삭제"
                              >
                                <Trash2 className="size-3.5" strokeWidth={1.8} />
                                {clearingExplanationId === item.id ? '삭제 중…' : '삭제'}
                              </button>
                            </div>
                          </div>
                          <p className="whitespace-pre-wrap text-sm leading-relaxed text-body">
                            {item.ai_explanation}
                          </p>
                        </div>
                      ) : explainingId === item.id ? (
                        <p className="mt-4 text-sm text-mute">AI 해설 생성 중…</p>
                      ) : null}
                    </>
                  )}
                </div>
              </div>
            </article>
            ))
          )}
        </div>
      )}

      {isCreateModalOpen && selectedFilterBook ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-lg rounded-sm border border-hairline bg-surface p-6">
            <button
              type="button"
              onClick={closeCreateModal}
              disabled={isCreating}
              className="absolute right-5 top-4 text-2xl font-medium text-mute hover:text-ink disabled:opacity-50"
              aria-label="모달 닫기"
            >
              &times;
            </button>
            <h3 className="mb-1 pr-8 text-lg font-medium text-ink">하이라이트 등록</h3>
            <p className="mb-5 truncate text-sm text-body">
              <span dangerouslySetInnerHTML={{ __html: selectedFilterBook.title }} />
            </p>
            <div className="space-y-4">
              <textarea
                value={createContent}
                onChange={(event) => setCreateContent(event.target.value)}
                placeholder="문장, 메모, 아이디어를 기록해 보세요."
                className="min-h-32 w-full resize-y rounded-md border border-hairline bg-surface-elevated px-4 py-3 text-sm text-ink outline-none focus:border-[var(--hairline-strong)]"
              />
              <input
                value={createTagInput}
                onChange={(event) => setCreateTagInput(event.target.value)}
                onKeyDown={handleCreateTagKeyDown}
                onBlur={commitCreatePendingTags}
                placeholder="#인용구 #아이디어 형태로 입력 후 스페이스 또는 엔터"
                className="h-[42px] w-full rounded-md border border-hairline bg-surface-elevated px-3 py-2 text-sm text-ink outline-none focus:border-[var(--hairline-strong)]"
              />
              {createTags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {createTags.map((tag) => (
                    <button
                      key={`create-${tag}`}
                      type="button"
                      onClick={() => handleRemoveCreateTag(tag)}
                      className="rounded-full border border-hairline bg-surface-elevated px-3 py-1 text-xs font-medium text-body hover:text-ink"
                    >
                      {tag} ×
                    </button>
                  ))}
                </div>
              ) : null}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  disabled={isCreating}
                  className="rounded-md border border-hairline px-4 py-2.5 text-sm font-medium text-body hover:text-ink disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleCreateHighlight}
                  disabled={isCreating}
                  className="rounded-md border border-hairline bg-surface-elevated px-4 py-2.5 text-sm font-medium text-body hover:text-ink disabled:opacity-50"
                >
                  {isCreating ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showBackToTop ? (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-40 inline-flex items-center justify-center rounded-full border border-hairline bg-surface-elevated p-3 text-body hover:text-ink"
          aria-label="맨 위로 이동"
          title="맨 위로 이동"
        >
          <ChevronUp className="size-5" strokeWidth={1.8} />
        </button>
      ) : null}

      {selectedViewingBook ? (
        <BookDetailModal
          viewingBook={selectedViewingBook}
          onClose={() => setSelectedViewingBookId(null)}
          onEdit={handleEditFromModal}
          onDelete={() => {}}
          isAuthenticated
          isDeleting={false}
          onHighlightChange={handleHighlightChange}
          onBookUpdated={applyBookUpdate}
        />
      ) : null}

      {editBook ? (
        <BookForm
          selectedBook={editBook}
          formData={formData}
          setFormData={setFormData}
          onClose={() => {
            if (isSavingBook) return;
            setEditBook(null);
          }}
          onSave={handleBookFormSave}
          onImageUpload={handleBookImageUpload}
          isSaving={isSavingBook}
        />
      ) : null}
    </div>
  );
}
