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
          <div className="modal-card" style={{ maxWidth: '620px' }}>
            <div className="section-title-row">
              <div>
                <h2 style={{ color: 'var(--accent-dark)' }}>⚖️ 저작권 및 레퍼런스 이용 안내</h2>
                <p className="subtitle">북튜닝에서 활용한 기획 권리, UI 레퍼런스, 오픈소스 및 API 라이선스 표기입니다.</p>
              </div>
              <button type="button" className="ghost-button" onClick={() => setShowCopyrightModal(false)}>
                닫기
              </button>
            </div>
            <div className="space-y-4 max-h-[62vh] overflow-y-auto pr-2 text-xs leading-relaxed text-stone-700">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <h4 className="font-bold text-amber-950 text-xs mb-1">1. 원저작자 및 서비스 소유권 (Original Creator)</h4>
                <p>
                  본 웹앱의 서비스 기획, 독서 주파수 튜닝 컨셉, 1주 1권 노션 챌린지 템플릿 연동 아키텍처 및 Gemini AI 리포트 프롬프트에 관한 모든 권리는 <strong>&apos;기록조율사 서울외고 조용희&apos;</strong>(<a href="https://www.instagram.com/record_tuner/" target="_blank" rel="noreferrer" className="text-amber-800 underline font-semibold">@record_tuner</a>)에게 있습니다.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-stone-900 text-xs mb-1">2. UI/UX 디자인 및 인터랙션 레퍼런스</h4>
                <ul className="list-disc pl-4 space-y-1 text-stone-600">
                  <li>
                    <strong>모바일 독서 기록 앱 레이아웃 컨셉</strong>: 모바일 독서 웹/앱의 직관적인 사용자 경험(지금 읽는 책 진도 카드, 월간 독서 캘린더 및 목표 도넛 차트 위젯) 구조 아이디어를 차용하여 북튜닝 아틀리에 무드로 독자 재구현했습니다.
                  </li>
                  <li>
                    <strong>macOS Dock 물결 확대(Fish-eye) 서재</strong>: Apple macOS Dock 인터랙션 메타포를 참고하여 서재 도서 호버 시 중심 도서와 인접 도서가 부드럽게 유기적으로 확대되는 인터랙션을 순수 CSS와 React로 구현했습니다.
                  </li>
                  <li>
                    <strong>Shadcn UI & Animated Carousel 패턴</strong>: shadcn/ui 및 Embla Carousel 쇼케이스 카드 패턴의 정보 배치 및 포스트잇 캐러셀 구조를 참고하여 외부 의존성 없이 가로 휠 스크롤 컴포넌트로 경량화하여 탑재했습니다.
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-stone-900 text-xs mb-1">3. 오픈소스 소프트웨어 라이선스 (Open Source)</h4>
                <p className="mb-1 text-stone-600">본 서비스는 다음의 오픈소스 소프트웨어를 준수하여 개발되었습니다:</p>
                <ul className="list-disc pl-4 space-y-0.5 text-stone-600">
                  <li><strong>Next.js (v14.2)</strong> - MIT License (© Vercel, Inc.)</li>
                  <li><strong>React & React DOM (v18.3)</strong> - MIT License (© Meta Platforms, Inc.)</li>
                  <li><strong>Tailwind CSS (v3.4)</strong> - MIT License (© Tailwind Labs, Inc.)</li>
                  <li><strong>Notion SDK for JavaScript (@notionhq/client)</strong> - MIT License (© Notion Labs, Inc.)</li>
                  <li><strong>Radix UI & Lucide Icons Iconography</strong> - MIT License</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-stone-900 text-xs mb-1">4. 외부 API 서비스 이용약관 준수</h4>
                <ul className="list-disc pl-4 space-y-0.5 text-stone-600">
                  <li><strong>Notion API</strong>: Notion Labs, Inc. API Terms & Privacy Policy 준수 (개인 서재 DB 양방향 동기화)</li>
                  <li><strong>Google Gemini API</strong>: Google APIs Terms of Service 준수 (개인 감상문/월간 리포트 생성 및 사진 OCR)</li>
                  <li><strong>알라딘 도서 검색 Open API</strong>: (주)알라딘커뮤니케이션 TTB API 약관 준수 (도서 서지 정보 및 쪽수 연동)</li>
                  <li><strong>카카오 도서 검색 API</strong>: Kakao Corp. 오픈API 이용약관 준수</li>
                  <li><strong>네이버 검색 API</strong>: NAVER Corp. 오픈API 이용약관 준수</li>
                  <li><strong>국립중앙도서관 Open API</strong>: 국립중앙도서관 공공데이터 이용조건 준수</li>
                </ul>
              </div>

              <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 text-[11px] text-stone-500">
                💡 <strong>도서 서지 정보 및 표지 이미지 저작권</strong><br />
                검색 및 서재에 노출되는 도서 표지, 도서 소개, 서지 데이터의 저작권은 해당 원저작자 및 출판사에 귀속되며, 본 서비스는 개인의 비영리 독서 기록 및 공정 이용(Fair Use) 범위 내에서만 해당 정보를 표시합니다.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
