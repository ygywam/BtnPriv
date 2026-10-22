'use client';

import React, { useState, useEffect } from 'react';
import { ReadingLog, Insight, Book } from '@/lib/types';

interface TimelineFeedViewProps {
  books: Book[];
}

export default function TimelineFeedView({ books }: TimelineFeedViewProps) {
  const [filterType, setFilterType] = useState<'all' | 'logs' | 'insights'>('all');
  const [logs, setLogs] = useState<ReadingLog[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAllRecords() {
      setIsLoading(true);
      try {
        const [resLogs, resInsights] = await Promise.all([
          fetch('/api/logs').then((r) => r.json()),
          fetch('/api/insights').then((r) => r.json()),
        ]);
        if (resLogs.logs) setLogs(resLogs.logs);
        if (resInsights.insights) setInsights(resInsights.insights);
      } catch (e) {
        console.error('타임라인 로드 실패:', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadAllRecords();
  }, []);

  const getBookTitle = (bookId: string) => {
    return books.find((b) => b.id === bookId)?.title || '연결 도서';
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((n) => (
          <div key={n} className="bg-white p-5 rounded-2xl border border-stone-200 animate-pulse">
            <div className="h-4 bg-stone-200 rounded w-1/4 mb-3"></div>
            <div className="h-3 bg-stone-100 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  // 통합 타임라인 아이템 정렬
  const timelineItems: Array<{ type: 'log' | 'insight'; date: string; data: any }> = [];
  if (filterType === 'all' || filterType === 'logs') {
    logs.forEach((l) => timelineItems.push({ type: 'log', date: l.date, data: l }));
  }
  if (filterType === 'all' || filterType === 'insights') {
    insights.forEach((i) => timelineItems.push({ type: 'insight', date: i.date || '', data: i }));
  }

  timelineItems.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  return (
    <div className="space-y-6">
      {/* 필터 탭 */}
      <div className="flex gap-2">
        {[
          { id: 'all', label: `전체 피드 (${timelineItems.length})` },
          { id: 'logs', label: `독서일지만 (${logs.length})` },
          { id: 'insights', label: `문장수집만 (${insights.length})` },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilterType(f.id as any)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition ${
              filterType === f.id
                ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {timelineItems.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-stone-200 text-stone-400 text-sm">
          기록된 독서일지나 문장수집이 없습니다.
        </div>
      ) : (
        <div className="space-y-4">
          {timelineItems.map((item, idx) => {
            if (item.type === 'log') {
              const l: ReadingLog = item.data;
              return (
                <div key={`log-${l.id || idx}`} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
                  <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                        독서일지
                      </span>
                      <span className="font-semibold text-stone-800">
                        《{getBookTitle(l.bookId)}》
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-stone-400 font-mono">{l.page}p</span>
                      <span className="font-semibold text-amber-700">{l.date}</span>
                    </div>
                  </div>
                  <p className="text-sm text-stone-800 whitespace-pre-line leading-relaxed">
                    {l.content}
                  </p>
                </div>
              );
            } else {
              const ins: Insight = item.data;
              return (
                <div key={`ins-${ins.id || idx}`} className="bg-amber-50/40 p-5 rounded-2xl border border-amber-200/60 shadow-sm">
                  <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-800 font-bold">
                        문장수집
                      </span>
                      <span className="font-semibold text-stone-800">
                        《{getBookTitle(ins.bookId)}》
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-stone-400">{ins.page}</span>
                      <span className="font-semibold text-amber-700">{ins.date}</span>
                    </div>
                  </div>
                  <blockquote className="text-sm italic text-stone-900 border-l-2 border-amber-500 pl-3 leading-relaxed whitespace-pre-line">
                    “{ins.quote}”
                  </blockquote>
                </div>
              );
            }
          })}
        </div>
      )}
    </div>
  );
}
