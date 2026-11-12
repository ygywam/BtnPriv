'use client';

import React from 'react';
import { Book, Challenge } from '@/lib/types';

interface ChallengeTabProps {
  challenges: Challenge[];
  selectedChallengeId: string;
  books: Book[];
  rollingOver: boolean;
  onSelectBook: (book: Book) => void;
  onOpenCalendarForChallenge: (challengeId: string) => void;
  onOpenPeriodForChallenge: (challengeId: string) => void;
  onOpenReportForChallenge: (challengeId: string) => void;
  onBatchRollover: (fromChallenge: Challenge) => void;
}

/**
 * 챌린지 탭: 역대 및 현재 독서 챌린지를 카드 형식으로 나열
 */
export default function ChallengeTab({
  challenges,
  selectedChallengeId,
  books,
  rollingOver,
  onSelectBook,
  onOpenCalendarForChallenge,
  onOpenPeriodForChallenge,
  onOpenReportForChallenge,
  onBatchRollover,
}: ChallengeTabProps) {
  const latestChallenge = challenges[0] || null;

  return (
    <section className="tab-section">
      <div className="panel tab-header-card">
        <h2>🏆 독서 챌린지 목록</h2>
        <p className="subtitle">
          월별·기간별 챌린지 달성 현황과 참여 도서를 카드로 한눈에 확인하세요.
        </p>
      </div>

      {challenges.length === 0 ? (
        <div className="panel text-center py-12">
          <p className="text-sm font-bold text-stone-700">등록된 챌린지가 없습니다</p>
          <p className="text-xs text-stone-500 mt-1">도서를 등록하면 해당 월 챌린지가 자동으로 생성됩니다.</p>
        </div>
      ) : (
        <div className="challenge-card-grid">
          {challenges.map((ch, idx) => {
            const chBooks = books.filter((b) => b.challengeIds.includes(ch.id));
            const doneBooks = chBooks.filter((b) => (b.progressRate || 0) >= 100);
            const incompleteBooks = chBooks.filter((b) => (b.progressRate || 0) < 100);
            const rate = chBooks.length > 0 ? Math.round((doneBooks.length / chBooks.length) * 100) : 0;
            const isLatest = idx === 0;
            const isSelected = ch.id === selectedChallengeId;

            return (
              <article
                key={ch.id}
                className={`panel challenge-item-card ${isSelected ? 'is-active' : ''}`}
              >
                <div className="ch-card-head">
                  <div className="min-w-0 flex-1">
                    <div className="ch-badge-row">
                      <span className={`ch-status-pill ${isLatest ? 'is-latest' : ''}`}>
                        {isLatest ? '진행 중 · 최신' : '지난 챌린지'}
                      </span>
                      {ch.status && <span className="ch-notion-status">{ch.status}</span>}
                      <span className="ch-period-text">
                        {ch.startDate || '-'} ~ {ch.endDate || '-'} ({ch.targetDays}일)
                      </span>
                    </div>
                    <h3 className="ch-card-title">{ch.title}</h3>
                  </div>

                  <div className="ch-goal-ratio">
                    <strong>{doneBooks.length}</strong>/{chBooks.length}권
                  </div>
                </div>

                {/* 완독 진행률 바 */}
                <div className="ch-progress-wrap">
                  <div className="ch-progress-meta">
                    <span>챌린지 도서 완독률</span>
                    <strong>{rate}%</strong>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${rate}%`,
                        background:
                          rate >= 100
                            ? '#10b981'
                            : 'linear-gradient(90deg, var(--accent) 0%, var(--accent-dark) 100%)',
                      }}
                    />
                  </div>
                </div>

                {/* 참여 도서 미니 표지 리스트 */}
                {chBooks.length > 0 ? (
                  <div className="ch-books-strip">
                    {chBooks.map((b) => {
                      const done = (b.progressRate || 0) >= 100;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          className="ch-mini-book"
                          onClick={() => onSelectBook(b)}
                          title={`${b.title} (${b.progressRate || 0}%)`}
                        >
                          <div className="ch-mini-cover">
                            {b.cover ? (
                              <img src={b.cover} alt={b.title} />
                            ) : (
                              <span>{b.title.slice(0, 6)}</span>
                            )}
                            {done && <span className="ch-mini-done">✓</span>}
                          </div>
                          <span className="ch-mini-title">{b.title}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="ch-no-books">이 챌린지에 아직 등록된 도서가 없습니다.</p>
                )}

                {/* 노션 잔디 현황 */}
                {ch.progressText && (
                  <div className="challenge-grass-box ch-grass-compact">
                    <div className="challenge-grass-text">{ch.progressText}</div>
                  </div>
                )}

                {/* 과거 챌린지 미완독 도서 일괄 이월 배너 */}
                {latestChallenge && !isLatest && incompleteBooks.length > 0 && (
                  <div className="ch-rollover-box">
                    <span>
                      💡 미완독 도서 {incompleteBooks.length}권 ({incompleteBooks.map((b) => `『${b.title}』`).join(', ')})
                    </span>
                    <button
                      type="button"
                      onClick={() => onBatchRollover(ch)}
                      disabled={rollingOver}
                      className="ch-rollover-btn"
                    >
                      {rollingOver ? '이월 중...' : '⏩ 최신 챌린지로 이월'}
                    </button>
                  </div>
                )}

                {/* 카드 액션 버튼 */}
                <div className="ch-card-actions">
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => onOpenCalendarForChallenge(ch.id)}
                  >
                    📅 캘린더 보기
                  </button>
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => onOpenPeriodForChallenge(ch.id)}
                  >
                    ⚙️ 기간 조절
                  </button>
                  <button
                    type="button"
                    className="ch-report-btn"
                    onClick={() => onOpenReportForChallenge(ch.id)}
                  >
                    ✨ AI 리포트
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
