'use client';

import React, { useState } from 'react';
import { Challenge } from '@/lib/types';

interface SearchBookModalProps {
  challenges: Challenge[];
  currentChallengeId: string;
  onClose: () => void;
  onBookAdded: () => void;
}

export default function SearchBookModal({
  challenges,
  currentChallengeId,
  onClose,
  onBookAdded,
}: SearchBookModalProps) {
  const [engine, setEngine] = useState<'aladin' | 'kakao' | 'naver'>('aladin');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // 선택된 도서 상세 등록 폼
  const [selectedBook, setSelectedBook] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAuthor, setEditAuthor] = useState('');
  const [editPublisher, setEditPublisher] = useState('');
  const [editTotalPage, setEditTotalPage] = useState<number | ''>('');
  const [editCover, setEditCover] = useState('');
  const [editRating, setEditRating] = useState('⭐⭐⭐⭐⭐');
  const [targetChallengeId, setTargetChallengeId] = useState(currentChallengeId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setSelectedBook(null);
    try {
      const res = await fetch(`/api/search-books?query=${encodeURIComponent(query)}&type=${engine}`);
      const data = await res.json();
      if (data.ok && data.books) {
        setSearchResults(data.books);
      } else {
        alert(data.error || '검색 결과가 없습니다.');
      }
    } catch (err: any) {
      alert('도서 검색 중 오류 발생: ' + err.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectResult = (book: any) => {
    setSelectedBook(book);
    setEditTitle(book.title || '');
    setEditAuthor(book.author || '');
    setEditPublisher(book.publisher || '');
    setEditTotalPage(book.totalPages ? Number(book.totalPages) : '');
    setEditCover(book.coverUrl || '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) {
      alert('책 제목은 필수입니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          author: editAuthor,
          publisher: editPublisher,
          totalPage: editTotalPage ? Number(editTotalPage) : 0,
          cover: editCover,
          rating: editRating,
          challengeId: targetChallengeId,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '도서 등록 실패');
      }

      alert('도서가 서재와 챌린지에 성공적으로 등록되었습니다!');
      onBookAdded();
      onClose();
    } catch (err: any) {
      alert('도서 등록 오류: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
        {/* 상단 바 */}
        <div className="p-6 border-b border-stone-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-stone-900">새 도서 검색 및 등록</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              도서를 검색하고 정보를 확인한 뒤 서재에 등록하세요.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100 text-lg transition"
          >
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* 검색 엔진 선택 */}
          <div className="flex gap-2">
            {[
              { id: 'aladin', label: '알라딘 API (쪽수 100% 자동)' },
              { id: 'kakao', label: '카카오 도서' },
              { id: 'naver', label: '네이버 도서' },
            ].map((eng) => (
              <button
                key={eng.id}
                type="button"
                onClick={() => setEngine(eng.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                  engine === eng.id
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                    : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                }`}
              >
                {eng.label}
              </button>
            ))}
          </div>

          {/* 검색창 */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              placeholder="도서명, 저자, 또는 ISBN 검색..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm rounded-xl shadow transition disabled:opacity-50"
            >
              {isSearching ? '검색 중...' : '검색'}
            </button>
          </form>

          {/* 검색 결과 리스트 */}
          {!selectedBook && searchResults.length > 0 && (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              <div className="text-xs font-bold text-stone-500 mb-2">
                검색 결과 ({searchResults.length}건) — 등록할 책을 선택하세요
              </div>
              {searchResults.map((b, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectResult(b)}
                  className="flex gap-3 p-3 rounded-xl border border-stone-200 hover:border-amber-400 hover:bg-amber-50/40 cursor-pointer transition"
                >
                  {b.coverUrl ? (
                    <img
                      src={b.coverUrl}
                      alt={b.title}
                      className="w-12 h-16 object-cover rounded shadow-sm flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-16 bg-stone-200 rounded flex items-center justify-center text-xs">
                      표지없음
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-stone-900 truncate">{b.title}</h4>
                    <p className="text-xs text-stone-600 truncate mt-0.5">
                      {b.author} · {b.publisher}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-stone-500">
                      <span>{b.totalPages ? `${b.totalPages}쪽` : '쪽수 미정'}</span>
                      <span className="text-stone-300">|</span>
                      <span>{b.source}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 선택 도서 상세 정보 확인 폼 */}
          {selectedBook && (
            <form onSubmit={handleSubmit} className="p-5 bg-amber-50/50 rounded-2xl border border-amber-200 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900">
                  도서 상세 정보 확인 및 등록
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedBook(null)}
                  className="text-xs text-stone-500 hover:underline"
                >
                  ← 다른 책 선택
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-stone-700 mb-1">책 제목</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">저자</label>
                  <input
                    type="text"
                    value={editAuthor}
                    onChange={(e) => setEditAuthor(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">출판사</label>
                  <input
                    type="text"
                    value={editPublisher}
                    onChange={(e) => setEditPublisher(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    전체 페이지수 <span className="text-amber-700 font-bold">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="예: 320"
                    value={editTotalPage}
                    onChange={(e) => setEditTotalPage(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 bg-white font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">연결할 챌린지</label>
                  <select
                    value={targetChallengeId}
                    onChange={(e) => setTargetChallengeId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 bg-white"
                  >
                    {challenges.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm rounded-xl shadow transition disabled:opacity-50"
                >
                  {isSubmitting ? '노션에 등록 중...' : '서재에 등록하기'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
