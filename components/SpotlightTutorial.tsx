'use client';

import React, { useCallback, useEffect, useState } from 'react';

interface TourStep {
  selector: string | null;
  badge: string;
  title: string;
  description: string;
  isVideoStep?: boolean;
}

const TOUR_STEPS: TourStep[] = [
  {
    selector: '[data-tour="search-bar"]',
    badge: '검색 & 등록',
    title: '도서 검색 및 직접 등록',
    description:
      '책 제목이나 저자를 검색해 서재와 챌린지에 바로 추가할 수 있어요. 직접 등록 버튼으로 수동 입력도 가능합니다.',
  },
  {
    selector: '[data-tour="reading-now"]',
    badge: '지금 읽는 책',
    title: '읽고 있는 책 바로 기록하기',
    description:
      '아직 완독하지 않은 책들의 진행률이 표시돼요. 책 카드를 누르면 독서일지, 문장수집, AI 감상문 창이 열립니다.',
  },
  {
    selector: '[data-tour="calendar"]',
    badge: '챌린지 캘린더',
    title: '챌린지 기간 달력 & 목표 권수',
    description:
      '독서 기록을 남긴 날이 달력에 색칠되고, 오른쪽 도넛 차트로 등록 권수 대비 완독 목표를 확인해요. 설정과 AI 리포트도 여기서 실행합니다.',
  },
  {
    selector: '[data-tour="recent-feed"]',
    badge: '최근 기록',
    title: '최근 독서기록 모아보기',
    description:
      '현재 챌린지 책들에 남긴 최신 일지와 문장이 쌓여요. 전체보기를 누르면 시간순 피드 탭으로 이동합니다.',
  },
  {
    selector: '[data-tour="main-nav"]',
    badge: '5대 메뉴',
    title: '홈 · 서재 · 챌린지 · 피드 · 도감',
    description:
      '서재(Dock 휠 캐러셀), 챌린지 카드 목록, 시간순 피드, 완독 표지 도감까지 5개 화면을 한 번에 오갈 수 있어요.',
  },
  {
    selector: '[data-tour="header-utils"]',
    badge: '환경 & 로그',
    title: '개발로그 & 앱 설정',
    description:
      '개발로그에서 v1.0~v4.4 포스트잇 히스토리를 넘겨보고, 설정에서 테마와 도서 검색 엔진(알라딘/카카오/네이버)을 바꿀 수 있어요.',
  },
  {
    selector: null,
    badge: '홍보 & 사용 영상',
    title: '🎬 북튜닝 소개 및 사용 가이드 영상',
    description: '북튜닝의 핵심 활용 흐름을 짧은 영상으로 만나보세요.',
    isVideoStep: true,
  },
];

interface SpotlightTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onEnsureHomeTab: () => void;
}

interface HighlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * 바깥 영역을 블러 처리하고 대상 버튼/섹션을 박스로 강조하며 포스트잇이 따라다니는 인터랙티브 사용법 투어
 */
export default function SpotlightTutorial({
  isOpen,
  onClose,
  onEnsureHomeTab,
}: SpotlightTutorialProps) {
  const [stepIdx, setStepIdx] = useState(0);
  const [rect, setRect] = useState<HighlightRect | null>(null);
  const [viewport, setViewport] = useState({ width: 1024, height: 768 });

  const currentStep = TOUR_STEPS[stepIdx];

  // 투어가 열릴 때 홈 탭으로 이동 & 첫 단계로 초기화
  useEffect(() => {
    if (isOpen) {
      setStepIdx(0);
      onEnsureHomeTab();
    }
  }, [isOpen, onEnsureHomeTab]);

  // 현재 단계의 대상 DOM 위치 측정 (모바일/PC 중 실제로 보이는 요소 우선 선택)
  const measureTarget = useCallback(
    (shouldScroll: boolean) => {
      if (!isOpen) return;
      setViewport({ width: window.innerWidth, height: window.innerHeight });

      if (!currentStep.selector) {
        setRect(null);
        return;
      }

      const candidates = Array.from(document.querySelectorAll(currentStep.selector)) as HTMLElement[];
      const target = candidates.find((el) => {
        const style = window.getComputedStyle(el);
        const b = el.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' && b.width > 0 && b.height > 0;
      });

      if (!target) {
        setRect(null);
        return;
      }

      if (shouldScroll) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      const updateRect = () => {
        const b = target.getBoundingClientRect();
        const pad = 6;
        setRect({
          top: Math.max(4, b.top - pad),
          left: Math.max(4, b.left - pad),
          width: Math.min(window.innerWidth - 8, b.width + pad * 2),
          height: b.height + pad * 2,
        });
      };

      updateRect();
      if (shouldScroll) {
        setTimeout(updateRect, 320);
      }
    },
    [isOpen, currentStep.selector]
  );

  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => measureTarget(true), 60);
    const onResizeOrScroll = () => measureTarget(false);
    window.addEventListener('resize', onResizeOrScroll);
    window.addEventListener('scroll', onResizeOrScroll, true);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', onResizeOrScroll);
      window.removeEventListener('scroll', onResizeOrScroll, true);
    };
  }, [isOpen, stepIdx, measureTarget]);

  // ESC 키로 종료, 좌우 방향키로 단계 이동
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setStepIdx((s) => Math.min(TOUR_STEPS.length - 1, s + 1));
      if (e.key === 'ArrowLeft') setStepIdx((s) => Math.max(0, s - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isMobile = viewport.width < 640;
  const noteWidth = isMobile ? Math.min(310, viewport.width - 24) : 340;

  // 포스트잇 말풍선 위치 계산 (강조 박스 아래 우선, 공간 부족 시 위)
  let noteTop = Math.max(20, viewport.height / 2 - 110);
  let noteLeft = Math.max(12, (viewport.width - noteWidth) / 2);

  if (rect && !currentStep.isVideoStep) {
    const spaceBelow = viewport.height - (rect.top + rect.height);
    const noteEstHeight = 195;
    if (spaceBelow >= noteEstHeight + 16) {
      noteTop = rect.top + rect.height + 14;
    } else if (rect.top >= noteEstHeight + 16) {
      noteTop = rect.top - noteEstHeight - 14;
    } else {
      noteTop = Math.max(12, viewport.height - noteEstHeight - 16);
    }
    const desiredLeft = rect.left + rect.width / 2 - noteWidth / 2;
    noteLeft = Math.max(12, Math.min(desiredLeft, viewport.width - noteWidth - 12));
  }

  return (
    <div className="tour-overlay-root" role="dialog" aria-modal="true" aria-label="북튜닝 사용법 투어">
      {/* 바깥 영역 블러 & 딤드 처리 (대상 영역이 있으면 4분할로 구멍을 뚫어 대상만 선명하게 강조) */}
      {rect && !currentStep.isVideoStep ? (
        <>
          <div
            className="tour-blur-pane"
            style={{ top: 0, left: 0, right: 0, height: `${rect.top}px` }}
            onClick={onClose}
          />
          <div
            className="tour-blur-pane"
            style={{ top: `${rect.top + rect.height}px`, left: 0, right: 0, bottom: 0 }}
            onClick={onClose}
          />
          <div
            className="tour-blur-pane"
            style={{ top: `${rect.top}px`, left: 0, width: `${rect.left}px`, height: `${rect.height}px` }}
            onClick={onClose}
          />
          <div
            className="tour-blur-pane"
            style={{
              top: `${rect.top}px`,
              left: `${rect.left + rect.width}px`,
              right: 0,
              height: `${rect.height}px`,
            }}
            onClick={onClose}
          />
          {/* 강조 박스 테두리 */}
          <div
            className="tour-spotlight-ring"
            style={{
              top: `${rect.top}px`,
              left: `${rect.left}px`,
              width: `${rect.width}px`,
              height: `${rect.height}px`,
            }}
          />
        </>
      ) : (
        <div className="tour-blur-pane" style={{ inset: 0 }} onClick={onClose} />
      )}

      {/* 마지막 단계: 홍보 & 사용 가이드 영상 카드 */}
      {currentStep.isVideoStep ? (
        <div className="tour-video-postit">
          <div className="devlog-postit-tape" aria-hidden="true" />
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="tour-step-pill">
                {stepIdx + 1} / {TOUR_STEPS.length}
              </span>
              <span className="text-xs font-extrabold text-amber-900">{currentStep.badge}</span>
            </div>
            <button type="button" className="tour-close-x" onClick={onClose}>
              닫기
            </button>
          </div>

          <h3 className="text-base sm:text-lg font-extrabold text-stone-900 mb-1">{currentStep.title}</h3>
          <p className="text-xs text-stone-600 mb-3">{currentStep.description}</p>

          <div className="rounded-xl overflow-hidden bg-stone-900 aspect-video flex items-center justify-center shadow-md mb-3">
            <video controls playsInline preload="metadata" className="w-full h-full object-contain" poster="/icon.svg">
              <source src="/booktuning_intro.mp4" type="video/mp4" />
              <source src="/북튜닝_홍보영상_booktuning.mp4" type="video/mp4" />
              브라우저가 동영상 재생을 지원하지 않습니다.
            </video>
          </div>

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              className="tour-nav-btn is-prev"
              onClick={() => setStepIdx((s) => Math.max(0, s - 1))}
            >
              ‹ 이전
            </button>
            <button type="button" className="tour-nav-btn is-done" onClick={onClose}>
              사용법 마침 ✨
            </button>
          </div>
        </div>
      ) : (
        /* 따라다니는 포스트잇 설명 카드 */
        <div
          className="tour-postit-card"
          style={{
            top: `${noteTop}px`,
            left: `${noteLeft}px`,
            width: `${noteWidth}px`,
          }}
        >
          <div className="devlog-postit-tape" aria-hidden="true" />
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="tour-step-pill">
                {stepIdx + 1} / {TOUR_STEPS.length}
              </span>
              <span className="text-[11px] font-extrabold text-amber-900">{currentStep.badge}</span>
            </div>
            <button type="button" className="tour-close-x" onClick={onClose}>
              건너뛰기
            </button>
          </div>

          <h3 className="text-sm sm:text-[15px] font-extrabold text-stone-900 mb-1.5">
            {currentStep.title}
          </h3>
          <p className="text-xs text-stone-700 leading-relaxed mb-3.5">{currentStep.description}</p>

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-amber-900/10">
            <button
              type="button"
              className="tour-nav-btn is-prev"
              onClick={() => setStepIdx((s) => Math.max(0, s - 1))}
              disabled={stepIdx === 0}
            >
              ‹ 이전
            </button>
            <button
              type="button"
              className="tour-nav-btn is-next"
              onClick={() => setStepIdx((s) => Math.min(TOUR_STEPS.length - 1, s + 1))}
            >
              다음 ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
