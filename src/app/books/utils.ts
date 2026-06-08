import type { Book } from './types';

export const getOwnershipStatus = (book: Book): '보유중' | '방출' => {
  if (book.ownership_status === '방출') return '방출';
  if (book.ownership_status === '보유중') return '보유중';
  if (book.format === '방출' || book.status === '방출') return '방출';
  return '보유중';
};
