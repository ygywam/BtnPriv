'use client';

import React, { useMemo, useState } from 'react';
import { Book, Insight, ReadingLog } from '@/lib/types';

interface FeedTabProps {
  books: Book[];
  logs: ReadingLog[];
  insights: Insight[];
  loading: boolean;
  onSelectBook: (book: Book) => void;
}

/**
 * 피드 탭: 모든 독서일지와 문장수집을 시간순서(최신순)로 통합 제공
 */
export default function FeedTab({ books, logs, insights, loading, onSelectBook }: FeedTabProps) {
  const [filterType, setFilterType] = useState<'all' | 'log' | 'insight'>('all');
  const [keyword, setKeyword] = useState('');

  const timelineItems = useMemo(() => {
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
      const book = books.find((b) => b.id === l.bookId);
      list.push({
        id: `log-${l.id}`,
        type: 'log',
        date: l.date || '',
        sortKey: `${(l.date || '').replace(/\./g, '-').slice(0, 10)}_${l.createdAt || ''}`,
        book,
        bookTitle: book?.title || '도서',
        content: l.content || `${l.page}쪽까지 읽음`,
        pageLabel: `${l.page}쪽`,
      });
    });

    insights.forEach((ins) => {
      const book = books.find((b) => b.id === ins.bookId);
      list.push({
        id: `ins-${ins.id}`,
        type: 'insight',
        date: ins.date || '',
        sortKey: `${(ins.date || '').replace(/\./g, '-').slice(0, 10)}_${ins.createdAt || ''}`,
        book,
        bookTitle: book?.title || '도서',
        content: ins.quote,
        pageLabel: ins.page ? `${ins.page}` : '문장',
      });
    });

    const q = keyword.trim().toLowerCase();
    return list
      .filter((item) => {
        if (filterType !== 'all' && item.type !== filterType) return false;
        if (q) {
          const hay = `${item.bookTitle} ${item.content}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => b.sortKey.localeCompare(a.sortKey));
  }, [logs, insights, books, filterType, keyword]);

  return (
    <section className="tab-section">
      <div className="panel tab-header-card">
        <h2>💬 독서기록 & 문장수집 피드</h2>
        <p className="subtitle">모든 독서일지와 수집한 문장을 시간순서대로 모아봅니다.</p>

        <div className="filter-bar lib-filter-bar mt-3 mb-0">
          <div className="filter-group">
            <button
              type="button"
              className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              전체 ({logs.length + insights.length})
            </button>
            <button
              type="button"
              className={`filter-btn ${filterType === 'log' ? 'active' : ''}`}
              onClick={() => setFilterType('log')}
            >
              독서일지 ({logs.length})
            </button>
            <button
              type="button"
              className={`filter-btn ${filterType === 'insight' ? 'active' : ''}`}
              onClick={() => setFilterType('insight')}
            >
              문장수집 ({insights.length})
            </button>
          </div>

          <input
            type="text"
            placeholder="책 제목이나 문장 검색"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="lib-keyword-input"
          />
        </div>
      </div>

      {loading && timelineItems.length === 0 ? (
        <div className="panel text-center py-10 text-xs text-stone-400">기록을 불러오는 중...</div>
      ) : timelineItems.length === 0 ? (
        <div className="panel text-center py-12">
          <p className="text-sm font-bold text-stone-700">표시할 기록이 없습니다</p>
          <p className="text-xs text-stone-500 mt-1">책을 눌러 독서일지나 문장을 기록하면 여기에 시간순으로 쌓입니다.</p>
        </div>
      ) : (
        <div className="feed-timeline-list">
          {timelineItems.map((item) => (
            <article
              key={item.id}
              className={`panel feed-card ${item.type === 'insight' ? 'is-insight' : ''}`}
              onClick={() => item.book && onSelectBook(item.book)}
            >
              <div className="feed-card-cover">
                {item.book?.cover ? (
                  <img src={item.book.cover} alt={item.bookTitle} />
                ) : (
                  <div className="feed-card-cover-fallback">📖</div>
                )}
              </div>

              <div className="feed-card-body">
                <div className="feed-card-top">
                  <span className={`recent-feed-badge ${item.type === 'insight' ? 'is-insight' : 'is-log'}`}>
                    {item.type === 'insight' ? '💡 문장수집' : '📅 독서일지'}
                  </span>
                  <span className="feed-card-date">{item.date || '날짜 미상'} · {item.pageLabel}</span>
                </div>
                <div className="feed-card-book">《{item.bookTitle}》</div>
                <p className="feed-card-text">
                  {item.type === 'insight' ? `“${item.content}”` : item.content}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
