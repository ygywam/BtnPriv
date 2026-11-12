'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Book, Challenge, ReadingLog, Insight } from '@/lib/types';
import BookDetailModal from '@/components/BookDetailModal';
import ChallengeSettingsModal from '@/components/ChallengeSettingsModal';
import ChallengeReportModal from '@/components/ChallengeReportModal';
import BottomNav, { MainTabId } from '@/components/BottomNav';
import HomeTab from '@/components/tabs/HomeTab';
import LibraryTab from '@/components/tabs/LibraryTab';
import ChallengeTab from '@/components/tabs/ChallengeTab';
import FeedTab from '@/components/tabs/FeedTab';
import DexTab from '@/components/tabs/DexTab';
import ManualBookModal from '@/components/ManualBookModal';
import AppInfoModals from '@/components/AppInfoModals';

export default function Home() {
  // 1. 테마 및 검색 엔진 상태
  const [theme, setTheme] = useState('theme-base');
  const [searchApiType, setSearchApiType] = useState<'aladin' | 'kakao' | 'naver'>('aladin');

  // 2. 핵심 도메인 데이터
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>('');
  const [books, setBooks] = useState<Book[]>([]);
  const [logs, setLogs] = useState<ReadingLog[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  // 3. 주 내비게이션 탭
  const [activeTab, setActiveTab] = useState<MainTabId>('home');

  // 4. 도서 검색 및 직접 등록 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showManualBookModal, setShowManualBookModal] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualAuthor, setManualAuthor] = useState('');
  const [manualPublisher, setManualPublisher] = useState('');
  const [manualPages, setManualPages] = useState<number | ''>('');
  const [manualDesc, setManualDesc] = useState('');
  const [manualCover, setManualCover] = useState('');
  const [manualTargetChallengeId, setManualTargetChallengeId] = useState('');
  const [isSubmittingBook, setIsSubmittingBook] = useState(false);

  // 5. 모달 상태
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [modalTargetChallengeId, setModalTargetChallengeId] = useState<string>('');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [showDevLogModal, setShowDevLogModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showCopyrightModal, setShowCopyrightModal] = useState(false);
  const [rollingOver, setRollingOver] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('app_theme') || 'theme-base';
    setTheme(savedTheme);
    document.body.className = savedTheme;

    const savedApiType = (localStorage.getItem('search_api_type') as any) || 'aladin';
    setSearchApiType(savedApiType);

    loadInitialData();
  }, []);

  const changeTheme = (newTheme: string) => {
    setTheme(newTheme);
    document.body.className = newTheme;
    localStorage.setItem('app_theme', newTheme);
  };

  const changeSearchApiType = (newType: 'aladin' | 'kakao' | 'naver') => {
    setSearchApiType(newType);
    localStorage.setItem('search_api_type', newType);
  };

  // 초기 및 새로고침 시 챌린지/도서/일지/문장수집 병렬 로딩
  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [resCh, resBooks, resLogs, resInsights] = await Promise.all([
        fetch('/api/challenges').then((r) => r.json()),
        fetch('/api/books').then((r) => r.json()),
        fetch('/api/logs').then((r) => r.json()),
        fetch('/api/insights').then((r) => r.json()),
      ]);

      if (resCh.challenges && resCh.challenges.length > 0) {
        setChallenges(resCh.challenges);
        setSelectedChallengeId((prev) => prev || resCh.challenges[0].id);
        setManualTargetChallengeId((prev) => prev || resCh.challenges[0].id);
      }
      if (resBooks.books) setBooks(resBooks.books);
      if (resLogs.logs) setLogs(resLogs.logs);
      if (resInsights.insights) setInsights(resInsights.insights);
    } catch (err) {
      console.error('초기 데이터 로딩 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  const currentChallenge = useMemo(
    () => challenges.find((c) => c.id === selectedChallengeId) || challenges[0] || null,
    [challenges, selectedChallengeId]
  );

  const modalChallenge = useMemo(
    () => challenges.find((c) => c.id === modalTargetChallengeId) || currentChallenge,
    [challenges, modalTargetChallengeId, currentChallenge]
  );

  const selectedBook = useMemo(
    () => (selectedBookId ? books.find((b) => b.id === selectedBookId) || null : null),
    [books, selectedBookId]
  );

  const latestChallenge = useMemo(() => challenges[0] || null, [challenges]);

  // 과거 챌린지 미완독 도서 최신 챌린지로 일괄 이월
  const handleBatchRollover = async (fromChallenge: Challenge) => {
    if (!latestChallenge) return;
    const targets = books.filter(
      (b) => b.challengeIds.includes(fromChallenge.id) && (b.progressRate || 0) < 100
    );
    if (targets.length === 0) {
      alert('이 챌린지에는 이월할 미완독 도서가 없습니다.');
      return;
    }

    const bookTitles = targets.map((b) => `《${b.title}》`).join(', ');
    if (
      !confirm(
        `완독하지 못한 ${targets.length}권의 도서(${bookTitles})를 최신 챌린지 [${latestChallenge.title}]로 이동하시겠습니까?`
      )
    ) {
      return;
    }

    setRollingOver(true);
    try {
      const res = await fetch('/api/books', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'batchRollover',
          fromChallengeId: fromChallenge.id,
          toChallengeId: latestChallenge.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '이월 처리 실패');

      alert(`✨ ${data.count}권의 미완독 도서가 [${latestChallenge.title}]로 성공적으로 이월되었습니다!`);
      setSelectedChallengeId(latestChallenge.id);
      await loadInitialData();
    } catch (err: any) {
      alert('도서 이월 중 오류: ' + err.message);
    } finally {
      setRollingOver(false);
    }
  };

  // 도서 검색
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/search-books?query=${encodeURIComponent(searchQuery)}&type=${searchApiType}`);
      const data = await res.json();
      if (data.ok) {
        setSearchResults(data.books || []);
      } else {
        alert(`검색 실패: ${data.error}`);
      }
    } catch {
      alert('도서 검색 중 오류가 발생했습니다.');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectSearchResult = (b: any) => {
    setManualTitle(b.title || '');
    setManualAuthor(b.author || '');
    setManualPublisher(b.publisher || '');
    setManualPages(b.totalPages > 0 ? b.totalPages : '');
    setManualDesc(b.description || '');
    setManualCover(b.coverUrl || '');
    setManualTargetChallengeId(selectedChallengeId || challenges[0]?.id || '');
    setShowManualBookModal(true);
  };

  const handleOpenManualBook = () => {
    setManualTitle('');
    setManualAuthor('');
    setManualPublisher('');
    setManualPages('');
    setManualDesc('');
    setManualCover('');
    setManualTargetChallengeId(selectedChallengeId || challenges[0]?.id || '');
    setShowManualBookModal(true);
  };

  const handleSubmitBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) return alert('도서명을 입력해 주세요.');

    setIsSubmittingBook(true);
    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: manualTitle.trim(),
          author: manualAuthor.trim() || '저자 미상',
          publisher: manualPublisher.trim() || '',
          totalPage: Number(manualPages) || 0,
          description: manualDesc.trim(),
          cover: manualCover.trim(),
          challengeId: manualTargetChallengeId || selectedChallengeId,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`《${manualTitle.trim()}》 도서가 서재와 챌린지에 안전하게 등록되었습니다! ✨`);
        setShowManualBookModal(false);
        setSearchResults([]);
        setSearchQuery('');
        await loadInitialData();
      } else {
        alert(`등록 실패: ${data.error}`);
      }
    } catch (err: any) {
      alert('도서 등록 중 오류: ' + err.message);
    } finally {
      setIsSubmittingBook(false);
    }
  };

  const navCounts = useMemo(
    () => ({
      books: books.length,
      challenges: challenges.length,
      dex: books.filter((b) => (b.progressRate || 0) >= 100).length,
    }),
    [books, challenges]
  );

  return (
    <div className="app">
      {/* 1. 상단 마스트헤드 */}
      <header className="app-header">
        <div
          className="app-title-row"
          onClick={() => setActiveTab('home')}
          style={{ cursor: 'pointer' }}
          title="홈으로"
        >
          <img src="/icon.svg" className="app-logo-icon" alt="북튜닝 로고" />
          <div className="min-w-0">
            <h1>북튜닝 (Book Tuning)</h1>
            <p className="subtitle">책을 읽고 기록하며 내 삶과 생각의 주파수를 맞춰가는 공간입니다.</p>
          </div>
        </div>

        <div className="header-nav-row">
          <button
            type="button"
            className="ghost-button"
            style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
            onClick={() => setShowTutorialModal(true)}
          >
            📖 사용법
          </button>
          <button type="button" className="ghost-button" onClick={() => setShowDevLogModal(true)}>
            📝 개발로그
          </button>
          <button type="button" className="ghost-button" onClick={() => setShowSettingsModal(true)}>
            ⚙️ 설정
          </button>
          <button type="button" className="ghost-button" onClick={loadInitialData} title="새로고침">
            🔄 새로고침
          </button>
        </div>
      </header>

      {/* 2. PC 상단 탭 & 모바일 하단 고정 5대 탭 내비게이션 */}
      <BottomNav activeTab={activeTab} onChange={setActiveTab} counts={navCounts} />

      {/* 3. 활성 탭 본문 */}
      <main className="app-main-content">
        {activeTab === 'home' && (
          <HomeTab
            books={books}
            challenges={challenges}
            currentChallenge={currentChallenge}
            onSelectChallenge={setSelectedChallengeId}
            logs={logs}
            insights={insights}
            loading={loading}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searching={searching}
            searchResults={searchResults}
            onClearSearchResults={() => setSearchResults([])}
            searchApiType={searchApiType}
            onSearch={handleSearch}
            onSelectSearchResult={handleSelectSearchResult}
            onOpenManualBook={handleOpenManualBook}
            onSelectBook={(b) => setSelectedBookId(b.id)}
            onOpenPeriodModal={() => {
              if (currentChallenge) {
                setModalTargetChallengeId(currentChallenge.id);
                setShowPeriodModal(true);
              }
            }}
            onOpenReportModal={() => {
              if (currentChallenge) {
                setModalTargetChallengeId(currentChallenge.id);
                setShowReportModal(true);
              }
            }}
            onGoToFeed={() => setActiveTab('feed')}
            onGoToLibrary={() => setActiveTab('library')}
          />
        )}

        {activeTab === 'library' && (
          <LibraryTab
            books={books}
            currentChallenge={currentChallenge}
            loading={loading}
            onSelectBook={(b) => setSelectedBookId(b.id)}
            onOpenManualBook={handleOpenManualBook}
          />
        )}

        {activeTab === 'challenge' && (
          <ChallengeTab
            challenges={challenges}
            selectedChallengeId={selectedChallengeId}
            books={books}
            rollingOver={rollingOver}
            onSelectBook={(b) => setSelectedBookId(b.id)}
            onOpenCalendarForChallenge={(id) => {
              setSelectedChallengeId(id);
              setActiveTab('home');
            }}
            onOpenPeriodForChallenge={(id) => {
              setModalTargetChallengeId(id);
              setShowPeriodModal(true);
            }}
            onOpenReportForChallenge={(id) => {
              setModalTargetChallengeId(id);
              setShowReportModal(true);
            }}
            onBatchRollover={handleBatchRollover}
          />
        )}

        {activeTab === 'feed' && (
          <FeedTab
            books={books}
            logs={logs}
            insights={insights}
            loading={loading}
            onSelectBook={(b) => setSelectedBookId(b.id)}
          />
        )}

        {activeTab === 'dex' && <DexTab books={books} onSelectBook={(b) => setSelectedBookId(b.id)} />}
      </main>

      {/* 4. 푸터 */}
      <footer className="app-footer">
        <p>
          만든이. <strong>기록조율사 서울외고 조용희</strong>{' '}
          <a href="https://www.instagram.com/record_tuner/" target="_blank" rel="noreferrer">
            @record_tuner
          </a>
        </p>
        <p style={{ marginTop: '10px' }}>
          <a
            href="/api/notion-url"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '13px', marginRight: '14px', fontWeight: 'bold', color: 'var(--accent)' }}
          >
            📚 노션 데이터베이스 열기 ↗
          </a>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setShowPrivacyModal(true);
            }}
            style={{ fontSize: '13px', marginRight: '14px' }}
          >
            개인정보처리방침
          </a>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setShowCopyrightModal(true);
            }}
            style={{ fontSize: '13px', marginRight: '14px' }}
          >
            저작권 및 이용 안내
          </a>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              alert('문의 사항은 @record_tuner 인스타그램 DM 또는 노션 페이지를 통해 접수해 주세요.');
            }}
            style={{ fontSize: '13px' }}
          >
            지원/문의
          </a>
        </p>
      </footer>

      {/* 5. 모달들 */}
      {selectedBook && (
        <BookDetailModal
          book={selectedBook}
          challenges={challenges}
          currentChallengeId={selectedChallengeId}
          onClose={() => setSelectedBookId(null)}
          onRefresh={loadInitialData}
        />
      )}

      {showManualBookModal && (
        <ManualBookModal
          challenges={challenges}
          manualTitle={manualTitle}
          setManualTitle={setManualTitle}
          manualAuthor={manualAuthor}
          setManualAuthor={setManualAuthor}
          manualPublisher={manualPublisher}
          setManualPublisher={setManualPublisher}
          manualPages={manualPages}
          setManualPages={setManualPages}
          manualCover={manualCover}
          setManualCover={setManualCover}
          manualTargetChallengeId={manualTargetChallengeId}
          setManualTargetChallengeId={setManualTargetChallengeId}
          isSubmittingBook={isSubmittingBook}
          onSubmit={handleSubmitBook}
          onClose={() => setShowManualBookModal(false)}
        />
      )}

      {showPeriodModal && modalChallenge && (
        <ChallengeSettingsModal
          challenge={modalChallenge}
          onClose={() => setShowPeriodModal(false)}
          onUpdated={loadInitialData}
        />
      )}

      {showReportModal && modalChallenge && (
        <ChallengeReportModal challenge={modalChallenge} onClose={() => setShowReportModal(false)} />
      )}

      <AppInfoModals
        theme={theme}
        onChangeTheme={changeTheme}
        searchApiType={searchApiType}
        onChangeSearchApiType={changeSearchApiType}
        showSettingsModal={showSettingsModal}
        setShowSettingsModal={setShowSettingsModal}
        showTutorialModal={showTutorialModal}
        setShowTutorialModal={setShowTutorialModal}
        showDevLogModal={showDevLogModal}
        setShowDevLogModal={setShowDevLogModal}
        showPrivacyModal={showPrivacyModal}
        setShowPrivacyModal={setShowPrivacyModal}
        showCopyrightModal={showCopyrightModal}
        setShowCopyrightModal={setShowCopyrightModal}
      />
    </div>
  );
}
