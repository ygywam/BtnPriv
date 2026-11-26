'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  const [activeTab, setActiveTab] = useState<'timeline' | 'ai'>('timeline');
  const [activeForm, setActiveForm] = useState<'none' | 'log' | 'insight'>('none');
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

  // 수정 중인 일지/문장수집 ID (null이면 신규 작성)
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editingInsightId, setEditingInsightId] = useState<string | null>(null);

  // 입력칸 자동 높이 조절 ref
  const formTopRef = useRef<HTMLDivElement>(null);
  const logTextareaRef = useRef<HTMLTextAreaElement>(null);
  const insightTextareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustTextareaHeight = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = 'auto';
    const maxHeight = typeof window !== 'undefined' ? Math.min(window.innerHeight * 0.45, 420) : 360;
    const nextHeight = Math.min(el.scrollHeight, maxHeight);
    el.style.height = `${nextHeight}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden';
  };

  useEffect(() => {
    if (activeForm === 'log') {
      adjustTextareaHeight(logTextareaRef.current);
    }
  }, [logContent, activeForm]);

  useEffect(() => {
    if (activeForm === 'insight') {
      adjustTextareaHeight(insightTextareaRef.current);
    }
  }, [insightQuote, activeForm]);

  // AI 독서감상문
  const [aiReport, setAiReport] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // 도서 소속 챌린지 변경 상태
  const [selectedBookChallengeId, setSelectedBookChallengeId] = useState<string>(
    book.challengeIds?.[0] || currentChallengeId || challenges[0]?.id || ''
  );
  const [updatingChallenge, setUpdatingChallenge] = useState(false);
  const latestChallenge = challenges[0] || null;

  // 도서 정보 확인/수정 패널 상태
  const [showBookInfoPanel, setShowBookInfoPanel] = useState(false);
  const [editBookTitle, setEditBookTitle] = useState(book.title || '');
  const [editBookAuthor, setEditBookAuthor] = useState(book.author || '');
  const [editBookPublisher, setEditBookPublisher] = useState(book.publisher || '');
  const [editBookTotalPage, setEditBookTotalPage] = useState<number | ''>(book.totalPage || '');
  const [editBookCover, setEditBookCover] = useState(book.cover || '');
  const [editBookDescription, setEditBookDescription] = useState(book.description || '');
  const [savingBookInfo, setSavingBookInfo] = useState(false);

  useEffect(() => {
    setEditBookTitle(book.title || '');
    setEditBookAuthor(book.author || '');
    setEditBookPublisher(book.publisher || '');
    setEditBookTotalPage(book.totalPage || '');
    setEditBookCover(book.cover || '');
    setEditBookDescription(book.description || '');
  }, [book]);

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
      const [resLogs, resInsights, resAi] = await Promise.all([
        fetch(`/api/logs?bookId=${book.id}`).then((r) => r.json()),
        fetch(`/api/insights?bookId=${book.id}`).then((r) => r.json()),
        fetch(`/api/ai-report?bookId=${book.id}`).then((r) => r.json()),
      ]);
      if (resLogs.logs) setLogs(resLogs.logs);
      if (resInsights.insights) setInsights(resInsights.insights);
      if (resAi && resAi.ok && resAi.aiReport) setAiReport(resAi.aiReport);
    } catch (e) {
      console.error('기록 로드 실패:', e);
    } finally {
      setLoadingItems(false);
    }
  };

  const resetLogForm = () => {
    setEditingLogId(null);
    setLogDate(new Date().toISOString().slice(0, 10));
    setLogPage('');
    setLogContent('');
    setLogImageUrl('');
  };

  const resetInsightForm = () => {
    setEditingInsightId(null);
    setInsightQuote('');
    setInsightPage('');
    setInsightDate(new Date().toISOString().slice(0, 10));
    setInsightImageUrl('');
  };

  const handleStartEditLog = (item: { id: string; date: string; page: number; content: string }) => {
    setEditingInsightId(null);
    setEditingLogId(item.id);
    setLogDate(item.date || new Date().toISOString().slice(0, 10));
    setLogPage(item.page ?? '');
    setLogContent(item.content || '');
    setLogImageUrl('');
    setActiveForm('log');
    formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const handleStartEditInsight = (item: { id: string; date: string; page: string; content: string }) => {
    setEditingLogId(null);
    setEditingInsightId(item.id);
    setInsightDate(item.date || new Date().toISOString().slice(0, 10));
    setInsightPage(item.page || '');
    setInsightQuote(item.content || '');
    setInsightImageUrl('');
    setActiveForm('insight');
    formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  // 독서일지 작성/수정 제출
  const handleSubmitLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logPage || !logContent.trim()) {
      alert('읽은 페이지와 감상 내용을 입력해 주세요.');
      return;
    }

    setSubmittingLog(true);
    try {
      const isEdit = Boolean(editingLogId);
      const res = await fetch('/api/logs', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isEdit
            ? {
                id: editingLogId,
                date: logDate,
                page: Number(logPage),
                content: logContent,
              }
            : {
                bookId: book.id,
                date: logDate,
                page: Number(logPage),
                content: logContent,
                challengeId: currentChallengeId,
                imageUrl: logImageUrl,
              }
        ),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || (isEdit ? '일지 수정 실패' : '일지 작성 실패'));
      }
      resetLogForm();
      setActiveForm('none');
      await loadBookItems();
      onRefresh();
    } catch (err: any) {
      alert(err.message || '일지 저장 중 오류 발생');
    } finally {
      setSubmittingLog(false);
    }
  };

  // 독서일지 삭제 (노션 아카이브)
  const handleDeleteLog = async (logId: string) => {
    if (!confirm('이 독서일지를 삭제하시겠습니까?\n노션 데이터베이스에서도 삭제(아카이브)됩니다.')) return;
    try {
      const res = await fetch(`/api/logs?id=${logId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('삭제 실패');
      setLogs((prev) => prev.filter((l) => l.id !== logId));
      onRefresh();
    } catch (err: any) {
      alert('일지 삭제 오류: ' + err.message);
    }
  };

  // 문장수집 작성/수정 제출
  const handleSubmitInsight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!insightQuote.trim()) {
      alert('수집할 문장 내용을 입력해 주세요.');
      return;
    }

    setSubmittingInsight(true);
    try {
      const isEdit = Boolean(editingInsightId);
      const res = await fetch('/api/insights', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isEdit
            ? {
                id: editingInsightId,
                quote: insightQuote,
                page: insightPage,
                date: insightDate,
              }
            : {
                bookId: book.id,
                quote: insightQuote,
                page: insightPage,
                date: insightDate,
                challengeId: currentChallengeId,
                imageUrl: insightImageUrl,
              }
        ),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || (isEdit ? '문장수집 수정 실패' : '문장수집 실패'));
      }
      resetInsightForm();
      setActiveForm('none');
      await loadBookItems();
      onRefresh();
    } catch (err: any) {
      alert(err.message || '문장수집 저장 중 오류 발생');
    } finally {
      setSubmittingInsight(false);
    }
  };

  // 문장수집 삭제 (노션 아카이브)
  const handleDeleteInsight = async (insightId: string) => {
    if (!confirm('이 문장 수집을 삭제하시겠습니까?\n노션 데이터베이스에서도 삭제(아카이브)됩니다.')) return;
    try {
      const res = await fetch(`/api/insights?id=${insightId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('삭제 실패');
      setInsights((prev) => prev.filter((i) => i.id !== insightId));
      onRefresh();
    } catch (err: any) {
      alert('문장수집 삭제 오류: ' + err.message);
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
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || '삭제 실패');
      }
      alert('도서가 삭제되었습니다.');
      onClose();
      onRefresh();
    } catch (err: any) {
      alert('삭제 중 오류: ' + err.message);
    }
  };

  // 도서 상세 정보 수정 (노션 DB 반영)
  const handleSaveBookInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBookTitle.trim()) {
      alert('책 제목은 필수입니다.');
      return;
    }

    setSavingBookInfo(true);
    try {
      const res = await fetch('/api/books', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateBook',
          bookId: book.id,
          title: editBookTitle.trim(),
          author: editBookAuthor.trim(),
          publisher: editBookPublisher.trim(),
          totalPage: editBookTotalPage ? Number(editBookTotalPage) : 0,
          cover: editBookCover.trim(),
          description: editBookDescription.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || '도서 정보 수정 실패');
      }

      alert('도서 정보가 노션에 수정되었습니다.');
      setShowBookInfoPanel(false);
      onRefresh();
    } catch (err: any) {
      alert('도서 정보 수정 오류: ' + err.message);
    } finally {
      setSavingBookInfo(false);
    }
  };

  // 도서 소속 챌린지 변경 핸들러
  const handleChallengeChange = async (targetId: string) => {
    if (!targetId || targetId === selectedBookChallengeId) return;
    const targetChallenge = challenges.find((c) => c.id === targetId);
    const targetTitle = targetChallenge?.title || '선택한 챌린지';

    if (!confirm(`이 도서의 챌린지를 [${targetTitle}]으로 변경하시겠습니까?`)) {
      return;
    }

    setUpdatingChallenge(true);
    try {
      const res = await fetch('/api/books', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'changeChallenge',
          bookId: book.id,
          targetChallengeId: targetId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '챌린지 변경 실패');

      setSelectedBookChallengeId(targetId);
      book.challengeIds = [targetId];
      alert(`도서의 소속 챌린지가 [${targetTitle}]으로 변경되었습니다.`);
      onRefresh();
    } catch (err: any) {
      alert('챌린지 변경 오류: ' + err.message);
    } finally {
      setUpdatingChallenge(false);
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

              {/* 소속 챌린지 및 변경 컨트롤 */}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <span className="text-[11px] text-stone-500 font-bold">🎯 챌린지:</span>
                <select
                  value={selectedBookChallengeId}
                  onChange={(e) => handleChallengeChange(e.target.value)}
                  disabled={updatingChallenge}
                  className="text-xs font-semibold py-1 px-2 rounded-lg border border-stone-300 bg-white text-stone-800 shadow-sm"
                >
                  {challenges.map((c, i) => (
                    <option key={c.id} value={c.id}>
                      {c.title} {i === 0 ? '(최신)' : ''}
                    </option>
                  ))}
                </select>
                {latestChallenge && selectedBookChallengeId !== latestChallenge.id && (
                  <button
                    type="button"
                    disabled={updatingChallenge}
                    onClick={() => handleChallengeChange(latestChallenge.id)}
                    className="px-2 py-1 text-[11px] font-bold rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition"
                  >
                    ⏩ 최신 챌린지로 이동
                  </button>
                )}
                {updatingChallenge && (
                  <span className="text-xs text-amber-700 animate-pulse font-medium">변경 중...</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => setShowBookInfoPanel((prev) => !prev)}
              className={`px-2.5 py-2 text-xs font-bold rounded-xl border transition ${
                showBookInfoPanel
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200'
              }`}
              title="도서 정보 확인 및 수정"
            >
              {showBookInfoPanel ? '관리 닫기' : '도서 관리 ✏️'}
            </button>
            <button
              type="button"
              onClick={handleDeleteBook}
              className="px-2.5 py-2 text-xs font-bold rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition"
              title="서재에서 도서 삭제"
            >
              삭제 🗑️
            </button>
            <button
              type="button"
              className="px-3 py-2 text-xs font-bold rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 transition"
              onClick={onClose}
            >
              닫기
            </button>
          </div>
        </div>

        {/* 도서 정보 확인 및 수정 패널 */}
        {showBookInfoPanel && (
          <form
            onSubmit={handleSaveBookInfo}
            className="mt-3 p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3 overflow-y-auto max-h-[45vh]"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-800">📚 도서 상세 정보 확인 및 수정</span>
              <span className="text-[11px] text-stone-500">수정 내용은 노션 DB에 바로 반영됩니다</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-stone-600 mb-1">책 제목 *</label>
                <input
                  type="text"
                  value={editBookTitle}
                  onChange={(e) => setEditBookTitle(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm rounded-xl border border-stone-300 bg-white text-stone-900"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">저자</label>
                <input
                  type="text"
                  value={editBookAuthor}
                  onChange={(e) => setEditBookAuthor(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm rounded-xl border border-stone-300 bg-white text-stone-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">출판사</label>
                <input
                  type="text"
                  value={editBookPublisher}
                  onChange={(e) => setEditBookPublisher(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm rounded-xl border border-stone-300 bg-white text-stone-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">전체 페이지수 (쪽)</label>
                <input
                  type="number"
                  value={editBookTotalPage}
                  onChange={(e) => setEditBookTotalPage(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-1.5 text-sm rounded-xl border border-stone-300 bg-white text-stone-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">표지 이미지 URL</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={editBookCover}
                  onChange={(e) => setEditBookCover(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm rounded-xl border border-stone-300 bg-white text-stone-900"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-stone-600 mb-1">책소개</label>
                <textarea
                  rows={3}
                  placeholder="등록된 책소개가 없습니다. 내용을 입력해 보세요."
                  value={editBookDescription}
                  onChange={(e) => setEditBookDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 bg-white text-stone-900 leading-relaxed"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowBookInfoPanel(false)}
                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-700 transition"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={savingBookInfo}
                className="px-4 py-1.5 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow transition disabled:opacity-50"
              >
                {savingBookInfo ? '저장 중...' : '도서 정보 저장'}
              </button>
            </div>
          </form>
        )}

        {!showBookInfoPanel && book.description && (
          <div className="mt-2.5 px-3 py-2 bg-stone-50/80 rounded-xl border border-stone-200/80 text-xs text-stone-600 leading-relaxed line-clamp-2">
            <span className="font-bold text-stone-700 mr-1.5">책소개</span>
            {book.description}
          </div>
        )}

        {/* 탭 네비게이션 */}
        <div className="library-tabs" style={{ marginTop: '12px', marginBottom: '14px' }}>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`lib-tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
          >
            통합 타임라인 ({logs.length + insights.length})
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`lib-tab-btn ${activeTab === 'ai' ? 'active' : ''}`}
          >
            ✨ AI 감상문
          </button>
        </div>

        {/* 탭 내용 영역 */}
        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
          {/* 1. 통합 타임라인 탭 (독서일지 + 문장수집 한눈에 보기) */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              {/* 상단 간편 등록 버튼 (2버튼 체제) */}
              <div ref={formTopRef} className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (activeForm === 'log') {
                      resetLogForm();
                      setActiveForm('none');
                    } else {
                      resetLogForm();
                      setActiveForm('log');
                    }
                  }}
                  className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm ${
                    activeForm === 'log'
                      ? 'bg-amber-700 text-white shadow-inner'
                      : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300/80'
                  }`}
                >
                  <span>📖</span>
                  <span>{activeForm === 'log' ? '독서일지 폼 닫기' : '+ 독서일지 작성'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (activeForm === 'insight') {
                      resetInsightForm();
                      setActiveForm('none');
                    } else {
                      resetInsightForm();
                      setActiveForm('insight');
                    }
                  }}
                  className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm ${
                    activeForm === 'insight'
                      ? 'bg-emerald-700 text-white shadow-inner'
                      : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300/80'
                  }`}
                >
                  <span>💡</span>
                  <span>{activeForm === 'insight' ? '문장수집 폼 닫기' : '+ 문장수집 작성'}</span>
                </button>
              </div>

              {/* A. 독서일지 작성 폼 (열렸을 때) */}
              {activeForm === 'log' && (
                <form onSubmit={handleSubmitLog} className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-950 flex items-center gap-1">
                      <span>📖</span> {editingLogId ? '독서일지 수정' : '새 독서일지 작성'}
                    </span>
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-semibold text-amber-700 hover:text-amber-800 cursor-pointer flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-amber-200">
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
                      <button
                        type="button"
                        onClick={() => setActiveForm('none')}
                        className="text-xs text-stone-400 hover:text-stone-700 px-1.5 py-0.5"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">읽은 날짜</label>
                      <input
                        type="date"
                        value={logDate}
                        onChange={(e) => setLogDate(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white min-w-0 box-border text-stone-900"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">읽은 페이지 (누적 쪽수)</label>
                      <input
                        type="number"
                        placeholder={`최대 ${book.totalPage || ''}p`}
                        value={logPage}
                        onChange={(e) => setLogPage(e.target.value ? Number(e.target.value) : '')}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white min-w-0 box-border text-stone-900 font-semibold"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <textarea
                      ref={logTextareaRef}
                      rows={3}
                      placeholder="오늘 읽은 내용과 나의 생각을 자유롭게 남겨보세요..."
                      value={logContent}
                      onChange={(e) => setLogContent(e.target.value)}
                      className="w-full min-h-[96px] px-3 py-2.5 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white box-border text-stone-900 resize-none leading-relaxed"
                      required
                    ></textarea>
                  </div>

                  {logImageUrl && (
                    <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-amber-300">
                      <img src={logImageUrl} alt="첨부 사진" className="w-12 h-12 object-cover rounded-lg border" />
                      <span className="text-xs text-amber-900 font-medium flex-1">📷 사진 첨부됨 (노션 본문에도 영구 저장)</span>
                      <button type="button" onClick={() => setLogImageUrl('')} className="text-xs text-stone-700 hover:text-stone-900 px-2 py-1 bg-stone-100 rounded border">사진 취소</button>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2.5 pt-1">
                    <div className="text-xs text-stone-500 font-medium">
                      <span className={logContent.length > 2000 ? 'text-amber-700 font-bold' : ''}>
                        {logContent.length.toLocaleString()}자
                      </span>
                      {logContent.length > 2000 && (
                        <span className="ml-1.5 text-[11px] text-amber-700">· 노션 자동 분할 저장</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          resetLogForm();
                          setActiveForm('none');
                        }}
                        className="px-3.5 py-2 text-xs font-bold rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 transition"
                      >
                        취소
                      </button>
                      <button
                        type="submit"
                        disabled={submittingLog || isOcrProcessing}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow transition disabled:opacity-50"
                      >
                        {submittingLog ? '저장 중...' : editingLogId ? '수정 완료' : '독서일지 저장'}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* B. 문장수집 작성 폼 (열렸을 때) */}
              {activeForm === 'insight' && (
                <form onSubmit={handleSubmitInsight} className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-950 flex items-center gap-1">
                      <span>💡</span> {editingInsightId ? '문장수집 수정' : '새 문장 수집하기'}
                    </span>
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-semibold text-emerald-800 hover:text-emerald-900 cursor-pointer flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-emerald-200">
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
                      <button
                        type="button"
                        onClick={() => setActiveForm('none')}
                        className="text-xs text-stone-400 hover:text-stone-700 px-1.5 py-0.5"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">페이지 번호</label>
                      <input
                        type="text"
                        placeholder="예: p.124"
                        value={insightPage}
                        onChange={(e) => setInsightPage(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white min-w-0 box-border text-stone-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">수집 날짜</label>
                      <input
                        type="date"
                        value={insightDate}
                        onChange={(e) => setInsightDate(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white min-w-0 box-border text-stone-900"
                      />
                    </div>
                  </div>

                  <div>
                    <textarea
                      ref={insightTextareaRef}
                      rows={4}
                      placeholder="기억하고 싶은 인상 깊은 문장과 나의 단상을 입력하세요..."
                      value={insightQuote}
                      onChange={(e) => setInsightQuote(e.target.value)}
                      className="w-full min-h-[112px] px-3 py-2.5 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white box-border text-stone-900 resize-none leading-relaxed"
                      required
                    ></textarea>
                  </div>

                  {insightImageUrl && (
                    <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-emerald-300">
                      <img src={insightImageUrl} alt="첨부 사진" className="w-12 h-12 object-cover rounded-lg border" />
                      <span className="text-xs text-emerald-950 font-medium flex-1">📷 사진 첨부됨 (노션 본문에도 영구 저장)</span>
                      <button type="button" onClick={() => setInsightImageUrl('')} className="text-xs text-stone-700 hover:text-stone-900 px-2 py-1 bg-stone-100 rounded border">사진 취소</button>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2.5 pt-1">
                    <div className="text-xs text-stone-500 font-medium">
                      <span className={insightQuote.length > 2000 ? 'text-emerald-700 font-bold' : ''}>
                        {insightQuote.length.toLocaleString()}자
                      </span>
                      {insightQuote.length > 2000 && (
                        <span className="ml-1.5 text-[11px] text-emerald-700">· 노션 자동 분할 저장</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          resetInsightForm();
                          setActiveForm('none');
                        }}
                        className="px-3.5 py-2 text-xs font-bold rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 transition"
                      >
                        취소
                      </button>
                      <button
                        type="submit"
                        disabled={submittingInsight || isOcrProcessing}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow transition disabled:opacity-50"
                      >
                        {submittingInsight ? '저장 중...' : editingInsightId ? '수정 완료' : '문장 저장'}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* C. 통합 타임라인 피드 (최신순 융합 정렬) */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between text-xs text-stone-500 px-1">
                  <span className="font-bold text-stone-700 uppercase tracking-wider">
                    통합 독서 피드 (최신순)
                  </span>
                  <span>총 {logs.length + insights.length}개의 기록</span>
                </div>

                {logs.length === 0 && insights.length === 0 ? (
                  <div className="text-center py-10 bg-stone-50/70 rounded-2xl border border-dashed border-stone-300 space-y-2">
                    <span className="text-2xl">📖</span>
                    <p className="text-sm font-semibold text-stone-600">아직 작성된 일지나 문장이 없습니다.</p>
                    <p className="text-xs text-stone-400">
                      상단의 [+ 독서일지 작성] 또는 [+ 문장수집 작성] 버튼을 눌러 첫 기록을 남겨보세요!
                    </p>
                  </div>
                ) : (
                  [
                    ...logs.map((l) => ({
                      id: l.id,
                      itemType: 'log' as const,
                      date: l.date,
                      page: l.page,
                      content: l.content,
                    })),
                    ...insights.map((ins) => ({
                      id: ins.id,
                      itemType: 'insight' as const,
                      date: ins.date,
                      page: ins.page,
                      content: ins.quote,
                    })),
                  ]
                    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
                    .map((item) =>
                      item.itemType === 'log' ? (
                        /* 독서일지 카드 */
                        <div
                          key={`log-${item.id}`}
                          className="p-4 bg-white rounded-2xl border border-amber-200/80 shadow-sm hover:shadow transition"
                        >
                          <div className="flex items-center justify-between text-xs mb-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold flex items-center gap-1">
                                <span>📖</span> 독서일지
                              </span>
                              <span className="font-semibold text-stone-600 font-mono">
                                {item.page}p 읽음
                              </span>
                              <span className="text-stone-400">·</span>
                              <span className="text-stone-500">{item.date}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  handleStartEditLog({
                                    id: item.id,
                                    date: item.date,
                                    page: Number(item.page) || 0,
                                    content: item.content,
                                  })
                                }
                                className="text-stone-400 hover:text-amber-700 transition p-1 text-xs font-medium"
                                title="독서일지 수정"
                              >
                                수정 ✏️
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteLog(item.id)}
                                className="text-stone-400 hover:text-rose-600 transition p-1 text-xs font-medium"
                                title="독서일지 삭제"
                              >
                                삭제 🗑️
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-stone-800 whitespace-pre-line leading-relaxed pl-1">
                            {item.content}
                          </p>
                        </div>
                      ) : (
                        /* 문장수집 카드 */
                        <div
                          key={`insight-${item.id}`}
                          className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-200/80 shadow-sm hover:shadow transition"
                        >
                          <div className="flex items-center justify-between text-xs mb-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold flex items-center gap-1">
                                <span>💡</span> 문장수집
                              </span>
                              <span className="font-semibold text-emerald-900 font-mono">
                                {item.page ? `${item.page}` : '페이지 미정'}
                              </span>
                              <span className="text-stone-400">·</span>
                              <span className="text-stone-500">{item.date}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  handleStartEditInsight({
                                    id: item.id,
                                    date: item.date,
                                    page: String(item.page || ''),
                                    content: item.content,
                                  })
                                }
                                className="text-stone-400 hover:text-emerald-700 transition p-1 text-xs font-medium"
                                title="문장수집 수정"
                              >
                                수정 ✏️
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteInsight(item.id)}
                                className="text-stone-400 hover:text-rose-600 transition p-1 text-xs font-medium"
                                title="문장수집 삭제"
                              >
                                삭제 🗑️
                              </button>
                            </div>
                          </div>
                          <blockquote className="text-sm text-stone-800 italic border-l-4 border-emerald-500 pl-3 leading-relaxed whitespace-pre-line bg-white/60 p-2.5 rounded-r-xl">
                            {item.content}
                          </blockquote>
                        </div>
                      )
                    )
                )}
              </div>
            </div>
          )}

          {/* 2. AI 독서감상문 탭 */}
          {activeTab === 'ai' && (
            <div className="space-y-4">
              <div className="p-4 bg-orange-50 rounded-2xl border border-orange-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-orange-950">AI 독서감상문</h4>
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
            type="button"
            onClick={handleDeleteBook}
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition flex items-center gap-1.5"
          >
            <span>🗑️</span>
            <span>도서 삭제</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs sm:text-sm font-bold rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 transition"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
