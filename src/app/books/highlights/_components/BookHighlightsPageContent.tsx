'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, ChevronUp, Pencil, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { formatAuthorName } from '@/lib/format';
import { BookDetailModal } from '../../_components/BookDetailModal';
import { deleteBookHighlight, getBookHighlights, updateBookHighlight } from '../../actions';
import type { Book, BookHighlight } from '../../types';

export type BookHighlightListItem = BookHighlight & {
  book: Pick<Book, 'id' | 'title' | 'author' | 'cover_image_url'>;
};

type BookHighlightsPageContentProps = {
  items: BookHighlightListItem[];
  library: Book[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value));
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
    ? 'border-[var(--hairline-strong)] bg-surface-elevated text-ink'
    : 'border-hairline text-body hover:text-ink';
}

export function BookHighlightsPageContent({ items, library }: BookHighlightsPageContentProps) {
  const router = useRouter();
  const [highlightItems, setHighlightItems] = useState(items);
  const [selectedViewingBookId, setSelectedViewingBookId] = useState<number | null>(null);
  const [selectedBookId, setSelectedBookId] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [editingTagInput, setEditingTagInput] = useState('');
  const [editingTags, setEditingTags] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);

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
    return Array.from(seen.entries())
      .map(([id, title]) => ({ id, title }))
      .sort((a, b) => a.title.localeCompare(b.title, 'ko'));
  }, [highlightItems]);

  const tagOptions = useMemo(() => {
    const tagSet = new Set<string>();
    highlightItems.forEach((item) => {
      (item.tags || []).forEach((tag) => {
        if (tag.trim()) tagSet.add(tag);
      });
    });
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b, 'ko'));
  }, [highlightItems]);

  const filteredItems = useMemo(
    () =>
      highlightItems.filter((item) => {
        const matchesBook = selectedBookId === 'all' || String(item.book.id) === selectedBookId;
        const matchesTag = selectedTag === 'all' || (item.tags || []).includes(selectedTag);
        return matchesBook && matchesTag;
      }),
    [highlightItems, selectedBookId, selectedTag]
  );

  const selectedViewingBook = useMemo(
    () =>
      selectedViewingBookId == null
        ? null
        : library.find((book) => book.id === selectedViewingBookId) || null,
    [library, selectedViewingBookId]
  );

  const hasHighlights = highlightItems.length > 0;

  const resetEditing = () => {
    setEditingId(null);
    setEditingContent('');
    setEditingTagInput('');
    setEditingTags([]);
    setIsSaving(false);
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
      const sourceBook = library.find((book) => book.id === bookId);
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

  return (
    <div className="mt-8 space-y-6 border-t border-hairline pt-8">
      <div className="mb-2 flex flex-col items-start gap-4 lg:flex-row lg:items-center lg:gap-6">
        <div className="flex shrink-0 items-center gap-3">
          <Link
            href="/books"
            className="inline-flex items-center justify-center rounded-md border border-hairline bg-surface-elevated p-2 text-body hover:text-ink"
            aria-label="소장 목록으로 돌아가기"
            title="소장 목록으로 돌아가기"
          >
            <ArrowLeft className="size-4" strokeWidth={1.8} />
          </Link>
          <h2 className="text-lg font-medium text-ink">하이라이트</h2>
        </div>
      </div>

      <div className="rounded-sm border border-hairline bg-surface-elevated p-5">
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
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${filterTagClass(selectedTag === 'all')}`}
              >
                전체 태그
              </button>
              {tagOptions.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(tag)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${filterTagClass(selectedTag === tag)}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {!hasHighlights ? (
        <div className="rounded-sm border border-hairline bg-surface-elevated px-5 py-12 text-center text-sm text-mute">
          아직 저장된 하이라이트가 없습니다.
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-sm border border-hairline bg-surface-elevated px-5 py-12 text-center text-sm text-mute">
          현재 필터에 맞는 하이라이트가 없습니다.
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm font-medium text-body">
            총 <span className="text-ink">{filteredItems.length}</span>개
          </p>
          {filteredItems.map((item) => (
            <article
              key={item.id}
              className="rounded-sm border border-hairline bg-surface-elevated p-5"
            >
              <div className="flex items-start gap-4">
                {item.book.cover_image_url ? (
                  <img
                    src={item.book.cover_image_url}
                    alt=""
                    className="hidden h-24 w-16 rounded-sm border border-hairline object-cover sm:block"
                  />
                ) : null}
                <div className="min-w-0 flex-1">
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <div className="min-w-0">
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
                              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${filterTagClass(selectedTag === tag)}`}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </>
                  )}
                  <p className="mt-4 text-xs text-mute">{formatDate(item.created_at)}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

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
          onEdit={() => {
            setSelectedViewingBookId(null);
            router.push(`/books?edit=${selectedViewingBook.id}`);
          }}
          onDelete={() => {}}
          onBookUpdated={() => {}}
          isAuthenticated
          isDeleting={false}
          onHighlightChange={handleHighlightChange}
        />
      ) : null}
    </div>
  );
}
