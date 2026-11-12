'use client';

import React, { useMemo } from 'react';
import { Book, Challenge, Insight, ReadingLog } from '@/lib/types';
import ChallengeCalendarCard from '@/components/ChallengeCalendarCard';

interface HomeTabProps {
  books: Book[];
  challenges: Challenge[];
  currentChallenge: Challenge | null;
  onSelectChallenge: (id: string) => void;
  logs: ReadingLog[];
  insights: Insight[];
  loading: boolean;
  // 검색 상태
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searching: boolean;
  searchResults: any[];
  onClearSearchResults: () => void;
  searchApiType: 'aladin' | 'kakao' | 'naver';
  onSearch: () => void;
  onSelectSearchResult: (book: any) => void;
  onOpenManualBook: () => void;
  // 모달 & 네비게이션
  onSelectBook: (book: Book) => void;
  onOpenPeriodModal: () => void;
  onOpenReportModal: () => void;
  onGoToFeed: () => void;
  onGoToLibrary: () => void;
}

const SEGMENT_COUNT = 24;

/**
 * 홈 탭: 검색바 + 지금 읽는 책(미완독) + 챌린지 기간 캘린더 + 최근 독서기록 피드
 */
export default function HomeTab({
  books,
  challenges,
  currentChallenge,
  onSelectChallenge,
  logs,
  insights,
  loading,
  searchQuery,
  setSearchQuery,
  searching,
  searchResults,
  onClearSearchResults,
  searchApiType,
  onSearch,
  onSelectSearchResult,
  onOpenManualBook,
  onSelectBook,
  onOpenPeriodModal,
  onOpenReportModal,
  onGoToFeed,
  onGoToLibrary,
}: HomeTabProps) {
  // 완독하지 않은 책(지금 읽는 책)
  const readingBooks = useMemo(() => {
    return books.filter((b) => (b.progressRate || 0) < 100);
  }, [books]);

  // 현재 챌린지 도서들의 최신 독서기록(일지 + 문장수집 통합 최신 5건)
  const recentChallengeFeed = useMemo(() => {
    const challengeBookSet = new Set(
      currentChallenge
        ? books.filter((b) => b.challengeIds.includes(currentChallenge.id)).map((b) => b.id)
        : books.map((b) => b.id)
    );

    const isBelongsToChallenge = (bookId: string, challengeId?: string) => {
      if (!currentChallenge) return true;
      return challengeId === currentChallenge.id || challengeBookSet.has(bookId);
    };

    const list: Array<{
      id: string;
      type: 'log' | 'insight';
      date: string;
      sortKey: string;
      book?: Book;
      bookTitle: string;
      content: string;
      pageLabel: string;
    }> = [];

    logs.forEach((l) => {
      if (!isBelongsToChallenge(l.bookId, l.challengeId)) return;
      const book = books.find((b) => b.id === l.bookId);
      list.push({
        id: `log-${l.id}`,
        type: 'log',
        date: l.date || '',
        sortKey: `${(l.date || '').slice(0, 10)}_${l.createdAt || ''}`,
        book,
        bookTitle: book?.title || '도서',
        content: l.content || `${l.page}쪽까지 읽음`,
        pageLabel: `${l.page}쪽`,
      });
    });

    insights.forEach((ins) => {
      if (!isBelongsToChallenge(ins.bookId, ins.challengeId)) return;
      const book = books.find((b) => b.id === ins.bookId);
      list.push({
        id: `ins-${ins.id}`,
        type: 'insight',
        date: ins.date || '',
        sortKey: `${(ins.date || '').slice(0, 10)}_${ins.createdAt || ''}`,
        book,
        bookTitle: book?.title || '도서',
        content: ins.quote,
        pageLabel: ins.page ? `${ins.page}` : '문장',
      });
    });

    return list.sort((a, b) => b.sortKey.localeCompare(a.sortKey)).slice(0, 5);
  }, [books, logs, insights, currentChallenge]);

  const engineLabel =
    searchApiType === 'aladin' ? '알라딘' : searchApiType === 'kakao' ? '카카오' : '네이버';

  return (
    <div className="home-layout">
      {/* 1. 상단 둥근 도서 검색바 */}
      <section className="home-search-bar-wrap">
        <div className="home-search-pill">
          <span className="home-search-icon" aria-hidden="true">🔍</span>
          <input
            type="text"
            placeholder={`책 제목/저자 검색하기 (${engineLabel})`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          />
          <button type="button" className="home-search-submit" onClick={onSearch} disabled={searching}>
            {searching ? '검색 중' : '검색'}
          </button>
        </div>
        <button type="button" className="home-manual-btn" onClick={onOpenManualBook}>
          ✍️ 직접 등록
        </button>
      </section>

      {/* 검색 결과 드롭다운 카드 */}
      {searchResults.length > 0 && (
        <section className="panel search-results-panel">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 className="text-sm font-extrabold text-stone-800">
              검색 결과 ({searchResults.length}권)
            </h3>
            <button type="button" className="ghost-button text-xs py-1 px-2.5" onClick={onClearSearchResults}>
              닫기
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {searchResults.map((book, index) => (
              <div
                key={index}
                className="flex gap-2.5 bg-white p-2.5 border border-amber-200 rounded-xl items-center shadow-sm"
              >
                {book.coverUrl ? (
                  <img src={book.coverUrl} alt="" className="w-10 h-14 object-cover rounded shadow-sm flex-shrink-0" />
                ) : (
                  <div className="w-10 h-14 bg-amber-100 flex items-center justify-center text-[10px] font-bold text-amber-800 rounded flex-shrink-0">
                    표지
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-xs text-stone-900 truncate">{book.title}</p>
                  <p className="text-[11px] text-stone-500 truncate">{book.author} | {book.publisher}</p>
                  <p className="text-[11px] text-amber-800 font-semibold mt-0.5">
                    {book.totalPages > 0 ? `📖 총 ${book.totalPages}쪽` : '📄 쪽수 확인 필요'}
                  </p>
                </div>
                <button
                  type="button"
                  className="ghost-button text-xs py-1.5 px-2.5 flex-shrink-0"
                  style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
                  onClick={() => onSelectSearchResult(book)}
                >
                  선택
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 2. PC 2단 / 모바일 1단 본문 그리드 */}
      <div className="home-main-grid">
        {/* 좌측 열 (모바일 첫 번째): 지금 읽는 책 + 최근 독서기록 */}
        <div className="home-col-primary">
          {/* 지금 읽는 책 섹션 */}
          <section className="panel reading-now-panel">
            <div className="home-section-head">
              <div className="home-section-title">
                <span className="home-bookmark-badge" aria-hidden="true">🔖</span>
                <h2>지금 읽는 책</h2>
                <span className="home-count-pill">{readingBooks.length}</span>
              </div>
              <button type="button" className="home-more-link" onClick={onGoToLibrary}>
                서재 보기 ›
              </button>
            </div>

            {loading && books.length === 0 ? (
              <div className="reading-now-skeleton animate-pulse" />
            ) : readingBooks.length === 0 ? (
              <div className="home-empty-box">
                <p className="home-empty-title">지금 읽고 있는 책이 없습니다</p>
                <p className="home-empty-sub">위 검색창에서 새 책을 등록해 독서를 시작해 보세요.</p>
              </div>
            ) : (
              <div className="reading-now-list">
                {readingBooks.map((book) => {
                  const pct = Math.min(100, Math.max(0, book.progressRate || 0));
                  const filledSegments = Math.round((pct / 100) * SEGMENT_COUNT);
                  return (
                    <article
                      key={book.id}
                      className="reading-now-card"
                      onClick={() => onSelectBook(book)}
                    >
                      <div className="reading-now-cover">
                        {book.cover ? (
                          <img src={book.cover} alt={book.title} />
                        ) : (
                          <div className="reading-now-cover-fallback">{book.title}</div>
                        )}
                      </div>

                      <div className="reading-now-info">
                        <h3 className="reading-now-book-title">{book.title}</h3>
                        <p className="reading-now-book-author">
                          {book.author || '저자 미상'}
                          {book.publisher ? ` · ${book.publisher}` : ''}
                        </p>

                        {/* 캡쳐 스타일 세그먼트 진행률 바 */}
                        <div className="segment-progress-row">
                          <div className="segment-track" aria-label={`진행률 ${pct}%`}>
                            {Array.from({ length: SEGMENT_COUNT }).map((_, i) => (
                              <span
                                key={i}
                                className={`segment-tick ${i < filledSegments ? 'filled' : ''}`}
                              />
                            ))}
                          </div>
                          <span className="segment-pct">{pct}%</span>
                        </div>

                        <div className="reading-now-pages">
                          현재 페이지 <strong>{book.readPages || 0}</strong> / {book.totalPage || '?'}쪽
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* 모바일에서는 캘린더가 지금 읽는 책 바로 아래, 최근 독서기록 위에 오도록 순서 배치 */}
          <div className="home-calendar-mobile-slot">
            <ChallengeCalendarCard
              challenge={currentChallenge}
              challenges={challenges}
              onSelectChallenge={onSelectChallenge}
              books={books}
              logs={logs}
              insights={insights}
              onOpenPeriodModal={onOpenPeriodModal}
              onOpenReportModal={onOpenReportModal}
              onSelectBook={onSelectBook}
            />
          </div>

          {/* 최근 독서기록 섹션 */}
          <section className="panel recent-feed-panel">
            <div className="home-section-head">
              <div className="home-section-title">
                <span className="home-book-badge" aria-hidden="true">📖</span>
                <h2>최근 독서기록</h2>
              </div>
              <button type="button" className="home-more-link" onClick={onGoToFeed}>
                전체보기 ›
              </button>
            </div>

            {recentChallengeFeed.length === 0 ? (
              <div className="home-empty-box">
                <p className="home-empty-title">아직 기록이 없어요</p>
                <p className="home-empty-sub">지금 읽는 책을 눌러 진도와 문장을 기록하면 여기에 쌓여요</p>
              </div>
            ) : (
              <div className="recent-feed-list">
                {recentChallengeFeed.map((item) => (
                  <article
                    key={item.id}
                    className="recent-feed-item"
                    onClick={() => item.book && onSelectBook(item.book)}
                  >
                    <div className="recent-feed-meta">
                      <span className={`recent-feed-badge ${item.type === 'insight' ? 'is-insight' : 'is-log'}`}>
                        {item.type === 'insight' ? '문장수집' : '독서일지'}
                      </span>
                      <span className="recent-feed-book truncate">《{item.bookTitle}》</span>
                      <span className="recent-feed-date">{item.date} · {item.pageLabel}</span>
                    </div>
                    <p className="recent-feed-content">
                      {item.type === 'insight' ? `“${item.content}”` : item.content}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* 우측 열 (PC 전용 캘린더 슬롯 - 모바일에서는 숨김) */}
        <div className="home-col-secondary">
          <ChallengeCalendarCard
            challenge={currentChallenge}
            challenges={challenges}
            onSelectChallenge={onSelectChallenge}
            books={books}
            logs={logs}
            insights={insights}
            onOpenPeriodModal={onOpenPeriodModal}
            onOpenReportModal={onOpenReportModal}
            onSelectBook={onSelectBook}
          />
        </div>
      </div>
    </div>
  );
}
