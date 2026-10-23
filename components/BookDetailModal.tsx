'use client';

import React, { useState, useEffect } from 'react';
import { Book, ReadingLog, Insight, Challenge } from '@/lib/types';

interface BookDetailModalProps {
  book: Book;
  challenges: Challenge[];
  currentChallengeId: string;
  onClose: () => void;
  onRefresh: () => void;
}

export default function BookDetailModal({
  book,
  challenges,
  currentChallengeId,
  onClose,
  onRefresh,
}: BookDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'logs' | 'insights' | 'ai'>('logs');
  const [logs, setLogs] = useState<ReadingLog[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // 일지 작성 입력값
  const [logDate, setLogDate] = useState(new Date().toISOString().slice(0, 10));
  const [logPage, setLogPage] = useState<number | ''>('');
  const [logContent, setLogContent] = useState('');
  const [logImageUrl, setLogImageUrl] = useState('');
  const [submittingLog, setSubmittingLog] = useState(false);

  // 문장수집 입력값
  const [insightQuote, setInsightQuote] = useState('');
  const [insightPage, setInsightPage] = useState('');
  const [insightDate, setInsightDate] = useState(new Date().toISOString().slice(0, 10));
  const [insightImageUrl, setInsightImageUrl] = useState('');
  const [submittingInsight, setSubmittingInsight] = useState(false);

  // OCR 상태
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);

  // AI 독서감상문
  const [aiReport, setAiReport] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // 이미지 캔버스 압축 헬퍼
  const compressImage = (file: File, maxWidth = 1200, quality = 0.8): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  // 데이터 로드
  useEffect(() => {
    loadBookItems();
  }, [book.id]);

  const loadBookItems = async () => {
    setLoadingItems(true);
    try {
      const [resLogs, resInsights] = await Promise.all([
        fetch(`/api/logs?bookId=${book.id}`).then((r) => r.json()),
        fetch(`/api/insights?bookId=${book.id}`).then((r) => r.json()),
      ]);
      if (resLogs.logs) setLogs(resLogs.logs);
      if (resInsights.insights) setInsights(resInsights.insights);
    } catch (e) {
      console.error('기록 로드 실패:', e);
    } finally {
      setLoadingItems(false);
    }
  };

  // 독서일지 작성 제출
  const handleSubmitLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logPage || !logContent.trim()) {
      alert('읽은 페이지와 감상 내용을 입력해 주세요.');
      return;
    }

    setSubmittingLog(true);
    try {
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: book.id,
          date: logDate,
          page: Number(logPage),
          content: logContent,
          challengeId: currentChallengeId,
          imageUrl: logImageUrl,
        }),
      });

      if (!res.ok) throw new Error('일지 작성 실패');
      setLogContent('');
      setLogPage('');
      setLogImageUrl('');
      await loadBookItems();
      onRefresh();
    } catch (err: any) {
      alert(err.message || '일지 작성 중 오류 발생');
    } finally {
      setSubmittingLog(false);
    }
  };

  // 문장수집 제출
  const handleSubmitInsight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!insightQuote.trim()) {
      alert('수집할 문장 내용을 입력해 주세요.');
      return;
    }

    setSubmittingInsight(true);
    try {
      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: book.id,
          quote: insightQuote,
          page: insightPage,
          date: insightDate,
          challengeId: currentChallengeId,
          imageUrl: insightImageUrl,
        }),
      });

      if (!res.ok) throw new Error('문장수집 실패');
      setInsightQuote('');
      setInsightPage('');
      setInsightImageUrl('');
      await loadBookItems();
      onRefresh();
    } catch (err: any) {
      alert(err.message || '문장수집 중 오류 발생');
    } finally {
      setSubmittingInsight(false);
    }
  };

  // 사진 업로드 OCR 처리
  const handlePhotoOcr = async (file: File, target: 'log' | 'insight') => {
    setIsOcrProcessing(true);
    try {
      const base64 = await compressImage(file);
      if (!base64) {
        alert('이미지를 읽을 수 없습니다.');
        setIsOcrProcessing(false);
        return;
      }

      if (target === 'log') {
        setLogImageUrl(base64);
      } else {
        setInsightImageUrl(base64);
      }

      const res = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64Data: base64, mimeType: 'image/jpeg' }),
      });
      const data = await res.json();
      const recognizedText = data.text || data.ocrText;

      if (data.ok && recognizedText) {
        if (target === 'log') {
          setLogContent((prev) => (prev ? `${prev}\n\n${recognizedText}` : recognizedText));
        } else {
          setInsightQuote((prev) => (prev ? `${prev}\n\n${recognizedText}` : recognizedText));
        }
      } else {
        alert('글자를 인식하지 못했습니다: ' + (data.error || '알 수 없는 오류'));
      }
    } catch (err: any) {
      alert('OCR 오류: ' + err.message);
    } finally {
      setIsOcrProcessing(false);
    }
  };

  // 개별 도서 AI 감상문 생성
  const handleGenerateAiReport = async () => {
    setIsGeneratingAi(true);
    try {
      const res = await fetch('/api/ai-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookTitle: book.title,
          author: book.author,
          notionPageId: book.id,
          readingLogs: logs.map((l) => ({ readDate: l.date, readPages: l.page, note: l.content })),
          pageLogs: insights.map((i) => ({ page: i.page, notes: i.quote })),
          notes: logs.map((l) => l.content).join('\n'),
        }),
      });
      const data = await res.json();
      const generatedReport = data.report || data.aiReport;
      if (data.ok && generatedReport) {
        setAiReport(generatedReport);
      } else {
        alert('AI 감상문 생성 실패: ' + (data.error || '오류 발생'));
      }
    } catch (err: any) {
      alert('AI 감상문 생성 중 오류: ' + err.message);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // 도서 삭제 (노션 아카이브)
  const handleDeleteBook = async () => {
    if (!confirm(`《${book.title}》 도서를 서재에서 삭제하시겠습니까?\n노션 데이터베이스에서도 아카이브 처리됩니다.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/books?id=${book.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('삭제 실패');
      alert('도서가 삭제되었습니다.');
      onClose();
      onRefresh();
    } catch (err: any) {
      alert('삭제 중 오류: ' + err.message);
    }
  };

  return (
    <div className="modal">
      <div className="modal-backdrop" onClick={onClose}></div>
      <div className="modal-card" style={{ maxWidth: '720px', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
        {/* 상단 헤더 */}
        <div className="section-title-row" style={{ paddingBottom: '14px', borderBottom: '1px solid var(--border)' }}>
          <div className="flex gap-4 items-center">
            {book.cover && (
              <img
                src={book.cover}
                alt={book.title}
                className="w-16 h-24 object-cover rounded-xl shadow-md border border-stone-200"
              />
            )}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold">
                  {book.progressRate || 0}% 완독
                </span>
                <span className="text-xs text-stone-500 font-medium">
                  전체 {book.totalPage || '?'}쪽 ({book.readPages || 0}쪽 읽음)
                </span>
              </div>
              <h2 className="text-lg font-bold text-stone-900 leading-snug mb-0.5">
                {book.title}
              </h2>
              <p className="text-xs text-stone-600">
                {book.author} · {book.publisher}
              </p>
            </div>
          </div>
          <button className="ghost-button" onClick={onClose}>
            닫기
          </button>
        </div>

        {/* 탭 네비게이션 */}
        <div className="library-tabs" style={{ marginTop: '12px', marginBottom: '14px' }}>
          <button
            onClick={() => setActiveTab('logs')}
            className={`lib-tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
          >
            독서일지 ({logs.length})
          </button>
          <button
            onClick={() => setActiveTab('insights')}
            className={`lib-tab-btn ${activeTab === 'insights' ? 'active' : ''}`}
          >
            문장수집 ({insights.length})
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`lib-tab-btn ${activeTab === 'ai' ? 'active' : ''}`}
          >
            AI 감상문
          </button>
        </div>

        {/* 탭 내용 영역 */}
        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
          {/* 1. 독서일지 탭 */}
          {activeTab === 'logs' && (
            <div className="space-y-6">
              {/* 일지 작성 폼 */}
              <form onSubmit={handleSubmitLog} className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-700">새 독서일지 작성</span>
                  <label className="text-xs font-semibold text-amber-700 hover:text-amber-800 cursor-pointer flex items-center gap-1">
                    <span>📷 사진 본문 인식(OCR)</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handlePhotoOcr(e.target.files[0], 'log');
                      }}
                      disabled={isOcrProcessing}
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-stone-500 mb-1">읽은 날짜</label>
                    <input
                      type="date"
                      value={logDate}
                      onChange={(e) => setLogDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-stone-500 mb-1">읽은 페이지 (누적)</label>
                    <input
                      type="number"
                      placeholder={`최대 ${book.totalPage || ''}p`}
                      value={logPage}
                      onChange={(e) => setLogPage(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <textarea
                    rows={3}
                    placeholder="오늘 읽은 내용과 나의 생각을 자유롭게 남겨보세요..."
                    value={logContent}
                    onChange={(e) => setLogContent(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                    required
                  ></textarea>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingLog || isOcrProcessing}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl shadow transition disabled:opacity-50"
                  >
                    {submittingLog ? '저장 중...' : '독서일지 저장'}
                  </button>
                </div>
              </form>

              {/* 일지 목록 */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-stone-600 uppercase tracking-wider">
                  기록된 독서일지
                </h4>
                {logs.length === 0 ? (
                  <p className="text-sm text-stone-400 py-4 text-center">아직 작성된 독서일지가 없습니다.</p>
                ) : (
                  logs.map((l) => (
                    <div key={l.id} className="p-4 bg-white rounded-xl border border-stone-200 shadow-sm">
                      <div className="flex items-center justify-between text-xs text-stone-500 mb-1.5">
                        <span className="font-semibold text-amber-700">{l.date}</span>
                        <span className="bg-stone-100 px-2 py-0.5 rounded text-stone-600 font-mono">
                          {l.page}p
                        </span>
                      </div>
                      <p className="text-sm text-stone-800 whitespace-pre-line leading-relaxed">
                        {l.content}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 2. 문장수집 탭 */}
          {activeTab === 'insights' && (
            <div className="space-y-6">
              <form onSubmit={handleSubmitInsight} className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-700">새 문장 수집하기</span>
                  <label className="text-xs font-semibold text-amber-700 hover:text-amber-800 cursor-pointer flex items-center gap-1">
                    <span>📷 책 본문 촬영(OCR)</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handlePhotoOcr(e.target.files[0], 'insight');
                      }}
                      disabled={isOcrProcessing}
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-stone-500 mb-1">페이지 번호</label>
                    <input
                      type="text"
                      placeholder="예: p.124"
                      value={insightPage}
                      onChange={(e) => setInsightPage(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-stone-500 mb-1">수집 날짜</label>
                    <input
                      type="date"
                      value={insightDate}
                      onChange={(e) => setInsightDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <textarea
                    rows={4}
                    placeholder="기억하고 싶은 인상 깊은 문장과 나의 단상을 입력하세요..."
                    value={insightQuote}
                    onChange={(e) => setInsightQuote(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                    required
                  ></textarea>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingInsight || isOcrProcessing}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl shadow transition disabled:opacity-50"
                  >
                    {submittingInsight ? '저장 중...' : '문장 저장'}
                  </button>
                </div>
              </form>

              {/* 문장 목록 */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-stone-600 uppercase tracking-wider">
                  수집된 문장들
                </h4>
                {insights.length === 0 ? (
                  <p className="text-sm text-stone-400 py-4 text-center">수집된 문장이 없습니다.</p>
                ) : (
                  insights.map((ins) => (
                    <div key={ins.id} className="p-4 bg-amber-50/50 rounded-xl border border-amber-200/60 shadow-sm">
                      <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
                        <span className="font-semibold text-amber-800">{ins.page ? `${ins.page}` : '페이지 미정'}</span>
                        <span>{ins.date}</span>
                      </div>
                      <blockquote className="text-sm text-stone-800 italic border-l-2 border-amber-500 pl-3 leading-relaxed whitespace-pre-line">
                        {ins.quote}
                      </blockquote>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 3. AI 독서감상문 탭 */}
          {activeTab === 'ai' && (
            <div className="space-y-4">
              <div className="p-4 bg-orange-50 rounded-2xl border border-orange-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-orange-950">Gemini 2.5 AI 독서감상문</h4>
                  <p className="text-xs text-orange-800 mt-0.5">
                    내가 작성한 일지 메모들을 종합하여 완성도 높은 감상문 초안을 집필합니다.
                  </p>
                </div>
                <button
                  onClick={handleGenerateAiReport}
                  disabled={isGeneratingAi}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow transition disabled:opacity-50"
                >
                  {isGeneratingAi ? '생성 중...' : '✨ 감상문 생성'}
                </button>
              </div>

              {aiReport ? (
                <div className="p-5 bg-white rounded-2xl border border-stone-200 shadow-sm">
                  <div className="text-sm text-stone-800 whitespace-pre-line leading-relaxed">
                    {aiReport}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-stone-400 text-sm">
                  ‘감상문 생성’ 버튼을 누르면 AI가 맞춤 감상문을 작성합니다.
                </div>
              )}
            </div>
          )}
        </div>

        {/* 하단 푸터 (도서 삭제 등) */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
          <button
            onClick={handleDeleteBook}
            className="text-xs text-red-600 hover:text-red-700 hover:underline font-medium"
          >
            🗑️ 도서 삭제
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 transition"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
