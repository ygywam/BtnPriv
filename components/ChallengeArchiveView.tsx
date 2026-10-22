'use client';

import React from 'react';
import { Challenge } from '@/lib/types';

interface ChallengeArchiveViewProps {
  challenges: Challenge[];
  selectedChallengeId: string;
  onSelectChallenge: (id: string) => void;
}

export default function ChallengeArchiveView({
  challenges,
  selectedChallengeId,
  onSelectChallenge,
}: ChallengeArchiveViewProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-bold text-stone-800">
          역대 챌린지 아카이브 ({challenges.length}개)
        </h3>
        <span className="text-xs text-stone-500">
          카드를 클릭하면 해당 챌린지의 도서와 기록을 확인할 수 있습니다.
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {challenges.map((c) => {
          const isSelected = c.id === selectedChallengeId;
          return (
            <div
              key={c.id}
              onClick={() => onSelectChallenge(c.id)}
              className={`p-5 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-amber-50/70 border-amber-400 shadow-md ring-2 ring-amber-300'
                  : 'bg-white border-stone-200 hover:border-stone-300 hover:shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                    isSelected ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-600'
                  }`}>
                    {isSelected ? '선택됨' : c.status || '완료'}
                  </span>
                  <span className="text-xs text-stone-500 font-medium">
                    {c.startDate} ~ ({c.targetDays}일)
                  </span>
                </div>
                <h4 className="text-base font-bold text-stone-900 mb-2">
                  {c.title}
                </h4>

                {c.progressText && (
                  <div className="text-xs font-mono text-stone-600 line-clamp-3 bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                    {c.progressText}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                <span>연결 도서: {c.bookIds?.length || 0}권</span>
                <span className="text-amber-700 font-semibold group-hover:underline">
                  서재 보기 →
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
