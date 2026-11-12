'use client';

import React from 'react';

interface AppInfoModalsProps {
  theme: string;
  onChangeTheme: (t: string) => void;
  searchApiType: 'aladin' | 'kakao' | 'naver';
  onChangeSearchApiType: (t: 'aladin' | 'kakao' | 'naver') => void;
  showSettingsModal: boolean;
  setShowSettingsModal: (v: boolean) => void;
  showTutorialModal: boolean;
  setShowTutorialModal: (v: boolean) => void;
  showDevLogModal: boolean;
  setShowDevLogModal: (v: boolean) => void;
  showPrivacyModal: boolean;
  setShowPrivacyModal: (v: boolean) => void;
  showCopyrightModal: boolean;
  setShowCopyrightModal: (v: boolean) => void;
}

/**
 * 설정, 사용법(영상 포함), 개발로그, 개인정보처리방침, 저작권 안내 모달 모음
 */
export default function AppInfoModals({
  theme,
  onChangeTheme,
  searchApiType,
  onChangeSearchApiType,
  showSettingsModal,
  setShowSettingsModal,
  showTutorialModal,
  setShowTutorialModal,
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

      {/* 사용법 튜토리얼 모달 */}
      {showTutorialModal && (
        <div className="modal">
          <div className="modal-backdrop" onClick={() => setShowTutorialModal(false)} />
          <div className="modal-card" style={{ maxWidth: '640px' }}>
            <div className="section-title-row">
              <div>
                <span className="text-xs bg-amber-800 text-white font-bold px-2 py-0.5 rounded-full inline-block mb-1">
                  Book Tuning
                </span>
                <h2>📖 북튜닝 사용 안내 가이드</h2>
              </div>
              <button
                type="button"
                className="px-4 py-2 text-xs font-bold rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 transition"
                onClick={() => setShowTutorialModal(false)}
              >
                닫기
              </button>
            </div>
            <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2 text-xs leading-relaxed text-stone-700">
              <div className="p-3 bg-stone-100 rounded-2xl border border-stone-200 overflow-hidden">
                <div className="flex items-center justify-between mb-2 px-1">
                  <h4 className="font-bold text-sm flex items-center gap-1.5 text-stone-900">
                    <span>🎬</span> 북튜닝 홍보 & 사용 가이드 영상
                  </h4>
                  <span className="text-[11px] text-stone-500">재생을 누르면 시청할 수 있습니다</span>
                </div>
                <div className="rounded-xl overflow-hidden bg-stone-900 aspect-video flex items-center justify-center">
                  <video controls playsInline preload="metadata" className="w-full h-full object-contain" poster="/icon.svg">
                    <source src="/booktuning_intro.mp4" type="video/mp4" />
                    <source src="/북튜닝_홍보영상_booktuning.mp4" type="video/mp4" />
                    브라우저가 동영상 재생을 지원하지 않습니다.
                  </video>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <h4 className="font-bold text-amber-900 text-sm mb-1">🎯 홈 대시보드 & 챌린지 캘린더</h4>
                <p>
                  홈 화면에서 <strong>지금 읽는 책</strong> 진도를 바로 확인하고, 챌린지 기간 기반 <strong>월별 독서 캘린더</strong>와 목표 권수를 한눈에 볼 수 있습니다.
                </p>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <h4 className="font-bold text-stone-800 text-sm mb-1">📚 서재 · 챌린지 · 피드 · 도감</h4>
                <p>
                  서재에서 전체 책을 모아보고, 챌린지에서 기간별 카드를 관리하며, 피드에서 시간순 기록을, 도감에서 완독 책 표지를 수집할 수 있습니다.
                </p>
              </div>
              <div className="p-3 bg-orange-50 rounded-xl border border-orange-200">
                <h4 className="font-bold text-orange-950 text-sm mb-1">✨ Gemini AI 월간 독서 리포트</h4>
                <p>
                  챌린지 카드 또는 캘린더의 <strong>[AI 리포트]</strong> 버튼을 누르면 총평, 인사이트 셀렉션, 블로그 완성글이 작성되어 노션 본문에 토글로 저장됩니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 개발로그 모달 */}
      {showDevLogModal && (
        <div className="modal">
          <div className="modal-backdrop" onClick={() => setShowDevLogModal(false)} />
          <div className="modal-card" style={{ maxWidth: '640px' }}>
            <div className="section-title-row">
              <div>
                <h2>📝 북튜닝 개발로그</h2>
              </div>
              <button type="button" className="ghost-button" onClick={() => setShowDevLogModal(false)}>
                닫기
              </button>
            </div>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 text-xs leading-relaxed text-stone-700">
              <div className="border-b pb-2">
                <span className="font-bold text-amber-800 text-sm">v5.0 (모바일·PC 대시보드 리뉴얼) - 2026.11</span>
                <p className="mt-1">
                  • 5대 탭(홈 · 서재 · 챌린지 · 피드 · 도감) 모바일 하단 네비게이션 및 PC 2단 대시보드 구축<br />
                  • 지금 읽는 책 섹션, 챌린지 기간 기반 월별 캘린더, 등록 권수 목표 원형 게이지 신설<br />
                  • 완독 도서 표지 도감 및 시간순 통합 피드 강화
                </p>
              </div>
              <div className="border-b pb-2">
                <span className="font-bold text-stone-600">v4.3 (개인 챌린지 전용) - 2026.10</span>
                <p className="mt-1">
                  • 1주 1권 챌린지 DB 실시간 연동 및 기간 세부 조절 지원<br />
                  • Gemini AI 월간 리포트 및 블로그 글 노션 토글 블록 자동 저장
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

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
