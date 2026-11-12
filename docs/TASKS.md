# TASKS

## 1단계: 뼈대 및 기본 환경 구축 (준비)
- [x] Next.js 14 기본 설정 파일 및 프로젝트 구조 복사 (의존성: @notionhq/client, Tailwind, Gemini)
- [x] 환경변수 템플릿(`.env.example`, `.env.local`) 구성 (NOTION_CHALLENGE_DB_ID 추가 및 서버 전용 보안 격리)
- [x] 노션 챌린지 DB 스키마 분석 및 타입 정의 (`lib/types.ts`)

## 2단계: 백엔드 API 재설계 (챌린지 자동 매핑 및 AI 리포트 엔진)
- [x] 날짜 기반 챌린지 자동 조회/생성 헬퍼 함수 구현 (`lib/challengeHelper.ts` - 시작일 1일, 말일까지 희망일수 자동 계산)
- [x] 도서 API (`/api/books`) - 등록 시 해당 월 챌린지 자동 Relation 연결 및 노션 아카이브 삭제
- [x] 독서일지 API (`/api/logs`) - 기록 시 도서 및 해당 월 챌린지 자동 Relation 연결
- [x] 문장수집 API (`/api/insights`) - 수집 시 도서 및 해당 월 챌린지 자동 Relation 연결
- [x] 챌린지 목록/조회 및 기간 조절 API (`/api/challenges`) - 1주/2주/1달/2달/직접입력에 따른 시작일/희망일수 수정
- [x] Gemini AI 챌린지 독서리포트 & 블로그 글 생성 API (`/api/challenge-report`) - 기존 8월 챌린지 양식대로 노션 본문에 토글 블록 저장
- [x] 도서 3대 검색 엔진 API (`/api/search-books`) - 알라딘 쪽수 자동 LookUp 추출, 카카오, 네이버

## 3단계: 프론트엔드 UI/UX 개인화 개편
- [x] 닉네임 로그인 / PIN 인증 모달 전면 제거 및 즉시 개인 서재 진입 구현
- [x] 상단 서재 탭 개편: `[🎯 이번 챌린지 도서]`, `[📚 전체 서재]`, `[🗂️ 챌린지 아카이브]`, `[📝 독서일지 & 문장 피드]`
- [x] 월별 챌린지 달성 현황 대시보드 위젯 (`components/ChallengeHeader.tsx`)
- [x] 챌린지 기간 조절 모달 (`components/ChallengeSettingsModal.tsx` - 1주, 2주, 1달, 2달, 사용자 지정 기간)
- [x] 챌린지 독서리포트 & 블로그 글 AI 생성 모달 및 노션 원클릭 토글 저장 UI (`components/ChallengeReportModal.tsx`)
- [x] 도서 등록 및 상세 모달 (알라딘 쪽수 확인 폼, 사진 본문 OCR, AI 감상문)
- [x] 도서 상세 모달 통합 타임라인 UI 개편 (독서일지 + 문장수집 최신순 융합 피드)
- [x] 독서일지 및 문장수집 개별 삭제 기능 (노션 데이터베이스 아카이브 연동)
- [x] 사진 첨부 노션 페이지 본문 고화질 이미지 블록 자동 저장 파이프라인
- [x] 독서리포트 노션 블록 스키마 오류 해결 및 검증 완료

## 4단계: 검증 및 배포 준비
- [x] 로컬 프로덕션 빌드(`npm run build`) 무결성 검증 (TypeScript 타입 검사 100% 통과)
- [x] 실제 노션 개인 챌린지 DB 및 도서 DB 100% 실시간 연동 테스트 통과
- [x] README.md 작성 및 Vercel 환경변수 배포 가이드 완비

## 5단계: Impeccable 감각적 리디자인 (양장본 아틀리에 서재)
- [x] Impeccable 디자인 철학(AI 클리셰 탈피, 양장본 아틀리에 서재 무드) 가이드라인 수립
- [x] 웜톤 크림지/파치먼트 팔레트 및 정밀 레이어드 소프트 섀도우 구현 (`app/globals.css`)
- [x] 실물 양장본 입체감 구현: 도서 표지 좌측 책등(Spine) 입체 그라디언트 및 하이라이트 가상요소 탑재
- [x] 완독 골드/포레스트 그린 스탬프 뱃지, 도서 타이틀 2줄 클램프, 5px 슬림 프로그레스 바 적용
- [x] 상단 인위적 배너 제거 및 출판 아틀리에 마스트헤드 타이포그래피 정돈 (`app/page.tsx`)
- [x] 브라우저 표면 마감(커스텀 셀렉션, 웜톤 슬림 스크롤바, 캐럿 컬러) 및 Next.js 빌드 무결성 검증 통과

## 6단계: 모바일 반응형 겹침/넘침 해결 및 UI 가독성 고대비 전면 개선
- [x] 독서리포트 모달 내 불필요한 설명("기존 8월 챌린지와 동일한 양식...") 및 AI 과장 문구 전면 삭제
- [x] 독서리포트 모달 생성 후 탭 버튼(`독서 리포트 & 추천도서`, `블로그 완성 글`) 고대비 화이트/앰버 스타일링 및 모바일 너비 넘침 방지 (`truncate`, `flex-1 min-w-0`)
- [x] 챌린지 기간 조절 모달 간편 프리셋 버튼 가독성 개선 (선택 하이라이트 및 밝은 카드 대비)
- [x] 챌린지 시작일 및 희망일수 인풋 모바일 겹침 현상 해결 (`grid-cols-1 sm:grid-cols-2`, `box-border`)
- [x] 문장수집 폼 내 수집날짜 상자 오른쪽 경계 돌출 현상 해결 및 취소 버튼 텍스트 가독성 확보
- [x] 독서일지 폼 내 읽은 날짜/누적 쪽수 인풋 겹침 현상 해결 및 취소 버튼 가독성 확보
- [x] 도서 상세 모달 하단 `도서 삭제` 버튼 선명한 흰색 텍스트+로즈 레드 배경(`bg-rose-600 text-white`) 적용
- [x] 전역 `app/globals.css` 인풋 및 모달 모바일 안전 규격 강화 및 프로덕션 빌드 100% 검증

## 7단계: 노션 DB 열기 환경변수화 및 사용법 모달 동영상 탑재
- [x] 푸터 및 설정 모달의 '노션 데이터베이스 열기' 링크 환경변수 연동 및 `/api/notion-url` 서버 리다이렉트 브릿지 구축
- [x] Vercel 등록명 `NOTION_PAGE_URL` 그대로 100% 호환 지원 (접두사 `NEXT_PUBLIC_` 불필요)
- [x] 소스코드 내 하드코딩된 개인 노션 URL(fallback 포함) 100% 완전 삭제 및 미설정 시 비활성화 처리
- [x] `.env.example`, `.env.local` 및 `README.md` 환경변수 안내 표 최신화
- [x] 로컬 영상 `북튜닝_홍보영상_booktuning.mp4`를 `public/booktuning_intro.mp4`로 탑재
- [x] `app/page.tsx` 사용법 모달 내 고화질 인라인 비디오 플레이어 탑재
- [x] 프로덕션 빌드 100% 무결성 검증 통과 (11개 라우트 전원 통과)

## 8단계: 도서 등록 시 노션 페이지 커버 동시 연동
- [x] 도서 등록(`POST /api/books`) 시 노션 `표지` 속성과 함께 `cover` 메타데이터(노션 페이지 상단 커버) 동시 저장
- [x] 도서 파싱(`parseBookPage`) 시 `properties['표지']` 외에 `page.cover`도 함께 읽도록 상호 보완 처리
- [x] 도서 정보 수정(`PATCH /api/books`) 시 `cover` 업데이트 지원 및 Next.js 빌드 100% 검증

## 9단계: 모바일 & PC UI/UX 전면 리뉴얼 (5대 탭·캘린더·피드·도감)
- [x] 백엔드 노션 전체 목록 조회 페이지네이션 보완 (`lib/notion.ts`, `/api/books`, `/api/logs`, `/api/insights`)
- [ ] 반응형 5대 탭 내비게이션 구현 (`components/BottomNav.tsx` - 모바일 하단 고정 바 & PC 상단 탭 바, 작은 글씨/가로폭 넘침 방지)
- [x] 홈 탭 구현 (`components/tabs/HomeTab.tsx`, `components/ChallengeCalendarCard.tsx` - 검색바, 지금 읽는 책, 챌린지 기간 캘린더 & 목표 도넛 차트, 최근 독서기록)
- [x] 서재 탭·챌린지 탭·피드 탭·도감 탭 컴포넌트 구현 (`LibraryTab.tsx`, `ChallengeTab.tsx`, `FeedTab.tsx`, `DexTab.tsx`)
- [x] 메인 페이지(`app/page.tsx`) 셸 리팩토링 및 스타일(`app/globals.css`) 모바일/PC 반응형 마무리 (모바일 작은 글씨·overflow 방지)
- [x] 개발로그 복구(v4.2~v4.4) 및 포스트잇 스타일 가로 휠 스크롤 캐러셀 모달(`components/DevLogModal.tsx`) 구현
- [ ] 프로덕션 빌드(`npm run build`) 및 모바일(390px)/PC(1280px) 브라우저 화면·콘솔 검증
