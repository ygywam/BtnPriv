'use client';

import React from 'react';
import { Challenge } from '@/lib/types';

interface ManualBookModalProps {
  challenges: Challenge[];
  manualTitle: string;
  setManualTitle: (v: string) => void;
  manualAuthor: string;
  setManualAuthor: (v: string) => void;
  manualPublisher: string;
  setManualPublisher: (v: string) => void;
  manualPages: number | '';
  setManualPages: (v: number | '') => void;
  manualCover: string;
  setManualCover: (v: string) => void;
  manualTargetChallengeId: string;
  setManualTargetChallengeId: (v: string) => void;
  isSubmittingBook: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

/**
 * 도서 직접 등록 및 검색 결과 확인 모달
 */
export default function ManualBookModal({
  challenges,
  manualTitle,
  setManualTitle,
  manualAuthor,
  setManualAuthor,
  manualPublisher,
  setManualPublisher,
  manualPages,
  setManualPages,
  manualCover,
  setManualCover,
  manualTargetChallengeId,
  setManualTargetChallengeId,
  isSubmittingBook,
  onSubmit,
  onClose,
}: ManualBookModalProps) {
  return (
    <div className="modal">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card">
        <div className="section-title-row">
          <div>
            <h2>✍️ 도서 상세 정보 확인 및 등록</h2>
            <p className="subtitle">도서 정보를 확인하고 연결할 독서 챌린지를 지정하세요.</p>
          </div>
          <button type="button" className="ghost-button" onClick={onClose}>
            닫기
          </button>
        </div>

        <div className="p-2.5 mb-2 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-stone-700 leading-relaxed">
          💡 <strong>카카오 + 국립중앙도서관(NL) 하이브리드 연동</strong><br />
          검색된 도서 선택 시, 표지/서지 정보와 함께 <strong>국립중앙도서관 서지정보 API</strong>에서 총 페이지 수(쪽수)를 자동으로 조회해 채워줍니다. 필요 시 직접 수정할 수도 있습니다.
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <label>
            도서명 (제목) *
            <input
              type="text"
              placeholder="도서명을 입력하세요"
              value={manualTitle}
              onChange={(e) => setManualTitle(e.target.value)}
              required
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label>
              저자
              <input
                type="text"
                placeholder="저자 이름"
                value={manualAuthor}
                onChange={(e) => setManualAuthor(e.target.value)}
              />
            </label>
            <label>
              출판사
              <input
                type="text"
                placeholder="출판사"
                value={manualPublisher}
                onChange={(e) => setManualPublisher(e.target.value)}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label>
              전체 페이지수 (쪽) *
              <input
                type="number"
                placeholder="예: 320"
                value={manualPages}
                onChange={(e) => setManualPages(e.target.value ? Number(e.target.value) : '')}
                required
              />
            </label>
            <label>
              연결할 챌린지
              <select
                value={manualTargetChallengeId}
                onChange={(e) => setManualTargetChallengeId(e.target.value)}
                className="w-full text-xs py-2 px-2 border rounded-xl bg-white"
              >
                {challenges.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            표지 이미지 URL (선택)
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
  );
}
