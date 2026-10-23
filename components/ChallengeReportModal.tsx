'use client';

import React, { useState, useEffect } from 'react';
import { Challenge } from '@/lib/types';

interface ChallengeReportModalProps {
  challenge: Challenge;
  onClose: () => void;
}

export default function ChallengeReportModal({
  challenge,
  onClose,
}: ChallengeReportModalProps) {
  const [activeTab, setActiveTab] = useState<'report' | 'blog'>('report');
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [reportResult, setReportResult] = useState<any | null>(null);
  const [blogResult, setBlogResult] = useState<any | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // 모달 오픈 시 노션에 기 저장된 리포트/블로그 글 확인 및 자동 복원
  useEffect(() => {
    fetchExistingReport();
  }, [challenge.id]);

  const fetchExistingReport = async () => {
    setLoadingExisting(true);
    try {
      const res = await fetch(`/api/challenge-report?challengeId=${challenge.id}`);
      const data = await res.json();
      if (res.ok && data.report && data.blog) {
        setReportResult(data.report);
        setBlogResult(data.blog);
        if (data.savedAt) {
          const dateStr = new Date(data.savedAt).toLocaleDateString('ko-KR', {
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
          setStatusMessage(`📂 노션에 저장되어 있는 독서 리포트입니다. (${dateStr} 저장본)`);
        } else {
          setStatusMessage('📂 노션 페이지 본문에서 불러온 기존 독서 리포트입니다.');
        }
      }
    } catch (e) {
      console.warn('기존 리포트 조회 오류:', e);
    } finally {
      setLoadingExisting(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setStatusMessage('노션에서 도서, 일지, 문장수집을 수집하여 Gemini AI로 분석 및 작성 중...');
    try {
      const res = await fetch('/api/challenge-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId: challenge.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '리포트 생성 실패');
      }

      setReportResult(data.report);
      setBlogResult(data.blog);
      setStatusMessage('✨ 노션 챌린지 페이지 본문에 접이식 토글 블록으로 안전하게 저장되었습니다!');
    } catch (err: any) {
      alert('오류 발생: ' + err.message);
      setStatusMessage('');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal">
      <div className="modal-backdrop" onClick={onClose}></div>
      <div className="modal-card" style={{ maxWidth: '740px', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
        {/* 상단 바 */}
        <div className="section-title-row" style={{ paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-orange-600 text-white">
                Gemini 2.5 AI
              </span>
              <span className="text-xs text-stone-500 font-medium">
                {challenge.title}
              </span>
            </div>
            <h2>✨ 월간 독서 리포트 & 블로그 글</h2>
          </div>
          <button className="ghost-button" onClick={onClose}>
            닫기
          </button>
        </div>

        {/* 안내 및 생성 트리거 */}
        <div className="p-5 border-b border-stone-200 bg-amber-50/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-xs text-stone-700 leading-relaxed">
              기존 8월 챌린지와 동일한 양식으로 <strong>[독서 리포트]</strong>, <strong>[추천도서]</strong>, <strong>[블로그 완성글]</strong>을 원클릭 생성하고,
              <br />
              노션 챌린지 페이지 본문 안에 접이식 토글 블록으로 즉시 영구 저장합니다.
            </div>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-sm font-bold rounded-xl shadow-md transition disabled:opacity-50 whitespace-nowrap"
            >
              {isGenerating ? 'AI 생성 중 (약 15초)...' : '✨ 리포트 생성 및 노션 저장'}
            </button>
          </div>
          {statusMessage && (
            <div className="mt-3 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
              {statusMessage}
            </div>
          )}
        </div>

        {/* 탭 네비게이션 */}
        {reportResult && blogResult && (
          <div className="flex border-b border-stone-200 px-6 bg-white">
            <button
              onClick={() => setActiveTab('report')}
              className={`py-3 px-4 font-semibold text-sm border-b-2 transition ${
                activeTab === 'report'
                  ? 'border-amber-600 text-amber-700'
                  : 'border-transparent text-stone-500 hover:text-stone-700'
              }`}
            >
              📊 독서 리포트 & 추천도서
            </button>
            <button
              onClick={() => setActiveTab('blog')}
              className={`py-3 px-4 font-semibold text-sm border-b-2 transition ${
                activeTab === 'blog'
                  ? 'border-amber-600 text-amber-700'
                  : 'border-transparent text-stone-500 hover:text-stone-700'
              }`}
            >
              ✍️ 블로그 완성 에세이
            </button>
          </div>
        )}

        {/* 본문 뷰어 */}
        <div className="p-6 overflow-y-auto flex-1">
          {loadingExisting ? (
            <div className="text-center py-20 text-stone-400">
              <div className="text-3xl mb-3 animate-spin">⏳</div>
              <p className="text-sm">노션에 저장된 독서 리포트를 확인하고 있습니다...</p>
            </div>
          ) : !reportResult ? (
            <div className="text-center py-20 text-stone-400">
              <div className="text-4xl mb-3">📝</div>
              <p className="text-sm">
                상단의 <strong>‘리포트 생성 및 노션 저장’</strong> 버튼을 누르면 AI가 집필을 시작합니다.
              </p>
            </div>
          ) : activeTab === 'report' ? (
            <div className="space-y-6">
              {/* 총평 */}
              <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200">
                <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                  챌린지 총평
                </h4>
                <p className="text-sm text-stone-800 leading-relaxed font-medium">
                  {reportResult.summary}
                </p>
                <div className="mt-3 text-xs font-bold text-amber-800">
                  📊 {reportResult.statsText}
                </div>
              </div>

              {/* 인사이트 셀렉션 */}
              <div>
                <h4 className="text-sm font-bold text-stone-800 mb-3">
                  1 · 인사이트 셀렉션 — 당신이 쓴 문장
                </h4>
                <div className="space-y-4">
                  {reportResult.insightsSelection?.map((item: any, i: number) => (
                    <div key={i} className="p-4 bg-amber-50/40 rounded-xl border border-amber-200/70">
                      <blockquote className="text-sm italic text-stone-900 border-l-2 border-amber-600 pl-3 mb-2 leading-relaxed">
                        “{item.quote}”
                      </blockquote>
                      <p className="text-xs text-stone-500 font-medium mb-1">
                        — {item.bookInfo}
                      </p>
                      <p className="text-xs text-stone-700 leading-relaxed">
                        {item.commentary}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 키워드와 성찰 */}
              <div className="p-5 bg-orange-50/40 rounded-2xl border border-orange-200">
                <h4 className="text-sm font-bold text-orange-950 mb-2">
                  2 · 독서 키워드와 성찰
                </h4>
                <p className="text-sm text-stone-800 leading-relaxed">
                  {reportResult.reflection}
                </p>
              </div>

              {/* 추천도서 (3~4권) */}
              {reportResult.recommendedBooks && reportResult.recommendedBooks.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-stone-800 mb-3 flex items-center gap-1.5">
                    <span>📚</span> 3 · 추천도서 — 다음 독서를 위한 제안
                  </h4>
                  <div className="space-y-3">
                    {reportResult.recommendedBooks.map((book: any, idx: number) => (
                      <div key={idx} className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200/80 shadow-sm">
                        <div className="flex items-baseline gap-2 mb-2">
                          <span className="font-bold text-sm text-stone-900">📖 {book.title}</span>
                          {book.author && (
                            <span className="text-xs text-stone-500 font-medium">({book.author})</span>
                          )}
                        </div>
                        {book.description && (
                          <p className="text-xs text-stone-700 leading-relaxed mb-2">
                            <strong className="text-stone-900">내용:</strong> {book.description}
                          </p>
                        )}
                        {book.reason && (
                          <div className="p-2.5 bg-white/90 rounded-lg text-xs text-emerald-950 leading-relaxed border border-emerald-100">
                            <strong>💡 추천 이유:</strong> {book.reason}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* 후킹 제목 후보 */}
              <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-stone-600 uppercase tracking-wider">
                    후킹 제목 후보 (4)
                  </h4>
                  <button
                    onClick={() => copyToClipboard(blogResult.hookingTitles.join('\n'))}
                    className="text-xs text-amber-700 hover:underline font-medium"
                  >
                    제목 복사
                  </button>
                </div>
                <ul className="list-disc pl-5 space-y-1.5 text-sm text-stone-800 font-medium">
                  {blogResult.hookingTitles?.map((t: string, i: number) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </div>

              {/* 본문 완성글 */}
              <div className="p-6 bg-white rounded-2xl border border-stone-200 shadow-sm">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
                  <h3 className="text-lg font-bold text-stone-900">
                    {blogResult.mainTitle}
                  </h3>
                  <button
                    onClick={() => copyToClipboard(`${blogResult.mainTitle}\n\n${blogResult.essayContent}`)}
                    className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg transition"
                  >
                    {copied ? '✓ 복사완료' : '전체 글 복사'}
                  </button>
                </div>
                <div className="text-sm text-stone-800 whitespace-pre-line leading-relaxed font-serif">
                  {blogResult.essayContent}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 하단 닫기 */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 text-sm font-semibold rounded-xl transition"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
