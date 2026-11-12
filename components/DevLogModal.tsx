'use client';

import React, { useRef, useState } from 'react';
import { DEV_LOG_VERSIONS, DevLogEntry } from '@/lib/devLogs';

function renderCardIcon(type: DevLogEntry['iconType']) {
  const cls = 'w-7 h-7 text-stone-700/80';
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
 * 포스트잇 스타일 가로 스크롤 개발로그 모달 (마우스 휠 + 드래그 + 화살표 지원)
 */
export default function DevLogModal({ onClose }: DevLogModalProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, scrollLeft: 0 });

  // 마우스 세로 휠을 가로 스크롤로 부드럽게 변환
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = trackRef.current;
    if (!el) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      el.scrollLeft += e.deltaY * 1.15;
    }
  };

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

  return (
    <div className="modal">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card devlog-modal-card" style={{ maxWidth: '900px' }}>
        <div className="section-title-row mb-2">
          <div>
            <h2>📝 북튜닝 개발로그 ({DEV_LOG_VERSIONS.length}개 버전)</h2>
            <p className="subtitle">마우스 휠이나 드래그로 v1.0부터 v4.4까지 포스트잇 카드를 가로로 넘겨보세요.</p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => scrollByCard(-1)}
              className="devlog-arrow-btn"
              aria-label="이전 버전 카드"
              title="이전 카드"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => scrollByCard(1)}
              className="devlog-arrow-btn"
              aria-label="다음 버전 카드"
              title="다음 카드"
            >
              ›
            </button>
            <button type="button" className="ghost-button ml-1" onClick={onClose}>
              닫기
            </button>
          </div>
        </div>

        {/* 가로 포스트잇 캐러셀 트랙 */}
        <div
          ref={trackRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDragging}
          onMouseLeave={stopDragging}
          className={`devlog-postit-track ${isDragging ? 'is-dragging' : ''}`}
        >
          {DEV_LOG_VERSIONS.map((item) => (
            <article
              key={item.version}
              className={`devlog-postit-card bg-gradient-to-br ${item.gradientClass} ${item.tiltClass}`}
            >
              {/* 상단 포스트잇 테이프 장식 */}
              <div className="devlog-postit-tape" aria-hidden="true" />

              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-stone-500 font-bold">( {item.number} )</span>
                  <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full shadow-sm ${item.badgeClass}`}>
                    {item.version}
                  </span>
                </div>
                {renderCardIcon(item.iconType)}
              </div>

              <div className="mb-3">
                <div className="text-[11px] font-bold text-stone-500 mb-0.5">{item.date}</div>
                <h3 className="text-sm sm:text-base font-extrabold text-stone-900 leading-snug">
                  {item.title}
                </h3>
              </div>

              <ul className="space-y-1.5 text-xs text-stone-700 leading-relaxed flex-1 overflow-y-auto pr-1">
                {item.items.map((line, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-amber-700 font-bold mt-0.5 flex-shrink-0">•</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-3 pt-2 border-t border-black/5 flex items-center justify-between text-[10.5px] text-stone-500 font-semibold">
                <span>Book Tuning Note</span>
                <span>{item.version}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
