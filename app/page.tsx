'use client';

import React, { useState, useEffect } from 'react';
import { Book, Challenge } from '@/lib/types';
import ChallengeHeader from '@/components/ChallengeHeader';
import BookGrid from '@/components/BookGrid';
import BookDetailModal from '@/components/BookDetailModal';
import SearchBookModal from '@/components/SearchBookModal';
import ChallengeSettingsModal from '@/components/ChallengeSettingsModal';
import ChallengeReportModal from '@/components/ChallengeReportModal';
import ChallengeArchiveView from '@/components/ChallengeArchiveView';
import TimelineFeedView from '@/components/TimelineFeedView';
import SettingsModal from '@/components/SettingsModal';

export default function HomePage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>('');
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'current_challenge' | 'all_books' | 'archive' | 'feed'>('current_challenge');

  // 모달 제어 상태
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isOpenAddModal, setIsOpenAddModal] = useState(false);
  const [isOpenSettingsModal, setIsOpenSettingsModal] = useState(false);
  const [isOpenPeriodModal, setIsOpenPeriodModal] = useState(false);
  const [isOpenReportModal, setIsOpenReportModal] = useState(false);

  // 초기 데이터 로드
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [resCh, resBooks] = await Promise.all([
        fetch('/api/challenges').then((r) => r.json()),
        fetch('/api/books').then((r) => r.json()),
      ]);

      if (resCh.challenges && resCh.challenges.length > 0) {
        setChallenges(resCh.challenges);
        // 기본 챌린지로 가장 최근 챌린지 선택
        if (!selectedChallengeId) {
          setSelectedChallengeId(resCh.challenges[0].id);
        }
      }
      if (resBooks.books) {
        setBooks(resBooks.books);
      }
    } catch (err) {
      console.error('데이터 로드 실패:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const currentChallenge = challenges.find((c) => c.id === selectedChallengeId) || challenges[0] || null;

  // 현재 탭에 따른 도서 필터링
  const displayedBooks = activeTab === 'current_challenge' && currentChallenge
    ? books.filter((b) => b.challengeIds.includes(currentChallenge.id))
    : books;

  return (
    <div className="min-h-screen bg-[#fcfbfa] text-stone-900 flex flex-col font-sans">
      {/* 1. 상단 글로벌 네비게이션 헤더 */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/icon.svg" alt="Book Tuning" className="w-8 h-8 rounded-lg shadow-sm" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-lg tracking-tight text-stone-900">
                  북튜닝 <span className="text-amber-700 font-serif">Book Tuning</span>
                </h1>
                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                  개인 챌린지
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsOpenAddModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
            >
              <span>+</span> 도서 등록
            </button>
            <button
              onClick={loadData}
              title="새로고침"
              className="p-2 text-stone-500 hover:text-stone-800 rounded-xl hover:bg-stone-100 transition text-sm"
            >
              🔄
            </button>
            <button
              onClick={() => setIsOpenSettingsModal(true)}
              title="설정"
              className="p-2 text-stone-500 hover:text-stone-800 rounded-xl hover:bg-stone-100 transition text-sm"
            >
              ⚙️
            </button>
          </div>
        </div>
      </header>

      {/* 2. 메인 콘텐츠 컨테이너 */}
      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full">
        {/* 상단 챌린지 대시보드 위젯 */}
        <ChallengeHeader
          currentChallenge={currentChallenge}
          onOpenSettings={() => setIsOpenPeriodModal(true)}
          onOpenReport={() => setIsOpenReportModal(true)}
          isLoading={isLoading}
        />

        {/* 서재 뷰 전환 탭 */}
        <div className="flex border-b border-stone-200 mb-6 gap-2 overflow-x-auto pb-px">
          {[
            { id: 'current_challenge', label: `🎯 이번 챌린지 도서 (${activeTab === 'current_challenge' ? displayedBooks.length : (currentChallenge?.bookIds?.length || 0)})` },
            { id: 'all_books', label: `📚 전체 서재 (${books.length})` },
            { id: 'archive', label: `🗂️ 챌린지 아카이브 (${challenges.length})` },
            { id: 'feed', label: '📝 독서일지 & 문장 피드' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-4 text-sm font-bold border-b-2 whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'border-amber-600 text-amber-800'
                  : 'border-transparent text-stone-500 hover:text-stone-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 탭 본문 영역 */}
        {activeTab === 'archive' ? (
          <ChallengeArchiveView
            challenges={challenges}
            selectedChallengeId={selectedChallengeId}
            onSelectChallenge={(id) => {
              setSelectedChallengeId(id);
              setActiveTab('current_challenge');
            }}
          />
        ) : activeTab === 'feed' ? (
          <TimelineFeedView books={books} />
        ) : (
          <BookGrid
            books={displayedBooks}
            onSelectBook={(b) => setSelectedBook(b)}
            onOpenAddModal={() => setIsOpenAddModal(true)}
            isLoading={isLoading}
          />
        )}
      </main>

      {/* 3. 하단 푸터 */}
      <footer className="mt-auto border-t border-stone-200 bg-white py-6">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <div>
            만든이. 기록조율사 서울외고 조용희 · 북튜닝 개인 독서 챌린지
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://app.notion.com/p/record-tuner/Book-Tuning-36c9a42118958035be6cf82a7f33d8fb?source=copy_link"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-amber-700 hover:underline flex items-center gap-1"
            >
              <span>📚</span> 노션 데이터베이스 열기 ↗
            </a>
            <span className="text-stone-300">|</span>
            <button
              onClick={() => setIsOpenSettingsModal(true)}
              className="text-stone-500 hover:text-stone-800"
            >
              환경 설정
            </button>
          </div>
        </div>
      </footer>

      {/* 4. 각종 모달 렌더링 */}
      {selectedBook && (
        <BookDetailModal
          book={selectedBook}
          challenges={challenges}
          currentChallengeId={selectedChallengeId}
          onClose={() => setSelectedBook(null)}
          onRefresh={loadData}
        />
      )}

      {isOpenAddModal && (
        <SearchBookModal
          challenges={challenges}
          currentChallengeId={selectedChallengeId}
          onClose={() => setIsOpenAddModal(false)}
          onBookAdded={loadData}
        />
      )}

      {isOpenPeriodModal && currentChallenge && (
        <ChallengeSettingsModal
          challenge={currentChallenge}
          onClose={() => setIsOpenPeriodModal(false)}
          onUpdated={loadData}
        />
      )}

      {isOpenReportModal && currentChallenge && (
        <ChallengeReportModal
          challenge={currentChallenge}
          onClose={() => setIsOpenReportModal(false)}
        />
      )}

      {isOpenSettingsModal && (
        <SettingsModal onClose={() => setIsOpenSettingsModal(false)} />
      )}
    </div>
  );
}
