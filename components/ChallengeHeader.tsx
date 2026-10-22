'use client';

import React from 'react';
import { Challenge } from '@/lib/types';

interface ChallengeHeaderProps {
  currentChallenge: Challenge | null;
  onOpenSettings: () => void;
  onOpenReport: () => void;
  isLoading: boolean;
}

export default function ChallengeHeader({
  currentChallenge,
  onOpenSettings,
  onOpenReport,
  isLoading,
}: ChallengeHeaderProps) {
  if (isLoading && !currentChallenge) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200 animate-pulse mb-8">
        <div className="h-6 bg-stone-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-stone-100 rounded w-1/2 mb-2"></div>
        <div className="h-3 bg-stone-100 rounded w-full"></div>
      </div>
    );
  }

  if (!currentChallenge) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50/40 rounded-2xl p-6 shadow-sm border border-amber-200/60 mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-500 text-white">
              현재 챌린지
            </span>
            <span className="text-xs text-stone-500 font-medium">
              {currentChallenge.startDate} 시작 ({currentChallenge.targetDays}일간)
            </span>
          </div>
          <h2 className="text-2xl font-bold text-stone-800 tracking-tight">
            {currentChallenge.title}
          </h2>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenSettings}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-xl bg-white hover:bg-stone-50 text-stone-700 border border-stone-300 shadow-sm transition"
          >
            <span>⚙️</span> 기간 조절
          </button>
          <button
            onClick={onOpenReport}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-sm transition"
          >
            <span>✨</span> AI 독서 리포트
          </button>
        </div>
      </div>

      {/* 진행상황 및 노션 수식 잔디 바 */}
      {currentChallenge.progressText && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-amber-100">
          <div className="text-xs font-semibold text-amber-800/80 mb-1.5">
            독서 챌린지 달성 현황
          </div>
          <div className="text-sm font-medium text-stone-700 whitespace-pre-line font-mono leading-relaxed">
            {currentChallenge.progressText}
          </div>
        </div>
      )}
    </div>
  );
}
