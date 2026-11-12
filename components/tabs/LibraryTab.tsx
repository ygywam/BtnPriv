'use client';

import React, { useMemo, useState } from 'react';
import { Book, Challenge } from '@/lib/types';

interface LibraryTabProps {
  books: Book[];
  currentChallenge: Challenge | null;
  loading: boolean;
  onSelectBook: (book: Book) => void;
  onOpenManualBook: () => void;
}

/**
 * 서재 탭: 기존 도서 카드 갤러리 + 범위/상태 필터 및 정렬
 */
export default function LibraryTab({
  books,
  currentChallenge,
  loading,
  onSelectBook,
  onOpenManualBook,
}: LibraryTabProps) {
  const [scope, setScope] = useState<'all' | 'challenge'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'reading' | 'done'>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'progress' | 'title'>('latest');
  const [keyword, setKeyword] = useState('');

  const displayedBooks = useMemo(() => {
    let list = books;
    if (scope === 'challenge' && currentChallenge) {
      list = list.filter((b) => b.challengeIds.includes(currentChallenge.id));
    }

    const q = keyword.trim().toLowerCase();
    return list
      .filter((b) => {
        if (statusFilter === 'reading' && (b.progressRate || 0) >= 100) return false;
        if (statusFilter === 'done' && (b.progressRate || 0) < 100) return false;
        if (q) {
          const hay = `${b.title} ${b.author} ${b.publisher}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'progress') return (b.progressRate || 0) - (a.progressRate || 0);
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
  }, [books, scope, currentChallenge, statusFilter, sortBy, keyword]);

  return (
    <section className="tab-section">
      <div className="tab-header-card panel">
        <div className="tab-header-top">
          <div>
            <h2>📚 내 서재</h2>
            <p className="subtitle">책 표지를 누르면 독서일지, 문장수집, AI 감상문을 작성할 수 있습니다.</p>
          </div>
          <button type="button" className="ghost-button tab-add-btn" onClick={onOpenManualBook}>
            ✍️ 직접 등록
          </button>
        </div>

        {/* 범위 탭: 전체 서재 / 이번 챌린지 */}
        <div className="lib-scope-row">
          <button
            type="button"
            className={`lib-scope-btn ${scope === 'all' ? 'active' : ''}`}
            onClick={() => setScope('all')}
          >
            전체 서재 ({books.length})
          </button>
          {currentChallenge && (
            <button
              type="button"
              className={`lib-scope-btn ${scope === 'challenge' ? 'active' : ''}`}
              onClick={() => setScope('challenge')}
            >
              선택 챌린지 ({books.filter((b) => b.challengeIds.includes(currentChallenge.id)).length})
            </button>
          )}
        </div>

        {/* 필터 / 검색 / 정렬 */}
        <div className="filter-bar lib-filter-bar">
          <div className="filter-group">
            <button
              type="button"
              className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              전체
            </button>
            <button
              type="button"
              className={`filter-btn ${statusFilter === 'reading' ? 'active' : ''}`}
              onClick={() => setStatusFilter('reading')}
            >
              읽는 중
            </button>
            <button
              type="button"
              className={`filter-btn ${statusFilter === 'done' ? 'active' : ''}`}
              onClick={() => setStatusFilter('done')}
            >
              완독
            </button>
          </div>

          <div className="lib-search-sort">
            <input
              type="text"
              placeholder="서재 내 제목/저자 필터"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="lib-keyword-input"
            />
            <select
              className="lib-sort-select"
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              aria-label="정렬 기준"
            >
              <option value="latest">최신 등록순</option>
              <option value="progress">완독률순</option>
              <option value="title">도서명순</option>
            </select>
          </div>
        </div>
      </div>

      {/* 도서 카드 그리드 */}
      {loading && books.length === 0 ? (
        <div className="book-gallery">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="book-card animate-pulse" style={{ height: '260px' }} />
          ))}
        </div>
      ) : displayedBooks.length === 0 ? (
        <div className="panel text-center py-12">
          <div className="text-3xl mb-2">📖</div>
          <h3 className="text-sm font-bold text-stone-700 mb-1">표시할 도서가 없습니다</h3>
          <p className="text-xs text-stone-500">필터를 바꾸거나 홈 탭에서 도서를 검색해 추가해 보세요.</p>
        </div>
      ) : (
        <div className="book-gallery">
          {displayedBooks.map((book) => {
            const isDone = (book.progressRate || 0) >= 100;
            return (
              <article key={book.id} className="book-card">
                <div className="cover-wrap" onClick={() => onSelectBook(book)}>
                  <div className="cover-badge">기록보기</div>
                  {isDone && <div className="author-badge">⭐ 완독</div>}
                  {book.cover ? (
                    <img src={book.cover} alt={book.title} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-center p-3 text-xs font-bold text-amber-900 bg-amber-100">
                      {book.title}
                    </div>
                  )}
                </div>

                <div className="book-card-body">
                  <div className="book-title" onClick={() => onSelectBook(book)}>
                    {book.title}
                  </div>
                  <div className="book-meta truncate">{book.author || '저자 미상'}</div>

                  <div className="progress-area">
                    <div className="progress-text">
                      <span>{book.readPages || 0} / {book.totalPage || '?'}쪽</span>
                      <span className="text-amber-800 font-bold">{book.progressRate || 0}%</span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${Math.min(100, Math.max(0, book.progressRate || 0))}%`,
                          background: isDone
                            ? '#10b981'
                            : 'linear-gradient(90deg, var(--accent) 0%, var(--accent-dark) 100%)',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
