'use client';

import React from 'react';

export type MainTabId = 'home' | 'library' | 'challenge' | 'feed' | 'dex';

interface BottomNavProps {
  activeTab: MainTabId;
  onChange: (tab: MainTabId) => void;
  counts?: {
    reading?: number;
    books?: number;
    challenges?: number;
    feed?: number;
    dex?: number;
  };
}

const NAV_ITEMS: Array<{
  id: MainTabId;
  label: string;
  renderIcon: (active: boolean) => React.ReactNode;
}> = [
  {
    id: 'home',
    label: '홈',
    renderIcon: (active) => (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 1.8 : 1.7}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5.5v-6.5h-5V21H4a1 1 0 0 1-1-1v-9.5z" />
      </svg>
    ),
  },
  {
    id: 'library',
    label: '서재',
    renderIcon: (active) => (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={active ? 2.1 : 1.7}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 5.5A1.5 1.5 0 0 1 5.5 4h2A1.5 1.5 0 0 1 9 5.5v13A1.5 1.5 0 0 1 7.5 20h-2A1.5 1.5 0 0 1 4 18.5v-13zm5.5 0A1.5 1.5 0 0 1 11 4h2a1.5 1.5 0 0 1 1.5 1.5v13A1.5 1.5 0 0 1 13 20h-2a1.5 1.5 0 0 1-1.5-1.5v-13zm5.8.6a1.5 1.5 0 0 1 1.1-1.8l1.9-.5a1.5 1.5 0 0 1 1.8 1.1l2.8 12.6a1.5 1.5 0 0 1-1.1 1.8l-1.9.5a1.5 1.5 0 0 1-1.8-1.1L15.3 6.1z" />
      </svg>
    ),
  },
  {
    id: 'challenge',
    label: '챌린지',
    renderIcon: (active) => (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.7}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 4h10v5a5 5 0 0 1-10 0V4zM7 6H4v2a3 3 0 0 0 3 3m10-5h3v2a3 3 0 0 1-3 3m-5 3v4m-3.5 3h7" />
      </svg>
    ),
  },
  {
    id: 'feed',
    label: '피드',
    renderIcon: (active) => (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.7}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h6m-8 8l3.2-2.6H19a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9.4A2 2 0 0 0 5 17.4V20z" />
      </svg>
    ),
  },
  {
    id: 'dex',
    label: '도감',
    renderIcon: (active) => (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.7}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 13.5c-2.6 0-5 2-5 4.3 0 1.4 1.1 2.2 2.5 2.2.9 0 1.7-.4 2.5-.4s1.6.4 2.5.4c1.4 0 2.5-.8 2.5-2.2 0-2.3-2.4-4.3-5-4.3z" />
        <circle cx="7" cy="9.5" r="1.4" />
        <circle cx="10.2" cy="6.8" r="1.4" />
        <circle cx="13.8" cy="6.8" r="1.4" />
        <circle cx="17" cy="9.5" r="1.4" />
      </svg>
    ),
  },
];

/**
 * PC(상단 가로 탭) 및 모바일(하단 고정 5탭 바) 공용 내비게이션 컴포넌트
 */
export default function BottomNav({ activeTab, onChange, counts }: BottomNavProps) {
  const getBadge = (id: MainTabId) => {
    if (!counts) return undefined;
    if (id === 'library' && typeof counts.books === 'number') return counts.books;
    if (id === 'challenge' && typeof counts.challenges === 'number') return counts.challenges;
    if (id === 'dex' && typeof counts.dex === 'number') return counts.dex;
    return undefined;
  };

  return (
    <>
      {/* PC용 상단 내비게이션 탭 (768px 이상) */}
      <nav className="desktop-top-nav" aria-label="주 메뉴">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          const badge = getBadge(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={`desktop-nav-btn ${isActive ? 'active' : ''}`}
            >
              <span className="inline-flex items-center justify-center">{item.renderIcon(isActive)}</span>
              <span>{item.label}</span>
              {typeof badge === 'number' && (
                <span className={`desktop-nav-badge ${isActive ? 'active' : ''}`}>{badge}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* 모바일용 하단 고정 바텀 내비게이션 (767px 이하) */}
      <nav className="mobile-bottom-nav" aria-label="모바일 하단 메뉴">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={`mobile-nav-btn ${isActive ? 'active' : ''}`}
            >
              <span className="mobile-nav-icon">{item.renderIcon(isActive)}</span>
              <span className="mobile-nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
