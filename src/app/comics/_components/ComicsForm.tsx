'use client';

import { DeletingLabel, SavingLabel } from '@/components/AsyncMutationUi';
import { categoryOptions } from '../constants';
import type { SelectedComic } from '../types';

interface FormData {
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

interface ComicsFormProps {
  selectedComic: SelectedComic;
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  onClose: () => void;
  onSave: () => void;
  onDelete?: () => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isSaving?: boolean;
  isDeleting?: boolean;
}

const inputClass =
  'h-[42px] w-full rounded-md border border-hairline bg-surface-elevated px-3 text-sm text-ink outline-none focus:border-[var(--hairline-strong)]';
const textareaClass =
  'w-full min-h-[80px] rounded-md border border-hairline bg-surface-elevated px-3 py-2 text-sm text-ink outline-none focus:border-[var(--hairline-strong)]';
const readonlyClass = 'cursor-not-allowed opacity-70';

export function ComicsForm({
  selectedComic,
  formData,
  setFormData,
  onClose,
  onSave,
  onDelete,
  onImageUpload,
  isSaving = false,
  isDeleting = false,
}: ComicsFormProps) {
  const isEditing = 'id' in selectedComic && !!selectedComic.id;

  const renderInput = (
    label: string,
    field: keyof FormData,
    apiField?: string,
    type: string = 'text'
  ) => {
    const isReadOnly =
      apiField &&
      !isEditing &&
      !('isManual' in selectedComic) &&
      !!(selectedComic as Record<string, unknown>)?.[apiField];
    if (field === 'cover_image_url') return null;
    return (
      <div className={label === '만화 제목' ? 'col-span-2' : ''}>
        <label className="mb-1 block text-sm font-medium text-mute">{label}</label>
        <input
          type={type}
          className={`${inputClass} ${isReadOnly ? readonlyClass : ''}`}
          value={typeof formData[field] === 'boolean' ? '' : (formData[field] ?? '')}
          onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
          readOnly={!!isReadOnly}
        />
      </div>
    );
  };

  const coverReadOnly =
    !!('image' in selectedComic && selectedComic.image && !isEditing && !('isManual' in selectedComic));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-sm border border-hairline bg-surface p-8">
        <div className="mb-6 flex items-center justify-between border-b border-hairline pb-4">
          <h2 className="text-xl font-medium text-ink">
            {isEditing ? '만화책 정보 수정' : '신규 만화책 등록'}
          </h2>
          <button
            type="button"
            className="text-2xl font-medium text-mute hover:text-ink"
            onClick={onClose}
          >
            &times;
          </button>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          {renderInput('만화 제목', 'title', 'title')}
          {renderInput('저자', 'author', 'author')}
          {renderInput('출판사', 'publisher', 'publisher')}
          {renderInput('발매일', 'publish_date', 'pubdate')}
          {renderInput('ISBN', 'isbn', 'isbn')}
          {renderInput('판매가', 'price', 'price', 'number')}
          <div className="col-span-2">
            <label className="mb-1 block text-sm font-medium text-mute">도서 링크</label>
            <input
              type="url"
              className={inputClass}
              placeholder="https://..."
              value={formData.link}
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
            />
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-sm font-medium text-mute">표지 이미지</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                placeholder="이미지 URL"
                className={`${inputClass} flex-1 ${coverReadOnly ? readonlyClass : ''}`}
                value={formData.cover_image_url}
                onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })}
                readOnly={coverReadOnly}
              />
              {!coverReadOnly && (
                <input
                  type="file"
                  accept="image/*"
                  onChange={onImageUpload}
                  className="w-full rounded-md border border-hairline bg-surface-elevated p-2 text-sm text-body file:mr-2 file:rounded-md file:border-0 file:bg-surface-card file:px-3 file:py-1 file:text-sm file:font-medium file:text-ink sm:w-64"
                />
              )}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-mute">카테고리</label>
            <select
              className={inputClass}
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-mute">형태</label>
            <select
              className={inputClass}
              value={formData.format}
              onChange={(e) => setFormData({ ...formData, format: e.target.value })}
            >
              <option value="종이책">종이책</option>
              <option value="e-book">e-book</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-sm font-medium text-mute">시리즈</label>
            <input
              type="text"
              className={inputClass}
              placeholder="예: 원피스, 진격의 거인"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            />
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <input
              id="is_adult_comics"
              type="checkbox"
              className="size-4 rounded border-hairline"
              checked={!!formData.is_adult}
              onChange={(e) => setFormData({ ...formData, is_adult: e.target.checked })}
            />
            <label htmlFor="is_adult_comics" className="select-none text-sm font-medium text-body">
              19금
            </label>
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-sm font-medium text-mute">책 소개</label>
            <textarea
              className={textareaClass}
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="알라딘 API에서 불러오거나 직접 입력"
            />
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-sm font-medium text-mute">메모</label>
            <textarea
              className={textareaClass}
              rows={3}
              value={formData.memo}
              onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
            />
          </div>
        </div>
        <div className="mt-8 flex flex-col gap-3">
          <button
            type="button"
            className="w-full rounded-full bg-primary p-4 text-base font-medium text-on-primary disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onSave}
            disabled={isSaving || isDeleting}
            aria-busy={isSaving}
          >
            {isSaving ? (
              <SavingLabel />
            ) : isEditing ? (
              '수정 내용 저장하기'
            ) : (
              '라이브러리에 최종 등록'
            )}
          </button>
          {isEditing && onDelete && (
            <button
              type="button"
              className="w-full rounded-md border border-hairline bg-surface-elevated p-3 text-sm font-medium text-body hover:text-ink disabled:opacity-60"
              onClick={onDelete}
              disabled={isSaving || isDeleting}
              aria-busy={isDeleting}
            >
              {isDeleting ? <DeletingLabel /> : '만화책 삭제'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
