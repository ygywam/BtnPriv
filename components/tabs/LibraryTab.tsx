'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Book, Challenge } from '@/lib/types';

interface LibraryTabProps {
  books: Book[];
  currentChallenge: Challenge | null;
  loading: boolean;
  onSelectBook: (book: Book) => void;
  onOpenManualBook: () => void;
}

/**
 * 서재 탭: 마우스 휠 가로 캐러셀 + macOS Dock 스타일 호버 확대 서가
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

  // Dock & 휠 캐러셀 상태
  const shellRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, scrollLeft: 0, moved: false });

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

  // 서재 Dock 섹션 위에서 마우스 휠 회전 시 페이지 상하 스크롤을 막고 가로 캐러셀만 이동 (non-passive)
  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;

    const onNativeWheel = (e: WheelEvent) => {
      const track = trackRef.current;
      if (!track) return;
      if (Math.abs(e.deltaY) >= Math.abs(e.deltaX)) {
        e.preventDefault();
        e.stopPropagation();
        track.scrollLeft += e.deltaY * 1.3;
      }
    };

    shell.addEventListener('wheel', onNativeWheel, { passive: false });
    return () => {
      shell.removeEventListener('wheel', onNativeWheel);
    };
  }, [displayedBooks.length]);

  const scrollByStep = (dir: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 320, behavior: 'smooth' });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = trackRef.current;
    if (!el) return;
    setIsDragging(true);
    dragRef.current = { startX: e.pageX - el.offsetLeft, scrollLeft: el.scrollLeft, moved: false };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !trackRef.current) return;
    const x = e.pageX - trackRef.current.offsetLeft;
    const diff = x - dragRef.current.startX;
    if (Math.abs(diff) > 6) dragRef.current.moved = true;
    trackRef.current.scrollLeft = dragRef.current.scrollLeft - diff * 1.2;
  };

  const stopDragging = () => setIsDragging(false);

  // macOS Dock 물결 확대 스타일 계산
  const getDockCardStyle = (index: number): React.CSSProperties => {
    if (hoveredIdx === null) return {};
    const dist = Math.abs(hoveredIdx - index);
    if (dist === 0) {
      return { transform: 'translateY(-18px) scale(1.18)', zIndex: 30 };
    }
    if (dist === 1) {
      return { transform: 'translateY(-8px) scale(1.07)', zIndex: 20 };
    }
    if (dist === 2) {
      return { transform: 'translateY(-2px) scale(1.02)', zIndex: 10 };
    }
    return { opacity: 0.84 };
  };

  const focusedBook = hoveredIdx !== null ? displayedBooks[hoveredIdx] : null;

  return (
    <section className="tab-section">
      <div className="tab-header-card panel">
        <div className="tab-header-top">
          <div>
            <h2>📚 내 서재</h2>
            <p className="subtitle">마우스 휠이나 드래그로 책을 넘기고, 책에 마우스를 올리면 Dock처럼 크게 부각됩니다.</p>
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

      {/* Dock 스타일 휠 캐러셀 서재 */}
      {loading && books.length === 0 ? (
        <div className="panel flex gap-4 overflow-hidden py-8">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="library-dock-card animate-pulse" style={{ height: '270px' }} />
          ))}
        </div>
      ) : displayedBooks.length === 0 ? (
        <div className="panel text-center py-12">
          <div className="text-3xl mb-2">📖</div>
          <h3 className="text-sm font-bold text-stone-700 mb-1">표시할 도서가 없습니다</h3>
          <p className="text-xs text-stone-500">필터를 바꾸거나 홈 탭에서 도서를 검색해 추가해 보세요.</p>
        </div>
      ) : (
        <div ref={shellRef} className="panel library-dock-shell">
          <div className="library-dock-toolbar">
            <div className="library-dock-spotlight">
              {focusedBook ? (
                <>
                  <span className="library-dock-pill">{focusedBook.progressRate || 0}%</span>
                  <strong className="truncate">{focusedBook.title}</strong>
                  <span className="library-dock-author truncate">· {focusedBook.author || '저자 미상'}</span>
                </>
              ) : (
                <span className="library-dock-hint">
                  총 {displayedBooks.length}권 · 마우스 휠 또는 좌우 화살표로 서재를 넘겨보세요
                </span>
              )}
            </div>
            <div className="library-dock-arrows">
              <button
                type="button"
                onClick={() => scrollByStep(-1)}
                className="devlog-arrow-btn"
                aria-label="이전 책"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => scrollByStep(1)}
                className="devlog-arrow-btn"
                aria-label="다음 책"
              >
                ›
              </button>
            </div>
          </div>

          <div
            ref={trackRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={stopDragging}
            onMouseLeave={() => {
              stopDragging();
              setHoveredIdx(null);
            }}
            className={`library-dock-track ${isDragging ? 'is-dragging' : ''}`}
          >
            {displayedBooks.map((book, idx) => {
              const isDone = (book.progressRate || 0) >= 100;
              const isFocused = hoveredIdx === idx;
              return (
                <article
                  key={book.id}
                  className={`book-card library-dock-card ${isFocused ? 'is-focused' : ''}`}
                  style={getDockCardStyle(idx)}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onClick={() => {
                    if (!dragRef.current.moved) onSelectBook(book);
                  }}
                >
                  <div className="cover-wrap">
                    <div className="cover-badge">기록보기</div>
                    {isDone && <div className="author-badge">⭐ 완독</div>}
                    {book.cover ? (
                      <img src={book.cover} alt={book.title} draggable={false} />
                    ) : (
                      <div className="flex items-center justify-center h-full text-center p-3 text-xs font-bold text-amber-900 bg-amber-100">
                        {book.title}
                      </div>
                    )}
                  </div>

                  <div className="book-card-body">
                    <div className="book-title">{book.title}</div>
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

          {/* 하단 나무 책장 선반 느낌의 Dock 받침대 */}
          <div className="library-dock-shelf" aria-hidden="true" />
        </div>
      )}
    </section>
  );
}
