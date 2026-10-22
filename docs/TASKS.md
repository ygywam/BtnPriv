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

## 4단계: 검증 및 배포 준비
- [x] 로컬 프로덕션 빌드(`npm run build`) 무결성 검증 (TypeScript 타입 검사 100% 통과)
- [x] 실제 노션 개인 챌린지 DB 및 도서 DB 100% 실시간 연동 테스트 통과
- [x] README.md 작성 및 Vercel 환경변수 배포 가이드 완비
