'use client';

import React from 'react';

interface SettingsModalProps {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const notionPageUrl = 'https://app.notion.com/p/record-tuner/Book-Tuning-36c9a42118958035be6cf82a7f33d8fb?source=copy_link';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
          <h3 className="text-lg font-bold text-stone-900">환경 설정 및 연동 안내</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 text-lg">
            ✕
          </button>
        </div>

        <div className="space-y-4 text-xs text-stone-700 leading-relaxed">
          {/* 노션 링크 바로가기 */}
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200">
            <h4 className="font-bold text-amber-900 mb-1">📚 연결된 노션 독서 페이지</h4>
            <p className="text-amber-800 mb-3">
              현재 웹앱과 실시간 양방향 동기화되는 노션 페이지입니다.
            </p>
            <a
              href={notionPageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl transition shadow-sm text-xs"
            >
              <span>🔗</span> 노션 독서 기록장 페이지 열기 ↗
            </a>
          </div>

          {/* 보안 및 Vercel 환경변수 안내 */}
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
            <h4 className="font-bold text-stone-800 flex items-center gap-1.5">
              <span>🛡️</span> API 키 보안 및 Vercel 환경변수 설정
            </h4>
            <p className="text-stone-600">
              본 웹앱의 모든 API 키(Notion, Gemini, 알라딘, 네이버, 카카오)는 <strong>Next.js 백엔드 서버(Route Handlers)</strong>에서만 호출되므로 브라우저 개발자 도구의 Network 및 Sources 탭에 <strong>절대 노출되지 않습니다.</strong>
            </p>
            <div className="bg-stone-900 text-stone-100 p-3 rounded-xl font-mono text-[11px] overflow-x-auto">
              <code>
                NOTION_API_KEY=ntn_***<br />
                NOTION_CHALLENGE_DB_ID=ea45d293...<br />
                NOTION_BOOK_DB_ID=80ec125c...<br />
                NOTION_LOG_DB_ID=b3064ad0...<br />
                NOTION_INSIGHT_DB_ID=ceb9a421...<br />
                GEMINI_API_KEY=AIzaSy...<br />
                ALADIN_API_KEY=ttb...<br />
                KAKAO_REST_API_KEY=...<br />
                NAVER_CLIENT_ID=...<br />
                NAVER_CLIENT_SECRET=...
              </code>
            </div>
            <p className="text-[11px] text-stone-500">
              Vercel 대시보드 ➔ Settings ➔ Environment Variables 에 위 키들을 등록하면 안전하게 배포 및 운영됩니다.
            </p>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-stone-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-semibold rounded-xl transition"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
