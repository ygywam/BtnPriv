import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * 카카오 ISBN 문자열(예: "1161571183 9791161571188")에서 13자리 및 10자리 ISBN을 분리 추출
 */
function extractIsbns(raw?: string): { isbn13: string; isbn10: string } {
  if (!raw) return { isbn13: '', isbn10: '' };
  const parts = String(raw).trim().split(/\s+/);
  let isbn13 = '';
  let isbn10 = '';
  for (const p of parts) {
    const clean = p.replace(/[^0-9Xx]/g, '').trim();
    if (clean.length === 13 && !isbn13) isbn13 = clean;
    else if (clean.length === 10 && !isbn10) isbn10 = clean;
  }
  return { isbn13, isbn10 };
}

/**
 * 국립중앙도서관 PAGE 문자열("267 p.", "약 640쪽 내외", "136", "320 p. : 삽도")에서 숫자 쪽수를 정밀 파싱
 */
function parsePageString(str?: string): number {
  if (!str) return 0;
  const s = String(str).trim();

  // 1. "267 p.", "640쪽", "320p", "page 350" 등 명시적 단위 매칭
  const pMatch = s.match(/(\d+)\s*(?:p|쪽|page)/i);
  if (pMatch) {
    const n = parseInt(pMatch[1], 10);
    if (n >= 10 && n <= 5000) return n;
  }

  // 2. 숫자가 단순 들어있는 경우 ("136", "312")
  const nums = s.match(/\d+/g);
  if (nums) {
    const valid = nums.map(Number).filter((n) => n >= 20 && n <= 3500);
    if (valid.length > 0) {
      // 본문 쪽수는 보통 마지막에 기재됨
      return valid[valid.length - 1];
    }
  }

  return 0;
}

/**
 * 국립중앙도서관(NL) 서지정보 API를 통해 쪽수를 3단계(ISBN13 ➔ ISBN10 ➔ 정제된 제목)로 자동 조회
 */
async function fetchTotalPagesFromNL(isbn13: string, isbn10: string, title?: string, nlKey?: string): Promise<number> {
  if (!nlKey) return 0;

  // 단일 ISBN으로 국립중앙도서관 Seoji API 호출
  const queryByIsbn = async (isbn: string): Promise<number> => {
    if (!isbn) return 0;
    try {
      const url = `https://www.nl.go.kr/seoji/SearchApi.do?cert_key=${encodeURIComponent(nlKey)}&result_style=json&page_no=1&page_size=5&isbn=${encodeURIComponent(isbn)}`;
      const res = await fetch(url, { next: { revalidate: 3600 } });
      if (!res.ok) return 0;

      const data = await res.json();
      const docs = data.docs || data.item || [];
      for (const d of docs) {
        const page = parsePageString(d.PAGE || d.FORM_DETAIL || d.FORM);
        if (page > 0) return page;
      }
    } catch {
      // 네트워크 일시 오류 시 다음 단계 진행
    }
    return 0;
  };

  // 1단계: 13자리 ISBN(978, 979) 우선 조회 (대부분의 신간·등록 도서)
  let pages = await queryByIsbn(isbn13);
  if (pages > 0) return pages;

  // 2단계: 10자리 ISBN 2차 조회
  pages = await queryByIsbn(isbn10);
  if (pages > 0) return pages;

  // 3단계: 부제/괄호 제거한 도서명으로 국립중앙도서관 제목 검색 폴백
  if (title) {
    try {
      const cleanTitle = title
        .replace(/\([^)]*\)|\[[^\]]*\]/g, '')
        .replace(/[:：].*$/, '')
        .trim()
        .slice(0, 30);
      if (cleanTitle.length >= 2) {
        const url = `https://www.nl.go.kr/seoji/SearchApi.do?cert_key=${encodeURIComponent(nlKey)}&result_style=json&page_no=1&page_size=5&title=${encodeURIComponent(cleanTitle)}`;
        const res = await fetch(url, { next: { revalidate: 3600 } });
        if (res.ok) {
          const data = await res.json();
          const docs = data.docs || data.item || [];
          for (const d of docs) {
            const page = parsePageString(d.PAGE || d.FORM_DETAIL || d.FORM);
            if (page > 0) return page;
          }
        }
      }
    } catch {
      // 제목 검색 오류 무시
    }
  }

  return 0;
}

/**
 * 카카오 도서 검색 + 국립중앙도서관(NL) 쪽수 자동 매핑 하이브리드 엔진
 */
async function searchKakao(query: string, kakaoKey: string, nlKey?: string) {
  const isIsbn = /^[0-9Xx-]{10,17}$/.test(query.replace(/\s/g, ''));
  const cleanQuery = query.replace(/-/g, '');
  const url = isIsbn
    ? `https://dapi.kakao.com/v3/search/book?target=isbn&query=${encodeURIComponent(cleanQuery)}`
    : `https://dapi.kakao.com/v3/search/book?target=title&query=${encodeURIComponent(query)}&size=10`;

  const res = await fetch(url, {
    headers: { Authorization: `KakaoAK ${kakaoKey}` },
  });
  if (!res.ok) throw new Error(`카카오 도서 검색 API 통신 에러 (${res.status})`);

  const data = await res.json();
  const rawDocuments = data.documents || [];

  return Promise.all(
    rawDocuments.map(async (item: any) => {
      const { isbn13, isbn10 } = extractIsbns(item.isbn);
      const primaryIsbn = isbn13 || isbn10 || item.isbn || '';

      // 국립중앙도서관 쪽수 정밀 연동 (13자리 우선 ➔ 10자리 ➔ 제목 폴백)
      let totalPages = 0;
      if (nlKey) {
        totalPages = await fetchTotalPagesFromNL(isbn13, isbn10, item.title, nlKey);
      }

      return {
        externalId: primaryIsbn,
        isbn: primaryIsbn,
        isbn13,
        isbn10,
        title: item.title || '',
        author: (item.authors || []).join(', '),
        publisher: item.publisher || '',
        totalPages,
        coverUrl: item.thumbnail || '',
        source: '카카오 도서 + 국립중앙도서관(NL)',
        description: item.contents || '',
      };
    })
  );
}

// 메인 GET 핸들러
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  const kakaoKey = process.env.KAKAO_REST_API_KEY;
  const nlKey = process.env.NL_API_KEY;

  // 1. 단일 도서 쪽수만 국립중앙도서관에 재조회하는 액션 (도서 선택 시 보정)
  if (action === 'fetch_pages') {
    const rawIsbn = searchParams.get('isbn') || '';
    const title = searchParams.get('title') || '';
    const { isbn13, isbn10 } = extractIsbns(rawIsbn);

    if (!nlKey) {
      return NextResponse.json({ ok: false, error: 'NL_API_KEY 미설정', pages: 0 });
    }

    const pages = await fetchTotalPagesFromNL(isbn13, isbn10, title, nlKey);
    return NextResponse.json({ ok: true, pages });
  }

  // 2. 도서 검색 실행
  const query = searchParams.get('query');
  const type = searchParams.get('type') || 'kakao';

  if (!query) {
    return NextResponse.json({ ok: false, error: '검색어를 입력해 주세요.' }, { status: 400 });
  }

  // 알라딘(2026.10.30 종료) / 네이버(2026.07.31 종료) 서비스 종료 안내 및 카카오 자동 안전 폴백
  let notice: string | null = null;
  if (type === 'aladin') {
    notice = '알라딘 도서 검색 Open API는 2026년 10월 30일부로 서비스가 공식 종료되었습니다. 카카오 + 국립중앙도서관 하이브리드 엔진으로 검색합니다.';
  } else if (type === 'naver') {
    notice = '네이버 책 검색 API는 2026년 7월 31일부로 서비스가 공식 종료되었습니다. 카카오 + 국립중앙도서관 하이브리드 엔진으로 검색합니다.';
  }

  if (!kakaoKey) {
    return NextResponse.json(
      {
        ok: false,
        error: 'KAKAO_REST_API_KEY 환경변수가 설정되지 않았습니다. .env.local 또는 Vercel 설정을 확인해 주세요.',
      },
      { status: 400 }
    );
  }

  try {
    const books = await searchKakao(query, kakaoKey, nlKey);
    return NextResponse.json({
      ok: true,
      books,
      sourceEngine: 'kakao+nl',
      notice,
    });
  } catch (error: any) {
    console.error('도서 검색 오류:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
