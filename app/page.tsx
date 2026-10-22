'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Book, Challenge, ReadingLog, Insight } from '@/lib/types';
import BookDetailModal from '@/components/BookDetailModal';
import ChallengeSettingsModal from '@/components/ChallengeSettingsModal';
import ChallengeReportModal from '@/components/ChallengeReportModal';

export default function Home() {
  // 1. 테마 및 환경 상태
  const [theme, setTheme] = useState('theme-base');
  const [searchApiType, setSearchApiType] = useState<'aladin' | 'kakao' | 'naver'>('aladin');

  // 2. 챌린지 및 도서 상태
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>('');
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  // 3. 서재 탭 및 필터
  const [activeTab, setActiveTab] = useState<'challenge' | 'all' | 'feed'>('challenge');
  const [statusFilter, setStatusFilter] = useState<'all' | 'reading' | 'done'>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'progress' | 'title'>('latest');

  // 4. 대시보드 도서 검색 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // 5. 모달 상태
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showManualBookModal, setShowManualBookModal] = useState(false);
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [showDevLogModal, setShowDevLogModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showCopyrightModal, setShowCopyrightModal] = useState(false);

  // 6. 직접 등록 / 도서 확인 폼 상태
  const [manualTitle, setManualTitle] = useState('');
  const [manualAuthor, setManualAuthor] = useState('');
  const [manualPublisher, setManualPublisher] = useState('');
  const [manualPages, setManualPages] = useState<number | ''>('');
  const [manualDesc, setManualDesc] = useState('');
  const [manualCover, setManualCover] = useState('');
  const [manualTargetChallengeId, setManualTargetChallengeId] = useState('');
  const [isSubmittingBook, setIsSubmittingBook] = useState(false);

  // 7. 통합 타임라인 피드 상태
  const [feedLogs, setFeedLogs] = useState<ReadingLog[]>([]);
  const [feedInsights, setFeedInsights] = useState<Insight[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);

  // 초기화 로드
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

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [resCh, resBooks] = await Promise.all([
        fetch('/api/challenges').then((r) => r.json()),
        fetch('/api/books').then((r) => r.json()),
      ]);

      if (resCh.challenges && resCh.challenges.length > 0) {
        setChallenges(resCh.challenges);
        if (!selectedChallengeId) {
          setSelectedChallengeId(resCh.challenges[0].id);
          setManualTargetChallengeId(resCh.challenges[0].id);
        }
      }
      if (resBooks.books) {
        setBooks(resBooks.books);
      }
    } catch (err) {
      console.error('초기 데이터 로딩 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  // 피드 데이터 로드
  const loadFeedData = async () => {
    setFeedLoading(true);
    try {
      const [resLogs, resInsights] = await Promise.all([
        fetch('/api/logs').then((r) => r.json()),
        fetch('/api/insights').then((r) => r.json()),
      ]);
      if (resLogs.logs) setFeedLogs(resLogs.logs);
      if (resInsights.insights) setFeedInsights(resInsights.insights);
    } catch (e) {
      console.error('피드 로딩 실패:', e);
    } finally {
      setFeedLoading(false);
    }
  };

  // 탭 변경 시 피드 데이터 필요하면 로드
  useEffect(() => {
    if (activeTab === 'feed') {
      loadFeedData();
    }
  }, [activeTab]);

  // 현재 선택된 챌린지 객체
  const currentChallenge = useMemo(() => {
    return challenges.find((c) => c.id === selectedChallengeId) || challenges[0] || null;
  }, [challenges, selectedChallengeId]);

  // 도서 검색 핸들러
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
    } catch (err) {
      alert('도서 검색 중 오류가 발생했습니다.');
    } finally {
      setSearching(false);
    }
  };

  // 검색 결과 선택 시 확인 모달 열기
  const handleSelectSearchResult = (b: any) => {
    setManualTitle(b.title || '');
    setManualAuthor(b.author || '');
    setManualPublisher(b.publisher || '');
    setManualPages(b.totalPages > 0 ? b.totalPages : '');
    setManualDesc(b.description || '');
    setManualCover(b.coverUrl || '');
    setManualTargetChallengeId(selectedChallengeId || (challenges[0]?.id || ''));
    setShowManualBookModal(true);
  };

  // 직접 등록 모달 열기
  const handleOpenManualBook = () => {
    setManualTitle('');
    setManualAuthor('');
    setManualPublisher('');
    setManualPages('');
    setManualDesc('');
    setManualCover('');
    setManualTargetChallengeId(selectedChallengeId || (challenges[0]?.id || ''));
    setShowManualBookModal(true);
  };

  // 도서 저장 제출
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
        loadInitialData();
      } else {
        alert(`등록 실패: ${data.error}`);
      }
    } catch (err: any) {
      alert('도서 등록 중 오류: ' + err.message);
    } finally {
      setIsSubmittingBook(false);
    }
  };

  // 필터 및 정렬된 도서 목록
  const displayedBooks = useMemo(() => {
    let list = books;
    if (activeTab === 'challenge' && currentChallenge) {
      list = list.filter((b) => b.challengeIds.includes(currentChallenge.id));
    }

    return list
      .filter((b) => {
        if (statusFilter === 'reading') return (b.progressRate || 0) < 100;
        if (statusFilter === 'done') return (b.progressRate || 0) >= 100;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'progress') return (b.progressRate || 0) - (a.progressRate || 0);
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
  }, [books, activeTab, currentChallenge, statusFilter, sortBy]);

  // 타임라인 아이템 통합
  const timelineItems = useMemo(() => {
    const list: Array<{ id: string; type: 'log' | 'insight'; date: string; title: string; content: string; page?: string | number }> = [];
    feedLogs.forEach((l) => {
      const book = books.find((b) => b.id === l.bookId);
      list.push({
        id: `log-${l.id}`,
        type: 'log',
        date: l.date,
        title: book?.title || '도서',
        content: l.content,
        page: l.page,
      });
    });
    feedInsights.forEach((ins) => {
      const book = books.find((b) => b.id === ins.bookId);
      list.push({
        id: `ins-${ins.id}`,
        type: 'insight',
        date: ins.date,
        title: book?.title || '도서',
        content: ins.quote,
        page: ins.page,
      });
    });
    return list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [feedLogs, feedInsights, books]);

  return (
    <div className="app">
      {/* 1. 상단 헤더 */}
      <header className="app-header">
        <div>
          <p className="eyebrow">기록조율사의 독서기록 v4.3 👑</p>
          <div
            className="app-title-row"
            onClick={() => {
              setActiveTab('challenge');
              setStatusFilter('all');
            }}
            style={{ cursor: 'pointer' }}
            title="홈으로 초기화"
          >
            <img src="/icon.svg" className="app-logo-icon" alt="북튜닝 로고" />
            <h1>북튜닝 (Book Tuning)</h1>
          </div>
          <p className="subtitle">책을 읽고 기록하며 내 삶과 생각의 주파수를 맞춰가는 공간입니다.</p>
        </div>

        <div className="header-nav-row">
          <button
            className="ghost-button"
            style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
            onClick={() => setShowTutorialModal(true)}
          >
            📖 사용법
          </button>
          <button className="ghost-button" onClick={() => setShowDevLogModal(true)}>
            📝 개발로그
          </button>
          <button className="ghost-button" onClick={() => setShowSettingsModal(true)}>
            ⚙️ 설정
          </button>
          <button className="ghost-button" onClick={loadInitialData} title="새로고침">
            🔄 새로고침
          </button>
        </div>
      </header>

      {/* 2. 독서 챌린지 상태 및 선택 패널 */}
      {currentChallenge && (
        <section className="panel" style={{ background: 'rgba(255, 248, 238, 0.95)', borderColor: 'var(--accent-light)' }}>
          <div className="section-title-row" style={{ flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', background: 'var(--accent)', color: '#fff', padding: '2px 8px', borderRadius: '99px' }}>
                  독서 챌린지
                </span>
                <span style={{ fontSize: '13px', color: 'var(--text-light)', fontWeight: '600' }}>
                  {currentChallenge.startDate} 시작 ({currentChallenge.targetDays}일간)
                </span>
              </div>
              <h2 style={{ fontSize: '20px', color: 'var(--accent-dark)', margin: 0 }}>
                {currentChallenge.title}
              </h2>
            </div>

            {/* 챌린지 선택 드롭다운 및 액션 버튼들 */}
            <div className="challenge-controls-row">
              <select
                value={selectedChallengeId}
                onChange={(e) => setSelectedChallengeId(e.target.value)}
                className="challenge-select"
              >
                {challenges.map((c, i) => (
                  <option key={c.id} value={c.id}>
                    {c.title} {i === 0 ? '(최신)' : ''}
                  </option>
                ))}
              </select>

              <div className="challenge-btn-group">
                <button
                  className="ghost-button"
                  onClick={() => setShowPeriodModal(true)}
                >
                  ⚙️ 기간 조절
                </button>
                <button
                  className="accent-button"
                  onClick={() => setShowReportModal(true)}
                  style={{
                    background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%)',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 6px rgba(143, 95, 54, 0.25)',
                  }}
                >
                  ✨ AI 독서 리포트
                </button>
              </div>
            </div>
          </div>

          {/* 노션 수식 잔디 현황 바 (모바일 줄바꿈 및 넘침 방지) */}
          {currentChallenge.progressText && (
            <div className="challenge-grass-box">
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--accent)', marginBottom: '4px' }}>
                📊 실시간 챌린지 달성 현황 (노션 동기화)
              </div>
              <div className="challenge-grass-text">
                {currentChallenge.progressText}
              </div>
            </div>
          )}
        </section>
      )}

      {/* 3. 대시보드 도서 검색 및 추가 패널 (기존 북튜닝 대시보드 복원) */}
      <section className="panel">
        <div className="section-title-row">
          <div>
            <h2>도서 검색 및 추가</h2>
            <p className="subtitle">
              현재 검색 엔진: <b>{searchApiType === 'aladin' ? '알라딘 (쪽수 100% 자동)' : searchApiType === 'kakao' ? '카카오 도서' : '네이버 도서'}</b> (설정에서 변경 가능)
            </p>
          </div>
          <button
            className="ghost-button"
            style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
            onClick={handleOpenManualBook}
          >
            ✍️ 직접 등록
          </button>
        </div>

        <div className="search-row">
          <input
            type="text"
            placeholder="도서명, 저자, 또는 ISBN 검색 (예: 어린왕자, 979...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch} disabled={searching}>
            {searching ? '검색 중...' : '검색'}
          </button>
        </div>

        {/* 검색 결과 목록 */}
        {searchResults.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            {searchResults.map((book, index) => (
              <div
                key={index}
                className="flex gap-3 bg-white p-3 border border-amber-200 rounded-xl items-center shadow-sm hover:border-amber-400 transition"
              >
                {book.coverUrl ? (
                  <img src={book.coverUrl} alt="" className="w-12 h-16 object-cover rounded shadow-sm flex-shrink-0" />
                ) : (
                  <div className="w-12 h-16 bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-800 rounded flex-shrink-0">
                    No Cover
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{book.title}</p>
                  <p className="text-xs text-stone-500 truncate">{book.author} | {book.publisher}</p>
                  <p className="text-xs text-amber-800 font-semibold mt-1">
                    {book.totalPages > 0 ? `📖 총 ${book.totalPages}쪽` : '📄 쪽수 미정 (확인 후 입력)'}
                  </p>
                </div>
                <button
                  className="ghost-button text-xs py-2 px-3"
                  style={{ borderColor: 'var(--accent)', color: 'var(--accent)', fontWeight: 'bold' }}
                  onClick={() => handleSelectSearchResult(book)}
                >
                  선택
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. 통합 독서 갤러리 */}
      <section>
        <div className="section-title-row">
          <div>
            <h2>통합 독서 서재</h2>
            <p className="subtitle">💡 <b>책 표지 이미지를 클릭</b>하면 상세 독서일지 작성, 문장수집, <b>AI 감상문</b>을 볼 수 있습니다.</p>
          </div>
        </div>

        {/* 서재 탭 */}
        <div className="library-tabs">
          <button
            className={`lib-tab-btn ${activeTab === 'challenge' ? 'active' : ''}`}
            onClick={() => setActiveTab('challenge')}
          >
            🎯 이번 챌린지 도서 ({currentChallenge ? books.filter((b) => b.challengeIds.includes(currentChallenge.id)).length : 0})
          </button>
          <button
            className={`lib-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            📚 전체 서재 ({books.length})
          </button>
          <button
            className={`lib-tab-btn ${activeTab === 'feed' ? 'active' : ''}`}
            onClick={() => setActiveTab('feed')}
          >
            📝 독서일지 & 문장 피드
          </button>
        </div>

        {/* 필터 및 정렬 바 (피드 탭이 아닐 때) */}
        {activeTab !== 'feed' && (
          <div className="filter-bar">
            <div className="filter-group">
              <button className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`} onClick={() => setStatusFilter('all')}>
                전체
              </button>
              <button className={`filter-btn ${statusFilter === 'reading' ? 'active' : ''}`} onClick={() => setStatusFilter('reading')}>
                읽는 중
              </button>
              <button className={`filter-btn ${statusFilter === 'done' ? 'active' : ''}`} onClick={() => setStatusFilter('done')}>
                완독
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-500">정렬:</span>
              <select
                className="text-xs py-1 px-2 border rounded-lg bg-white"
                style={{ width: 'auto' }}
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
              >
                <option value="latest">최신 등록순</option>
                <option value="progress">높은 완독률순</option>
                <option value="title">도서명 가나다순</option>
              </select>
            </div>
          </div>
        )}

        {/* 탭 내용: 타임라인 피드 */}
        {activeTab === 'feed' ? (
          <div className="panel space-y-4">
            {feedLoading ? (
              <p className="text-center py-10 text-stone-400">타임라인 기록 불러오는 중...</p>
            ) : timelineItems.length === 0 ? (
              <p className="text-center py-10 text-stone-400">작성된 독서일지나 문장수집이 없습니다.</p>
            ) : (
              timelineItems.map((item) => (
                <div key={item.id} className={`timeline-item ${item.type === 'insight' ? 'insight-type' : ''}`}>
                  <div className="flex justify-between items-center text-xs text-stone-500 mb-1">
                    <span className="font-bold text-amber-900">
                      {item.type === 'log' ? `📅 [독서일지] ${item.date} (${item.page}쪽)` : `💡 [문장수집] ${item.date} (${item.page})`}
                    </span>
                    <span className="text-stone-400 font-semibold">《{item.title}》</span>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-stone-800">{item.content}</p>
                </div>
              ))
            )}
          </div>
        ) : (
          /* 도서 카드 그리드 (기존 북튜닝 카드 스타일 100% 복원) */
          <div>
            {loading && books.length === 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="book-card animate-pulse" style={{ height: '280px' }}></div>
                ))}
              </div>
            ) : displayedBooks.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-stone-300 p-8">
                <div className="text-4xl mb-3">📖</div>
                <h3 className="text-base font-bold text-stone-700 mb-1">표시할 도서가 없습니다</h3>
                <p className="text-xs text-stone-500 mb-4">상단 검색창에서 도서를 검색해 서재에 추가해 보세요.</p>
              </div>
            ) : (
              <div className="book-gallery">
                {displayedBooks.map((book) => {
                  const isDone = (book.progressRate || 0) >= 100;
                  return (
                    <article key={book.id} className="book-card">
                      <div className="cover-wrap" onClick={() => setSelectedBook(book)}>
                        <div className="cover-badge">기록보기</div>
                        {isDone && (
                          <div className="author-badge" style={{ background: '#10b981', color: '#fff' }}>
                            ⭐ 완독
                          </div>
                        )}
                        {book.cover ? (
                          <img src={book.cover} alt={book.title} />
                        ) : (
                          <div className="flex items-center justify-center h-full text-center p-3 text-xs font-bold text-amber-900 bg-amber-100">
                            {book.title}
                          </div>
                        )}
                      </div>

                      <div className="book-card-body">
                        <div className="book-title" onClick={() => setSelectedBook(book)}>
                          {book.title}
                        </div>
                        <div className="book-meta truncate">{book.author || '저자 미상'}</div>

                        {/* 완독률 프로그레스 바 */}
                        <div className="progress-area">
                          <div className="progress-text">
                            <span>{book.readPages || 0} / {book.totalPage || '?'}쪽</span>
                            <span className="text-amber-800 font-bold">{book.progressRate || 0}%</span>
                          </div>
                          <div className="progress-bar">
                            <div
                              className="progress-fill"
                              style={{
                                width: `${Math.min(100, Math.max(0, book.progressRate || 0))}%`,
                                background: isDone ? '#10b981' : 'linear-gradient(90deg, var(--accent) 0%, var(--accent-dark) 100%)',
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>

      {/* 5. 푸터 (기존 북튜닝 v4.3 푸터 100% 복원) */}
      <footer className="app-footer">
        <p>만든이. <strong>기록조율사 서울외고 조용희</strong> <a href="https://www.instagram.com/record_tuner/" target="_blank" rel="noreferrer">@record_tuner</a></p>
        <p style={{ marginTop: '10px' }}>
          <a
            href="https://app.notion.com/p/record-tuner/29d9a421189580de9e13ea639a713518"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '13px', marginRight: '14px', fontWeight: 'bold', color: 'var(--accent)' }}
          >
            📚 노션 데이터베이스 열기 ↗
          </a>
          <a href="#" onClick={(e) => { e.preventDefault(); setShowPrivacyModal(true); }} style={{ fontSize: '13px', marginRight: '14px' }}>개인정보처리방침</a>
          <a href="#" onClick={(e) => { e.preventDefault(); setShowCopyrightModal(true); }} style={{ fontSize: '13px', marginRight: '14px' }}>저작권 및 이용 안내</a>
          <a href="#" onClick={(e) => { e.preventDefault(); alert('문의 사항은 @record_tuner 인스타그램 DM 또는 노션 페이지를 통해 접수해 주세요.'); }} style={{ fontSize: '13px' }}>지원/문의</a>
        </p>
      </footer>

      {/* ===================== 모달 (Modals) ===================== */}

      {/* 도서 상세 및 일지/문장/AI 모달 */}
      {selectedBook && (
        <BookDetailModal
          book={selectedBook}
          challenges={challenges}
          currentChallengeId={selectedChallengeId}
          onClose={() => setSelectedBook(null)}
          onRefresh={loadInitialData}
        />
      )}

      {/* 도서 직접 등록 / 확인 모달 */}
      {showManualBookModal && (
        <div className="modal">
          <div className="modal-backdrop" onClick={() => setShowManualBookModal(false)}></div>
          <div className="modal-card">
            <div className="section-title-row">
              <div>
                <h2>✍️ 도서 상세 정보 확인 및 등록</h2>
                <p className="subtitle">도서 정보를 확인하고 연결할 독서 챌린지를 지정하세요.</p>
              </div>
              <button className="ghost-button" onClick={() => setShowManualBookModal(false)}>닫기</button>
            </div>
            <form onSubmit={handleSubmitBook} className="space-y-3">
              <label>도서명 (제목) *
                <input
                  type="text"
                  placeholder="도서명을 입력하세요"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  required
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label>저자
                  <input
                    type="text"
                    placeholder="저자 이름"
                    value={manualAuthor}
                    onChange={(e) => setManualAuthor(e.target.value)}
                  />
                </label>
                <label>출판사
                  <input
                    type="text"
                    placeholder="출판사"
                    value={manualPublisher}
                    onChange={(e) => setManualPublisher(e.target.value)}
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label>전체 페이지수 (쪽) *
                  <input
                    type="number"
                    placeholder="예: 320"
                    value={manualPages}
                    onChange={(e) => setManualPages(e.target.value ? Number(e.target.value) : '')}
                    required
                  />
                </label>
                <label>연결할 챌린지
                  <select
                    value={manualTargetChallengeId}
                    onChange={(e) => setManualTargetChallengeId(e.target.value)}
                    className="w-full text-xs py-2 px-2 border rounded-xl bg-white"
                  >
                    {challenges.map((c) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label>표지 이미지 URL (선택)
                <input
                  type="text"
                  placeholder="https://..."
                  value={manualCover}
                  onChange={(e) => setManualCover(e.target.value)}
                />
              </label>
              <button
                type="submit"
                disabled={isSubmittingBook}
                className="w-full py-3 bg-amber-800 text-white font-bold rounded-xl shadow-md hover:bg-amber-900 transition mt-2"
              >
                {isSubmittingBook ? '노션에 등록 중...' : '서재 및 챌린지에 등록하기 ✨'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 챌린지 기간 설정 모달 */}
      {showPeriodModal && currentChallenge && (
        <ChallengeSettingsModal
          challenge={currentChallenge}
          onClose={() => setShowPeriodModal(false)}
          onUpdated={loadInitialData}
        />
      )}

      {/* AI 독서 리포트 모달 */}
      {showReportModal && currentChallenge && (
        <ChallengeReportModal
          challenge={currentChallenge}
          onClose={() => setShowReportModal(false)}
        />
      )}

      {/* 설정 모달 (테마 + 검색엔진 + 노션 링크) */}
      {showSettingsModal && (
        <div className="modal">
          <div className="modal-backdrop" onClick={() => setShowSettingsModal(false)}></div>
          <div className="modal-card" style={{ maxWidth: '480px' }}>
            <div className="section-title-row">
              <div>
                <h2>⚙️ 앱 환경 설정</h2>
                <p className="subtitle">서재 테마 및 검색 엔진을 설정합니다.</p>
              </div>
              <button className="ghost-button" onClick={() => setShowSettingsModal(false)}>닫기</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-2">서재 테마 선택</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'theme-base', name: '기본 (따뜻한 웜톤)' },
                    { id: 'theme-paper', name: '페이퍼 (종이책 감성)' },
                    { id: 'theme-forest', name: '포레스트 (차분한 녹음)' },
                    { id: 'theme-notion', name: '노션 (모던 클린)' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => changeTheme(t.id)}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border transition ${
                        theme === t.id
                          ? 'border-amber-700 bg-amber-100 text-amber-900 shadow-sm'
                          : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-2">도서 검색 엔진</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'aladin', label: '알라딘 (쪽수 100%)' },
                    { id: 'kakao', label: '카카오' },
                    { id: 'naver', label: '네이버' },
                  ].map((eng) => (
                    <button
                      key={eng.id}
                      onClick={() => changeSearchApiType(eng.id as any)}
                      className={`py-2 px-2 text-xs font-bold rounded-xl border transition ${
                        searchApiType === eng.id
                          ? 'border-amber-700 bg-amber-100 text-amber-900 shadow-sm'
                          : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      {eng.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 사용법 튜토리얼 모달 */}
      {showTutorialModal && (
        <div className="modal">
          <div className="modal-backdrop" onClick={() => setShowTutorialModal(false)}></div>
          <div className="modal-card" style={{ maxWidth: '640px' }}>
            <div className="section-title-row">
              <div>
                <span className="text-xs bg-amber-800 text-white font-bold px-2 py-0.5 rounded-full inline-block mb-1">Book Tuning v4.3</span>
                <h2>📖 북튜닝 사용 안내 가이드</h2>
              </div>
              <button className="ghost-button" onClick={() => setShowTutorialModal(false)}>닫기</button>
            </div>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 text-xs leading-relaxed text-stone-700">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <h4 className="font-bold text-amber-900 text-sm mb-1">🎯 1주 1권 챌린지 및 도서 연동</h4>
                <p>도서를 검색하거나 직접 등록하면 <strong>현재 선택된 월별 챌린지</strong>에 자동으로 연결됩니다. 일지를 기록하거나 문장을 수집할 때도 당월 챌린지에 차곡차곡 쌓여 월간 리포트 생성에 반영됩니다.</p>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <h4 className="font-bold text-stone-800 text-sm mb-1">📚 도서 검색 및 등록 팁</h4>
                <p>알라딘 검색 API를 활용하면 <strong>도서의 전체 쪽수가 100% 자동 채움</strong>되어 번거로운 입력이 필요 없습니다. 검색 후 확인 창에서 필요 시 수정하여 등록할 수 있습니다.</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-xl border border-orange-200">
                <h4 className="font-bold text-orange-950 text-sm mb-1">✨ Gemini AI 월간 독서 리포트</h4>
                <p>챌린지가 끝났을 때 <strong>[AI 독서 리포트]</strong> 버튼을 누르면 인상 깊은 문장과 메모들을 바탕으로 총평, 인사이트 셀렉션, 블로그 완성글이 자동 집필되며 노션 페이지 본문에 접이식 토글로 영구 저장됩니다.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 개발로그 모달 */}
      {showDevLogModal && (
        <div className="modal">
          <div className="modal-backdrop" onClick={() => setShowDevLogModal(false)}></div>
          <div className="modal-card" style={{ maxWidth: '640px' }}>
            <div className="section-title-row">
              <div><h2>📝 북튜닝 개발로그</h2></div>
              <button className="ghost-button" onClick={() => setShowDevLogModal(false)}>닫기</button>
            </div>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 text-xs leading-relaxed text-stone-700">
              <div className="border-b pb-2">
                <span className="font-bold text-amber-800 text-sm">v4.3 (개인 챌린지 전용) - 2026.10</span>
                <p className="mt-1">• 1주 1권 챌린지 DB(ea45d293) 실시간 연동 및 챌린지 선택기 탑재<br />• 1주/2주/1달/2달 챌린지 기간 세부 조절 기능 지원<br />• Gemini 2.5 Flash 기반 월간 리포트 및 블로그 글 노션 토글 블록 자동 박제<br />• 완독률 및 읽은 페이지 수식 정규식 정밀 보정 완료</p>
              </div>
              <div className="border-b pb-2">
                <span className="font-bold text-stone-600">v4.2 - 2026.10</span>
                <p className="mt-1">• 도서 3대 검색 엔진(알라딘 쪽수 추출, 카카오, 네이버) 구축<br />• 사진 촬영 기반 Gemini OCR 문장 자동 추출 기능 탑재</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 개인정보처리방침 모달 */}
      {showPrivacyModal && (
        <div className="modal">
          <div className="modal-backdrop" onClick={() => setShowPrivacyModal(false)}></div>
          <div className="modal-card" style={{ maxWidth: '560px' }}>
            <div className="section-title-row">
              <div><h2 style={{ color: 'var(--accent-dark)' }}>🛡️ 개인정보처리방침</h2></div>
              <button className="ghost-button" onClick={() => setShowPrivacyModal(false)}>닫기</button>
            </div>
            <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-2 text-xs leading-relaxed text-stone-700">
              <p><strong>1. 수집하는 정보</strong><br />본 개인 독서 서재는 불필요한 개인정보를 수집하지 않으며, 오직 독서 진도와 감상 기록만을 노션 개인 데이터베이스에 안전하게 동기화합니다.</p>
              <p><strong>2. API 키 및 데이터 보안</strong><br />모든 인증 키는 서버 사이드에서만 안전하게 동작하며 클라이언트 브라우저에 일체 노출되지 않습니다.</p>
            </div>
          </div>
        </div>
      )}

      {/* 저작권 및 이용 안내 모달 */}
      {showCopyrightModal && (
        <div className="modal">
          <div className="modal-backdrop" onClick={() => setShowCopyrightModal(false)}></div>
          <div className="modal-card" style={{ maxWidth: '560px' }}>
            <div className="section-title-row">
              <div><h2 style={{ color: 'var(--accent-dark)' }}>⚖️ 저작권 및 이용 안내</h2></div>
              <button className="ghost-button" onClick={() => setShowCopyrightModal(false)}>닫기</button>
            </div>
            <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-2 text-xs leading-relaxed text-stone-700">
              <p><strong>1. 권리자 (소유권)</strong><br />본 앱의 기획, 화면 설계 및 핵심 프롬프트 구조에 대한 모든 권리는 '기록조율사 서울외고 조용희'에게 있습니다.</p>
              <p><strong>2. 외부 API 라이선스 준수</strong><br />본 앱은 노션, 알라딘, 카카오, 네이버, Google Gemini API 등을 개인적·교육적 목적으로 안전하게 이용하고 있습니다.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
