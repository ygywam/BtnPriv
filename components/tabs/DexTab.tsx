'use client';

import React, { useMemo } from 'react';
import { Book } from '@/lib/types';

interface DexTabProps {
  books: Book[];
  onSelectBook: (book: Book) => void;
}

/**
 * 도감 탭: 그동안 완독한 책(progressRate >= 100)의 표지를 컬렉션 형태로 나열
 */
export default function DexTab({ books, onSelectBook }: DexTabProps) {
  const completedBooks = useMemo(() => {
    return books
      .filter((b) => (b.progressRate || 0) >= 100)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }, [books]);

  const totalCompletedPages = useMemo(() => {
    return completedBooks.reduce((sum, b) => sum + (b.totalPage || b.readPages || 0), 0);
  }, [completedBooks]);

  return (
    <section className="tab-section">
      <div className="panel tab-header-card dex-header-card">
        <div className="dex-header-row">
          <div>
            <h2>🐾 완독 도서 도감</h2>
            <p className="subtitle">그동안 끝까지 읽어낸 책들의 표지 컬렉션입니다. 표지를 눌러 기록을 다시 열어보세요.</p>
          </div>
          <div className="dex-stats-pills">
            <div className="dex-stat-pill">
              <span>완독</span>
              <strong>{completedBooks.length}권</strong>
            </div>
            <div className="dex-stat-pill">
              <span>누적</span>
              <strong>{totalCompletedPages.toLocaleString()}쪽</strong>
            </div>
          </div>
        </div>
      </div>

      {completedBooks.length === 0 ? (
        <div className="panel text-center py-14">
          <div className="text-3xl mb-2">🏆</div>
          <h3 className="text-sm font-bold text-stone-700 mb-1">아직 완독한 책이 없어요</h3>
          <p className="text-xs text-stone-500">책을 끝까지 읽고 100%를 달성하면 이곳 도감에 표지가 수집됩니다.</p>
        </div>
      ) : (
        <div className="dex-grid">
          {completedBooks.map((book) => (
            <button
              key={book.id}
              type="button"
              className="dex-cover-tile"
              onClick={() => onSelectBook(book)}
              title={`${book.title} (${book.author || '저자 미상'})`}
            >
              <div className="cover-wrap dex-cover-wrap">
                <div className="author-badge dex-done-badge">✓ 완독</div>
                {book.cover ? (
                  <img src={book.cover} alt={book.title} />
                ) : (
                  <div className="flex items-center justify-center h-full text-center p-2 text-xs font-bold text-amber-900 bg-amber-100">
                    {book.title}
                  </div>
                )}
              </div>
              <span className="dex-cover-title">{book.title}</span>
              <span className="dex-cover-author">{book.author || '저자 미상'}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
