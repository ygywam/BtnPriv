'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Book, Challenge, Insight, ReadingLog } from '@/lib/types';

interface ChallengeCalendarCardProps {
  challenge: Challenge | null;
  challenges: Challenge[];
  onSelectChallenge: (id: string) => void;
  books: Book[];
  logs: ReadingLog[];
  insights: Insight[];
  onOpenPeriodModal: () => void;
  onOpenReportModal: () => void;
  onSelectBook: (book: Book) => void;
}

/** 다양한 날짜 문자열(YYYY-MM-DD, YYYY.MM.DD 등)을 YYYY-MM-DD로 정규화 */
function normalizeDateStr(raw?: string): string {
  if (!raw) return '';
  const cleaned = raw.trim().replace(/\./g, '-').slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(cleaned) ? cleaned : '';
}

/** YYYY-MM-DD 문자열에 days를 더한 날짜 반환 (로컬 달력 계산용 UTC 기준) */
function addDaysStr(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

/**
 * 챌린지 기간 기반 월별 독서 캘린더 + 등록 권수 목표 원형 게이지 카드
 */
export default function ChallengeCalendarCard({
  challenge,
  challenges,
  onSelectChallenge,
  books,
  logs,
  insights,
  onOpenPeriodModal,
  onOpenReportModal,
  onSelectBook,
}: ChallengeCalendarCardProps) {
  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  // 챌린지 시작일 및 종료일 계산
  const { periodStart, periodEnd } = useMemo(() => {
    if (!challenge?.startDate) {
      const ym = todayStr.slice(0, 7);
      const [y, m] = ym.split('-').map(Number);
      const lastDay = new Date(y, m, 0).getDate();
      return {
        periodStart: `${ym}-01`,
        periodEnd: `${ym}-${String(lastDay).padStart(2, '0')}`,
      };
    }
    const start = normalizeDateStr(challenge.startDate) || todayStr;
    const end = normalizeDateStr(challenge.endDate) || addDaysStr(start, Math.max(1, challenge.targetDays || 30) - 1);
    return { periodStart: start, periodEnd: end };
  }, [challenge, todayStr]);

  // 캘린더에 표시할 연-월 (YYYY-MM) 상태
  const [viewYearMonth, setViewYearMonth] = useState<string>(todayStr.slice(0, 7));
  const [selectedDate, setSelectedDate] = useState<string>('');

  // 챌린지가 바뀌면 해당 챌린지 기간에 맞는 월(오늘이 포함되면 오늘 월, 아니면 시작 월)로 자동 이동
  useEffect(() => {
    if (todayStr >= periodStart && todayStr <= periodEnd) {
      setViewYearMonth(todayStr.slice(0, 7));
    } else {
      setViewYearMonth(periodStart.slice(0, 7));
    }
    setSelectedDate('');
  }, [challenge?.id, periodStart, periodEnd, todayStr]);

  // 챌린지 소속 도서 및 완독 통계
  const challengeBooks = useMemo(() => {
    if (!challenge) return [];
    return books.filter((b) => b.challengeIds.includes(challenge.id));
  }, [books, challenge]);

  const completedCount = useMemo(
    () => challengeBooks.filter((b) => (b.progressRate || 0) >= 100).length,
    [challengeBooks]
  );
  const totalGoalCount = challengeBooks.length;

  // 챌린지 기간 내 독서일지 및 문장수집 필터링
  const { periodLogs, periodInsights, recordsByDate } = useMemo(() => {
    const map: Record<string, { logs: ReadingLog[]; insights: Insight[] }> = {};
    const pLogs: ReadingLog[] = [];
    const pInsights: Insight[] = [];

    const inScope = (dateStr: string, relChallengeId?: string) => {
      if (!dateStr) return false;
      if (dateStr >= periodStart && dateStr <= periodEnd) return true;
      return Boolean(challenge?.id && relChallengeId === challenge.id);
    };

    logs.forEach((l) => {
      const d = normalizeDateStr(l.date);
      if (!d) return;
      if (!map[d]) map[d] = { logs: [], insights: [] };
      map[d].logs.push(l);
      if (inScope(d, l.challengeId)) pLogs.push(l);
    });

    insights.forEach((ins) => {
      const d = normalizeDateStr(ins.date);
      if (!d) return;
      if (!map[d]) map[d] = { logs: [], insights: [] };
      map[d].insights.push(ins);
      if (inScope(d, ins.challengeId)) pInsights.push(ins);
    });

    return { periodLogs: pLogs, periodInsights: pInsights, recordsByDate: map };
  }, [logs, insights, periodStart, periodEnd, challenge?.id]);

  // 상단 요약 지표: 읽은 일수, 읽은 페이지, 완독 권수
  const summaryStats = useMemo(() => {
    const activeDates = new Set<string>();
    periodLogs.forEach((l) => {
      const d = normalizeDateStr(l.date);
      if (d) activeDates.add(d);
    });
    periodInsights.forEach((i) => {
      const d = normalizeDateStr(i.date);
      if (d) activeDates.add(d);
    });

    // 책별 기간 내 최대 누적 페이지 - 기간 이전 최대 누적 페이지
    const maxInPeriodByBook: Record<string, number> = {};
    const maxBeforeByBook: Record<string, number> = {};
    periodLogs.forEach((l) => {
      const key = l.bookId || l.id;
      maxInPeriodByBook[key] = Math.max(maxInPeriodByBook[key] || 0, l.page || 0);
    });
    logs.forEach((l) => {
      const d = normalizeDateStr(l.date);
      if (d && d < periodStart && l.bookId && maxInPeriodByBook[l.bookId] !== undefined) {
        maxBeforeByBook[l.bookId] = Math.max(maxBeforeByBook[l.bookId] || 0, l.page || 0);
      }
    });

    let totalPages = 0;
    Object.entries(maxInPeriodByBook).forEach(([bookId, maxP]) => {
      const before = maxBeforeByBook[bookId] || 0;
      totalPages += Math.max(0, maxP - before);
    });

    return {
      readDays: activeDates.size,
      totalPages,
      completedBooks: completedCount,
    };
  }, [periodLogs, periodInsights, logs, periodStart, completedCount]);

  // 달력 그리드 생성 (월요일 시작: M T W T F S S)
  const calendarCells = useMemo(() => {
    const [y, m] = viewYearMonth.split('-').map(Number);
    if (!y || !m) return [];
    const firstDayOfWeek = (new Date(y, m - 1, 1).getDay() + 6) % 7; // 월=0 .. 일=6
    const daysInMonth = new Date(y, m, 0).getDate();
    const cells: Array<{ day: number; dateStr: string } | null> = [];

    for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ day: d, dateStr });
    }
    return cells;
  }, [viewYearMonth]);

  const shiftMonth = (delta: number) => {
    const [y, m] = viewYearMonth.split('-').map(Number);
    const dt = new Date(y, m - 1 + delta, 1);
    setViewYearMonth(`${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`);
    setSelectedDate('');
  };

  // 원형 도넛 차트 계산
  const ratio = totalGoalCount > 0 ? Math.min(1, completedCount / totalGoalCount) : 0;
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - ratio);

  const displayMonthNum = Number(viewYearMonth.split('-')[1] || 1);
  const selectedDayRecords = selectedDate ? recordsByDate[selectedDate] : undefined;

  return (
    <section className="panel cal-panel" data-tour="calendar">
      {/* 카드 상단: 월별 타이틀 + 챌린지 선택 + AI 리포트 */}
      <div className="cal-top-bar">
        <div className="cal-title-wrap">
          <span className="cal-paw-icon" aria-hidden="true">🐾</span>
          <h2 className="cal-title">{displayMonthNum}월 독서기록</h2>
          <div className="cal-month-nav">
            <button type="button" className="cal-nav-arrow" onClick={() => shiftMonth(-1)} aria-label="이전 달">‹</button>
            <span className="cal-ym-label">{viewYearMonth.replace('-', '.')}</span>
            <button type="button" className="cal-nav-arrow" onClick={() => shiftMonth(1)} aria-label="다음 달">›</button>
          </div>
        </div>

        <div className="cal-top-actions">
          {challenges.length > 0 && (
            <select
              value={challenge?.id || ''}
              onChange={(e) => onSelectChallenge(e.target.value)}
              className="cal-challenge-select"
              aria-label="챌린지 선택"
            >
              {challenges.map((c, idx) => (
                <option key={c.id} value={c.id}>
                  {c.title}{idx === 0 ? ' (최신)' : ''}
                </option>
              ))}
            </select>
          )}
          <button type="button" className="cal-report-link" onClick={onOpenReportModal}>
            ✨ AI 리포트 ›
          </button>
        </div>
      </div>

      {/* 본문 2단: 좌측 캘린더 + 우측 이번 달 목표 */}
      <div className="cal-body-grid">
        {/* 좌측: 챌린지 기간 캘린더 */}
        <div className="cal-left-col">
          <div className="cal-summary-row">
            <span><strong>{summaryStats.readDays}일</strong> 읽음</span>
            <span className="cal-divider">|</span>
            <span><strong>{summaryStats.totalPages}</strong>페이지</span>
            <span className="cal-divider">|</span>
            <span><strong>{summaryStats.completedBooks}권</strong> 완독</span>
          </div>

          <div className="cal-weekdays">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((w, i) => (
              <span key={i} className={i === 6 ? 'is-sun' : ''}>{w}</span>
            ))}
          </div>

          <div className="cal-days-grid">
            {calendarCells.map((cell, idx) => {
              if (!cell) return <div key={`empty-${idx}`} className="cal-day-empty" />;
              const rec = recordsByDate[cell.dateStr];
              const hasActivity = Boolean(rec && (rec.logs.length > 0 || rec.insights.length > 0));
              const isToday = cell.dateStr === todayStr;
              const isInPeriod = cell.dateStr >= periodStart && cell.dateStr <= periodEnd;
              const isSelected = cell.dateStr === selectedDate;

              return (
                <button
                  key={cell.dateStr}
                  type="button"
                  onClick={() => setSelectedDate(isSelected ? '' : cell.dateStr)}
                  className={[
                    'cal-day-cell',
                    hasActivity ? 'has-activity' : '',
                    isToday ? 'is-today' : '',
                    !isInPeriod ? 'out-period' : '',
                    isSelected ? 'is-selected' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  title={`${cell.dateStr}${hasActivity ? ` (기록 ${(rec?.logs.length || 0) + (rec?.insights.length || 0)}건)` : ''}`}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          {challenge && (
            <div className="cal-period-caption">
              기간: {periodStart} ~ {periodEnd} ({challenge.targetDays}일)
            </div>
          )}
        </div>

        {/* 우측: 이번 챌린지 목표 도넛 차트 */}
        <div className="cal-right-col">
          <div className="cal-goal-header">
            <span className="cal-goal-title">🎯 이번 달 목표</span>
            <button type="button" className="cal-goal-setting-btn" onClick={onOpenPeriodModal}>
              설정
            </button>
          </div>

          <div className="cal-donut-wrap">
            <svg viewBox="0 0 88 88" className="cal-donut-svg">
              <circle cx="44" cy="44" r={radius} className="cal-donut-track" />
              <circle
                cx="44"
                cy="44"
                r={radius}
                className="cal-donut-progress"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                transform="rotate(-90 44 44)"
              />
            </svg>
            <div className="cal-donut-center">
              <strong>{completedCount}</strong>
              <span>/{totalGoalCount}</span>
            </div>
          </div>

          <p className="cal-goal-caption">
            {totalGoalCount === 0
              ? '챌린지 도서를 추가해 보세요'
              : completedCount >= totalGoalCount
                ? '목표를 모두 달성했어요! 🎉'
                : `목표까지 ${totalGoalCount - completedCount}권 남았어요`}
          </p>
        </div>
      </div>

      {/* 선택한 날짜의 기록 미니 프리뷰 */}
      {selectedDate && (
        <div className="cal-day-detail">
          <div className="cal-day-detail-head">
            <span>📅 {selectedDate} 독서 기록</span>
            <button type="button" onClick={() => setSelectedDate('')}>닫기</button>
          </div>
          {!selectedDayRecords || (selectedDayRecords.logs.length === 0 && selectedDayRecords.insights.length === 0) ? (
            <p className="cal-day-empty-msg">이 날에는 남긴 독서 기록이 없습니다.</p>
          ) : (
            <div className="cal-day-detail-list">
              {selectedDayRecords.logs.map((l) => {
                const book = books.find((b) => b.id === l.bookId);
                return (
                  <div
                    key={l.id}
                    className="cal-day-detail-item"
                    onClick={() => book && onSelectBook(book)}
                  >
                    <span className="cal-tag-log">일지 · {l.page}p</span>
                    <strong className="truncate">{book?.title || '도서'}</strong>
                    <p className="line-clamp-2">{l.content}</p>
                  </div>
                );
              })}
              {selectedDayRecords.insights.map((ins) => {
                const book = books.find((b) => b.id === ins.bookId);
                return (
                  <div
                    key={ins.id}
                    className="cal-day-detail-item is-insight"
                    onClick={() => book && onSelectBook(book)}
                  >
                    <span className="cal-tag-insight">문장 · {ins.page || '-'}</span>
                    <strong className="truncate">{book?.title || '도서'}</strong>
                    <p className="line-clamp-2">“{ins.quote}”</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
