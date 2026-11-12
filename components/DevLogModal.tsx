'use client';

import React, { useEffect, useRef, useState } from 'react';
import { DEV_LOG_VERSIONS, DevLogEntry } from '@/lib/devLogs';

function renderCardIcon(type: DevLogEntry['iconType']) {
  const cls = 'w-6 h-6 text-stone-700/80';
  switch (type) {
    case 'layout':
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth={1.7}>
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <path d="M3 9h18M9 21V9" />
        </svg>
      );
    case 'video':
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth={1.7}>
          <rect x="3" y="5" width="18" height="14" rx="3" />
          <polygon points="10,9 16,12 10,15" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'mobile':
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth={1.7}>
          <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
          <path d="M10.5 18.5h3" strokeLinecap="round" />
        </svg>
      );
    case 'book':
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth={1.7}>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      );
    case 'spark':
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth={1.7}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l2.2 5.6L20 10.5l-5.8 2L12 18l-2.2-5.5L4 10.5l5.8-1.9L12 3z" />
        </svg>
      );
    case 'search':
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth={1.7}>
          <circle cx="11" cy="11" r="7" />
          <path strokeLinecap="round" d="M20 20l-3.5-3.5" />
        </svg>
      );
  }
}

interface DevLogModalProps {
  onClose: () => void;
}

/**
 * macOS Dock 스타일 포스트잇 가로 휠 캐러셀 개발로그 모달
 */
export default function DevLogModal({ onClose }: DevLogModalProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, scrollLeft: 0 });

  // 서재와 동일한 non-passive 네이티브 휠 리스너 + 배경 스크롤 잠금
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const shell = shellRef.current;
    const onNativeWheel = (e: WheelEvent) => {
      const track = trackRef.current;
      if (!track) return;
      if (Math.abs(e.deltaY) >= Math.abs(e.deltaX)) {
        e.preventDefault();
        e.stopPropagation();
        track.scrollLeft += e.deltaY * 1.3;
      }
    };

    if (shell) {
      shell.addEventListener('wheel', onNativeWheel, { passive: false });
    }

    return () => {
      document.body.style.overflow = prevOverflow;
      if (shell) {
        shell.removeEventListener('wheel', onNativeWheel);
      }
    };
  }, []);

  const scrollByCard = (direction: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * 290, behavior: 'smooth' });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = trackRef.current;
    if (!el) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.pageX - el.offsetLeft, scrollLeft: el.scrollLeft };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !trackRef.current) return;
    e.preventDefault();
    const x = e.pageX - trackRef.current.offsetLeft;
    const walk = (x - dragStartRef.current.x) * 1.25;
    trackRef.current.scrollLeft = dragStartRef.current.scrollLeft - walk;
  };

  const stopDragging = () => setIsDragging(false);

  // macOS Dock 물결 확대 스타일
  const getDockCardStyle = (index: number, item: DevLogEntry): React.CSSProperties => {
    const base: React.CSSProperties = {
      background: item.cardBg,
      borderColor: item.cardBorder,
    };
    if (hoveredIdx === null) return base;
    const dist = Math.abs(hoveredIdx - index);
    if (dist === 0) {
      return { ...base, transform: 'translateY(-14px) scale(1.09) rotate(0deg)', zIndex: 30 };
    }
    if (dist === 1) {
      return { ...base, transform: 'translateY(-5px) scale(1.03)', zIndex: 20 };
    }
    return { ...base, opacity: 0.85 };
  };

  return (
    <div ref={shellRef} className="modal">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card devlog-modal-card" style={{ maxWidth: '920px' }}>
        <div className="section-title-row mb-0">
          <h2>📝 북튜닝 개발로그</h2>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => scrollByCard(-1)}
              className="devlog-arrow-btn"
              aria-label="이전 버전 카드"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => scrollByCard(1)}
              className="devlog-arrow-btn"
              aria-label="다음 버전 카드"
            >
              ›
            </button>
            <button type="button" className="ghost-button ml-1" onClick={onClose}>
              닫기
            </button>
          </div>
        </div>

        {/* 가로 포스트잇 Dock 캐러셀 트랙 */}
        <div
          ref={trackRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDragging}
          onMouseLeave={() => {
            stopDragging();
            setHoveredIdx(null);
          }}
          className={`devlog-postit-track ${isDragging ? 'is-dragging' : ''}`}
        >
          {DEV_LOG_VERSIONS.map((item, idx) => {
            const isFocused = hoveredIdx === idx;
            return (
              <article
                key={item.version}
                className={`devlog-postit-card ${item.tiltClass} ${isFocused ? 'is-focused' : ''}`}
                style={getDockCardStyle(idx, item)}
                onMouseEnter={() => setHoveredIdx(idx)}
              >
                <div className="devlog-postit-tape" aria-hidden="true" />

                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-stone-500 font-bold">( {item.number} )</span>
                    <span
                      className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full shadow-sm"
                      style={{ backgroundColor: item.badgeBg, color: '#ffffff' }}
                    >
                      {item.version}
                    </span>
                  </div>
                  {renderCardIcon(item.iconType)}
                </div>

                <div className="mb-2.5">
                  <div className="text-[11px] font-bold text-stone-500 mb-0.5">{item.date}</div>
                  <h3 className="text-sm sm:text-[15px] font-extrabold text-stone-900 leading-snug">
                    {item.title}
                  </h3>
                </div>

                <ul className="space-y-1.5 text-[11.5px] sm:text-xs text-stone-700 leading-relaxed flex-1">
                  {item.items.map((line, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-amber-700 font-bold mt-0.5 flex-shrink-0">•</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
