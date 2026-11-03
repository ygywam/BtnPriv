'use client';

import React, { useState } from 'react';
import { Challenge } from '@/lib/types';
import { getDaysInMonth } from '@/lib/challengeHelper';

interface ChallengeSettingsModalProps {
  challenge: Challenge;
  onClose: () => void;
  onUpdated: () => void;
}

export default function ChallengeSettingsModal({
  challenge,
  onClose,
  onUpdated,
}: ChallengeSettingsModalProps) {
  const [startDate, setStartDate] = useState(challenge.startDate || new Date().toISOString().slice(0, 10));
  const [targetDays, setTargetDays] = useState<number>(challenge.targetDays || 30);
  const [title, setTitle] = useState(challenge.title || '');
  const [isUpdating, setIsUpdating] = useState(false);

  // 프리셋 적용 함수
  const applyPreset = (days: number, label: string) => {
    setTargetDays(days);
    const start = new Date(startDate);
    const year = start.getFullYear();
    const month = start.getMonth() + 1;

    if (days === 7) {
      setTitle(`${year}년 ${month}월 1주 챌린지(7일)`);
    } else if (days === 14) {
      setTitle(`${year}년 ${month}월 2주 챌린지(14일)`);
    } else if (days === 61 || days === 60) {
      const nextMonth = month === 12 ? 1 : month + 1;
      setTitle(`${year}년 ${month}-${nextMonth}월 챌린지(${days}일)`);
    } else {
      const lastDay = getDaysInMonth(year, month);
      setTargetDays(lastDay);
      setTitle(`${year}년 ${month}월 챌린지(${month}/1~${month}/${lastDay})`);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !targetDays) {
      alert('시작일과 희망 일수는 필수입니다.');
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_period',
          challengeId: challenge.id,
          startDate,
          targetDays: Number(targetDays),
          title,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '수정 실패');
      }

      alert('챌린지 기간 및 일수가 노션에 성공적으로 반영되었습니다!');
      onUpdated();
      onClose();
    } catch (err: any) {
      alert('오류 발생: ' + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="modal">
      <div className="modal-backdrop" onClick={onClose}></div>
      <div className="modal-card" style={{ maxWidth: '520px' }}>
        <div className="section-title-row">
          <div>
            <h2>⚙️ 챌린지 기간 및 일수 조절</h2>
            <p className="subtitle">
              노션 챌린지 DB의 시작일과 희망 일수를 수정합니다.
            </p>
          </div>
          <button
            type="button"
            className="px-4 py-2 text-xs font-bold rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 transition"
            onClick={onClose}
          >
            닫기
          </button>
        </div>

        {/* 기간 프리셋 버튼 그룹 (고대비 및 가독성 보장) */}
        <div className="mb-5">
          <label className="block text-xs font-bold text-stone-700 mb-2">
            간편 프리셋 선택
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <button
              type="button"
              onClick={() => applyPreset(7, '1주')}
              className={`px-3 py-2.5 text-xs font-bold rounded-xl border-2 transition shadow-sm flex items-center justify-center text-center ${
                targetDays === 7
                  ? 'bg-amber-700 text-white border-amber-700 shadow-md'
                  : 'bg-white text-stone-800 border-stone-200 hover:border-amber-600 hover:bg-amber-50'
              }`}
            >
              1주일 (7일)
            </button>
            <button
              type="button"
              onClick={() => applyPreset(14, '2주')}
              className={`px-3 py-2.5 text-xs font-bold rounded-xl border-2 transition shadow-sm flex items-center justify-center text-center ${
                targetDays === 14
                  ? 'bg-amber-700 text-white border-amber-700 shadow-md'
                  : 'bg-white text-stone-800 border-stone-200 hover:border-amber-600 hover:bg-amber-50'
              }`}
            >
              2주일 (14일)
            </button>
            <button
              type="button"
              onClick={() => applyPreset(31, '1달')}
              className={`px-3 py-2.5 text-xs font-bold rounded-xl border-2 transition shadow-sm flex items-center justify-center text-center ${
                targetDays >= 28 && targetDays <= 31
                  ? 'bg-amber-700 text-white border-amber-700 shadow-md'
                  : 'bg-white text-stone-800 border-stone-200 hover:border-amber-600 hover:bg-amber-50'
              }`}
            >
              1달 (당월 말일)
            </button>
            <button
              type="button"
              onClick={() => applyPreset(61, '2달 연속')}
              className={`px-3 py-2.5 text-xs font-bold rounded-xl border-2 transition shadow-sm flex items-center justify-center text-center ${
                targetDays === 60 || targetDays === 61
                  ? 'bg-amber-700 text-white border-amber-700 shadow-md'
                  : 'bg-white text-stone-800 border-stone-200 hover:border-amber-600 hover:bg-amber-50'
              }`}
            >
              2달 연속 (61일)
            </button>
          </div>
        </div>

        {/* 상세 폼 (모바일 겹침 방지) */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">챌린지 이름</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-stone-900 box-border"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">챌린지 시작일</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-stone-900 box-border min-w-0"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">희망 일수 (목표 일수)</label>
              <input
                type="number"
                min={1}
                max={365}
                value={targetDays}
                onChange={(e) => setTargetDays(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold bg-white text-stone-900 box-border min-w-0"
                required
              />
            </div>
          </div>

          <div className="p-3 bg-amber-50 rounded-xl text-xs text-amber-900 border border-amber-200/80 leading-relaxed">
            💡 <strong>노션 자동 수식 안내</strong>: 희망 일수를 변경하면 노션의 <code>*목표 종료일</code>과 <code>*진행상황</code> 잔디 계산 수식이 즉시 새로운 기간에 맞춰 자동 재계산됩니다.
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 transition"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="px-5 py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-md transition disabled:opacity-50"
            >
              {isUpdating ? '저장 중...' : '노션에 반영하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
