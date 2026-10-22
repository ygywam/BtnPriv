// 북튜닝 개인버전 (Book Tuning Personal) 핵심 인터페이스 및 타입 정의

export interface Challenge {
  id: string;
  title: string;          // *챌린지 이름 (예: "2026년 10월 챌린지(10/1~10/31)")
  startDate: string;      // *챌린지 시작일 (YYYY-MM-DD)
  targetDays: number;     // *희망 일수 (28~31, 또는 7, 14, 61 등)
  endDate?: string;       // *목표 종료일
  progressText?: string;  // *진행상황
  status?: string;        // 상태 (진행중, 완료 등)
  bookIds: string[];      // *관련 책 relation IDs
  logIds: string[];       // *독서 기록(관계형) relation IDs
  insightIds: string[];   // 3️⃣ 문장수집 DB relation IDs
}

export interface Book {
  id: string;
  title: string;          // *책 제목
  author: string;         // 저자
  publisher: string;      // 출판사
  totalPage: number;      // *전체 페이지수
  cover: string;          // 표지 이미지 URL
  rating?: string;        // 별점수
  description?: string;   // 책소개
  challengeIds: string[]; // *관련 챌린지 relation IDs
  logIds: string[];       // *독서일지 relation IDs
  insightIds: string[];   // *문장수집 relation IDs
  readPages?: number;     // 읽은 누적 페이지수
  progressRate?: number;  // 완독률(%)
  createdAt?: string;     // 생성 일시
}

export interface ReadingLog {
  id: string;
  date: string;           // 읽은 날짜 (YYYY-MM-DD)
  page: number;           // 이번에 읽은 페이지(숫자)
  content: string;        // 독서 감상록
  bookId: string;         // 관련 책 relation ID
  bookTitle?: string;     // 관련 책 제목
  challengeId?: string;   // 관련 챌린지 relation ID
  createdAt?: string;     // 생성일
}

export interface Insight {
  id: string;
  quote: string;          // 내용 (문장 및 느낀점)
  page: string;           // 페이지 (예: "p.124" 또는 "124")
  date: string;           // 읽은날짜 (YYYY-MM-DD)
  bookId: string;         // 관련 책 relation ID
  bookTitle?: string;     // 관련 책 제목
  challengeId?: string;   // 관련 챌린지 relation ID
  createdAt?: string;
}

export interface SearchResultBook {
  title: string;
  author: string;
  publisher: string;
  cover: string;
  totalPage: number;
  description: string;
  isbn?: string;
  source: 'kakao' | 'naver' | 'aladin' | 'nl';
}
