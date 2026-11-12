'use client';

import React from 'react';
import DevLogModal from '@/components/DevLogModal';

interface AppInfoModalsProps {
  theme: string;
  onChangeTheme: (t: string) => void;
  searchApiType: 'aladin' | 'kakao' | 'naver';
  onChangeSearchApiType: (t: 'aladin' | 'kakao' | 'naver') => void;
  showSettingsModal: boolean;
  setShowSettingsModal: (v: boolean) => void;
  showDevLogModal: boolean;
  setShowDevLogModal: (v: boolean) => void;
  showPrivacyModal: boolean;
  setShowPrivacyModal: (v: boolean) => void;
  showCopyrightModal: boolean;
  setShowCopyrightModal: (v: boolean) => void;
}

/**
 * 설정, 개발로그(포스트잇 가로 휠 캐러셀), 개인정보처리방침, 저작권 안내 모달 모음
 */
export default function AppInfoModals({
  theme,
  onChangeTheme,
  searchApiType,
  onChangeSearchApiType,
  showSettingsModal,
  setShowSettingsModal,
  showDevLogModal,
  setShowDevLogModal,
  showPrivacyModal,
  setShowPrivacyModal,
  showCopyrightModal,
  setShowCopyrightModal,
}: AppInfoModalsProps) {
  return (
    <>
      {/* 설정 모달 */}
      {showSettingsModal && (
        <div className="modal">
          <div className="modal-backdrop" onClick={() => setShowSettingsModal(false)} />
          <div className="modal-card" style={{ maxWidth: '480px' }}>
            <div className="section-title-row">
              <div>
                <h2>⚙️ 앱 환경 설정</h2>
                <p className="subtitle">서재 테마 및 검색 엔진을 설정합니다.</p>
              </div>
              <button type="button" className="ghost-button" onClick={() => setShowSettingsModal(false)}>
                닫기
              </button>
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
                      type="button"
                      onClick={() => onChangeTheme(t.id)}
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
                    { id: 'aladin', label: '알라딘 (쪽수 자동)' },
                    { id: 'kakao', label: '카카오' },
                    { id: 'naver', label: '네이버' },
                  ].map((eng) => (
                    <button
                      key={eng.id}
                      type="button"
                      onClick={() => onChangeSearchApiType(eng.id as any)}
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

      {/* 개발로그 모달 (포스트잇 가로 휠 캐러셀) */}
      {showDevLogModal && <DevLogModal onClose={() => setShowDevLogModal(false)} />}

      {/* 개인정보처리방침 모달 */}
      {showPrivacyModal && (
        <div className="modal">
          <div className="modal-backdrop" onClick={() => setShowPrivacyModal(false)} />
          <div className="modal-card" style={{ maxWidth: '560px' }}>
            <div className="section-title-row">
              <div>
                <h2 style={{ color: 'var(--accent-dark)' }}>🛡️ 개인정보처리방침</h2>
              </div>
              <button type="button" className="ghost-button" onClick={() => setShowPrivacyModal(false)}>
                닫기
              </button>
            </div>
            <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-2 text-xs leading-relaxed text-stone-700">
              <p>
                <strong>1. 수집하는 정보</strong>
                <br />
                본 개인 독서 서재는 불필요한 개인정보를 수집하지 않으며, 오직 독서 진도와 감상 기록만을 노션 개인 데이터베이스에 안전하게 동기화합니다.
              </p>
              <p>
                <strong>2. API 키 및 데이터 보안</strong>
                <br />
                모든 인증 키는 서버 사이드에서만 안전하게 동작하며 클라이언트 브라우저에 일체 노출되지 않습니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 저작권 및 이용 안내 모달 */}
      {showCopyrightModal && (
        <div className="modal">
          <div className="modal-backdrop" onClick={() => setShowCopyrightModal(false)} />
          <div className="modal-card" style={{ maxWidth: '560px' }}>
            <div className="section-title-row">
              <div>
                <h2 style={{ color: 'var(--accent-dark)' }}>⚖️ 저작권 및 이용 안내</h2>
              </div>
              <button type="button" className="ghost-button" onClick={() => setShowCopyrightModal(false)}>
                닫기
              </button>
            </div>
            <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-2 text-xs leading-relaxed text-stone-700">
              <p>
                <strong>1. 권리자 (소유권)</strong>
                <br />
                본 앱의 기획, 화면 설계 및 핵심 프롬프트 구조에 대한 모든 권리는 &apos;기록조율사 서울외고 조용희&apos;에게 있습니다.
              </p>
              <p>
                <strong>2. 외부 API 라이선스 준수</strong>
                <br />
                본 앱은 노션, 알라딘, 카카오, 네이버, Google Gemini API 등을 개인적·교육적 목적으로 안전하게 이용하고 있습니다.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
