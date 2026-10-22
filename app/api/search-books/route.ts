import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// 1. 국립중앙도서관(NL) 쪽수 자동 파싱 헬퍼
async function fetchTotalPagesFromNL(isbn: string, nlKey?: string): Promise<number> {
  if (!isbn || !nlKey) return 0;
  const cleanIsbn = String(isbn).replace(/[^0-9X]/gi, '').trim();
  if (!cleanIsbn) return 0;

  try {
    const url = `https://www.nl.go.kr/seoji/SearchApi.do?cert_key=${encodeURIComponent(nlKey)}&result_style=json&page_no=1&page_size=5&isbn=${encodeURIComponent(cleanIsbn)}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return 0;

    const data = await res.json();
    const docs = data.docs || data.item || [];

    for (let i = 0; i < docs.length; i++) {
      const pageStr = docs[i].PAGE || docs[i].page || '';
      if (pageStr) {
        const numbers = String(pageStr).match(/\d+/g);
        if (numbers && numbers.length > 0) {
          const numList = numbers.map(Number).filter((n) => n >= 5);
          if (numList.length > 0) return Math.max(...numList);
          return parseInt(numbers[0], 10);
        }
      }
    }
  } catch (e) {
    console.warn('국립중앙도서관 쪽수 조회 건너뜀:', e);
  }
  return 0;
}

// 2. 카카오 도서 검색
async function searchKakao(query: string, kakaoKey: string, nlKey?: string) {
  const isIsbn = /^[0-9Xx-]{10,17}$/.test(query.replace(/\s/g, ''));
  const cleanQuery = query.replace(/-/g, '');
  const url = isIsbn
    ? `https://dapi.kakao.com/v3/search/book?target=isbn&query=${encodeURIComponent(cleanQuery)}`
    : `https://dapi.kakao.com/v3/search/book?target=title&query=${encodeURIComponent(query)}&size=10`;

  const res = await fetch(url, {
    headers: { Authorization: `KakaoAK ${kakaoKey}` },
  });
  if (!res.ok) throw new Error(`카카오 API 통신 에러 (${res.status})`);

  const data = await res.json();
  const rawDocuments = data.documents || [];

  return Promise.all(
    rawDocuments.map(async (item: any) => {
      const firstIsbn = (item.isbn || '').split(' ')[0] || '';
      let totalPages = 0;
      if (firstIsbn && nlKey) {
        totalPages = await fetchTotalPagesFromNL(firstIsbn, nlKey);
      }
      return {
        externalId: item.isbn || '',
        isbn: firstIsbn,
        title: item.title || '',
        author: (item.authors || []).join(', '),
        publisher: item.publisher || '',
        totalPages,
        coverUrl: item.thumbnail || '',
        source: '카카오 + 국립중앙도서관',
        description: item.contents || '',
      };
    })
  );
}

// 3. 알라딘 도서 검색 (상세 LookUp 연동으로 쪽수 100% 자동 제공)
async function searchAladin(query: string, aladinKey: string, nlKey?: string) {
  const isIsbn = /^[0-9Xx-]{10,17}$/.test(query.replace(/\s/g, ''));
  const cleanQuery = query.replace(/-/g, '');
  const url = isIsbn
    ? `https://www.aladin.co.kr/ttb/api/ItemLookUp.aspx?ttbkey=${aladinKey}&itemIdType=ISBN13&ItemId=${encodeURIComponent(cleanQuery)}&output=js&Version=20131101&Cover=Big&SubInfo=BookPage`
    : `https://www.aladin.co.kr/ttb/api/ItemSearch.aspx?ttbkey=${aladinKey}&Query=${encodeURIComponent(query)}&QueryType=Title&maxResults=8&start=1&output=js&Version=20131101&Cover=Big`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      Referer: 'https://aladin.co.kr',
    },
  });
  if (!res.ok) throw new Error(`알라딘 통신 에러 (${res.status})`);

  let resText = await res.text();
  resText = resText.trim();
  if (resText.endsWith(';')) resText = resText.slice(0, -1);

  if (resText.includes('<!DOCTYPE') || resText.includes('<html')) {
    throw new Error('알라딘 방화벽 차단 응답입니다. 네이버나 카카오 API로 검색해 보세요.');
  }

  const data = JSON.parse(resText);
  if (data.errorCode) throw new Error(`알라딘 에러: ${data.errorMessage}`);

  const rawItems = data.item || [];

  return Promise.all(
    rawItems.map(async (item: any) => {
      let totalPages = item.subInfo?.itemPage || item.subInfo?.bookPage || 0;
      const firstIsbn = item.isbn13 || item.isbn || '';

      // ItemSearch로 검색한 경우 상세 LookUp을 병렬 호출해 정확한 쪽수(itemPage) 추출
      if (!totalPages && (item.itemId || firstIsbn)) {
        try {
          const lookupId = item.itemId || firstIsbn;
          const idType = item.itemId ? 'ItemId' : 'ISBN13';
          const lookUpUrl = `https://www.aladin.co.kr/ttb/api/ItemLookUp.aspx?ttbkey=${aladinKey}&itemIdType=${idType}&ItemId=${encodeURIComponent(lookupId)}&output=js&Version=20131101&Cover=Big&SubInfo=BookPage`;
          const lRes = await fetch(lookUpUrl, { headers: { Referer: 'https://aladin.co.kr' } });
          if (lRes.ok) {
            let lText = await lRes.text();
            lText = lText.trim();
            if (lText.endsWith(';')) lText = lText.slice(0, -1);
            const lData = JSON.parse(lText);
            const detailItem = lData.item?.[0];
            if (detailItem?.subInfo?.itemPage || detailItem?.subInfo?.bookPage) {
              totalPages = Number(detailItem.subInfo.itemPage || detailItem.subInfo.bookPage);
            }
          }
        } catch (e) {
          // ignore lookup error
        }
      }

      // 여전히 쪽수가 0이면 국립중앙도서관 쪽수 조회 폴백
      if (!totalPages && firstIsbn && nlKey) {
        totalPages = await fetchTotalPagesFromNL(firstIsbn, nlKey);
      }

      return {
        externalId: String(item.itemId || ''),
        isbn: firstIsbn,
        title: item.title || '',
        author: item.author || '',
        publisher: item.publisher || '',
        totalPages,
        coverUrl: (item.cover || '').replace('http://', 'https://'),
        source: '알라딘 API',
        description: item.description || '',
      };
    })
  );
}

// 4. 네이버 도서 검색 (고화질 표지)
async function searchNaver(query: string, clientId: string, clientSecret: string, nlKey?: string) {
  const isIsbn = /^[0-9Xx-]{10,17}$/.test(query.replace(/\s/g, ''));
  const cleanQuery = query.replace(/-/g, '');
  const url = isIsbn
    ? `https://openapi.naver.com/v1/search/book_adv.json?d_isbn=${encodeURIComponent(cleanQuery)}`
    : `https://openapi.naver.com/v1/search/book.json?query=${encodeURIComponent(query)}&display=10`;

  const res = await fetch(url, {
    headers: {
      'X-Naver-Client-Id': clientId,
      'X-Naver-Client-Secret': clientSecret,
    },
  });
  if (!res.ok) throw new Error(`네이버 API 통신 에러 (${res.status})`);

  const data = await res.json();
  const rawItems = data.items || [];

  return Promise.all(
    rawItems.map(async (item: any) => {
      const cleanTitle = (item.title || '').replace(/(<([^>]+)>)/gi, '');
      const cleanAuthor = (item.author || '').replace(/(<([^>]+)>)/gi, '');
      const cleanDesc = (item.description || '').replace(/(<([^>]+)>)/gi, '');
      const firstIsbn = item.isbn || '';
      let totalPages = 0;
      if (firstIsbn && nlKey) {
        totalPages = await fetchTotalPagesFromNL(firstIsbn, nlKey);
      }
      return {
        externalId: firstIsbn,
        isbn: firstIsbn,
        title: cleanTitle,
        author: cleanAuthor,
        publisher: item.publisher || '',
        totalPages,
        coverUrl: item.image || '',
        source: '네이버 API',
        description: cleanDesc,
      };
    })
  );
}

// 메인 GET 핸들러
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const type = searchParams.get('type') || 'kakao'; // kakao, aladin, naver

  if (!query) {
    return NextResponse.json({ ok: false, error: '검색어를 입력해 주세요.' }, { status: 400 });
  }

  const kakaoKey = process.env.KAKAO_REST_API_KEY;
  const aladinKey = process.env.ALADIN_API_KEY;
  const naverId = process.env.NAVER_CLIENT_ID;
  const naverSecret = process.env.NAVER_CLIENT_SECRET;
  const nlKey = process.env.NL_API_KEY;

  try {
    let books: any[] = [];

    if (type === 'aladin') {
      if (!aladinKey) {
        return NextResponse.json({ ok: false, error: 'ALADIN_API_KEY 환경변수가 설정되지 않았습니다.' }, { status: 400 });
      }
      books = await searchAladin(query, aladinKey, nlKey);
    } else if (type === 'naver') {
      if (!naverId || !naverSecret) {
        return NextResponse.json({ ok: false, error: 'NAVER_CLIENT_ID 또는 NAVER_CLIENT_SECRET 환경변수가 설정되지 않았습니다.' }, { status: 400 });
      }
      books = await searchNaver(query, naverId, naverSecret, nlKey);
    } else {
      // 기본값: 카카오 + 국립중앙도서관 쪽수 하이브리드
      if (!kakaoKey) {
        return NextResponse.json({ ok: false, error: 'KAKAO_REST_API_KEY 환경변수가 설정되지 않았습니다.' }, { status: 400 });
      }
      books = await searchKakao(query, kakaoKey, nlKey);
    }

    return NextResponse.json({ ok: true, books });
  } catch (error: any) {
    console.error('도서 검색 오류:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
