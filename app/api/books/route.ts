import { NextRequest, NextResponse } from 'next/server';
import { notion, NOTION_BOOK_DB_ID } from '@/lib/notion';
import { getOrCreateChallengeByDate } from '@/lib/challengeHelper';
import { Book } from '@/lib/types';

// 노션 원본 페이지 객체를 Book 인터페이스로 변환
function parseBookPage(page: any): Book {
  const props = page.properties;

  const titleProp = props['*책 제목'] || props['도서명'] || props['제목'] || props['이름'];
  const title = titleProp?.title?.map((t: any) => t.plain_text).join('') || '제목 없음';

  const author = props['저자']?.rich_text?.map((t: any) => t.plain_text).join('') || '';
  const publisher = props['출판사']?.rich_text?.map((t: any) => t.plain_text).join('') || '';
  const totalPage = props['*전체 페이지수']?.number || props['전체페이지수']?.number || 0;

  // 표지 이미지 URL 추출
  let cover = '';
  const coverFiles = props['표지']?.files;
  if (coverFiles && coverFiles.length > 0) {
    const f = coverFiles[0];
    cover = f.file?.url || f.external?.url || '';
  }

  const rating = props['별점수']?.select?.name || '';
  const description = props['책소개']?.rich_text?.map((t: any) => t.plain_text).join('') || '';

  const challengeIds = props['*관련 챌린지']?.relation?.map((r: any) => r.id) || [];
  const logIds = props['*독서일지']?.relation?.map((r: any) => r.id) || [];
  const insightIds = props['*문장수집']?.relation?.map((r: any) => r.id) || [];

  const readPages = props['*총 읽은 양']?.formula?.number || 0;
  const progressRate = props['*완독률']?.formula?.number || 0;

  const createdAt = page.created_time || '';

  return {
    id: page.id,
    title,
    author,
    publisher,
    totalPage,
    cover,
    rating,
    description,
    challengeIds,
    logIds,
    insightIds,
    readPages,
    progressRate: Math.round(progressRate * 100), // 백분율 정수 환산
    createdAt,
  };
}

// GET /api/books - 도서 목록 조회
export async function GET(req: NextRequest) {
  try {
    if (!NOTION_BOOK_DB_ID) {
      return NextResponse.json({ error: 'NOTION_BOOK_DB_ID 미설정' }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const challengeId = searchParams.get('challengeId');

    const filterObj: any = {};
    if (challengeId) {
      filterObj.filter = {
        property: '*관련 챌린지',
        relation: {
          contains: challengeId,
        },
      };
    }

    const queryRes = await notion.databases.query({
      database_id: NOTION_BOOK_DB_ID,
      ...filterObj,
      sorts: [
        {
          timestamp: 'created_time',
          direction: 'descending',
        },
      ],
      page_size: 100,
    });

    const books = queryRes.results.map((p: any) => parseBookPage(p));
    return NextResponse.json({ books });
  } catch (error: any) {
    console.error('도서 목록 조회 오류:', error);
    return NextResponse.json({ error: error.message || '도서 조회 실패' }, { status: 500 });
  }
}

// POST /api/books - 도서 등록 (해당 월 챌린지 자동 연결)
export async function POST(req: NextRequest) {
  try {
    if (!NOTION_BOOK_DB_ID) {
      return NextResponse.json({ error: 'NOTION_BOOK_DB_ID 미설정' }, { status: 500 });
    }

    const body = await req.json();
    const { title, author, publisher, totalPage, cover, description, rating, challengeId, date } = body;

    if (!title) {
      return NextResponse.json({ error: '책 제목은 필수입니다.' }, { status: 400 });
    }

    // 1. 챌린지 ID 결정 (전달받지 못했으면 등록 날짜 기준으로 자동 생성/조회)
    let targetChallengeId = challengeId;
    if (!targetChallengeId) {
      const autoChallenge = await getOrCreateChallengeByDate(date);
      targetChallengeId = autoChallenge.id;
    }

    // 2. 도서 속성 구성
    const properties: any = {
      '*책 제목': {
        title: [{ type: 'text', text: { content: title } }],
      },
      '저자': {
        rich_text: [{ type: 'text', text: { content: author || '' } }],
      },
      '출판사': {
        rich_text: [{ type: 'text', text: { content: publisher || '' } }],
      },
      '*전체 페이지수': {
        number: totalPage ? Number(totalPage) : 0,
      },
    };

    if (cover) {
      properties['표지'] = {
        files: [
          {
            name: 'cover',
            type: 'external',
            external: { url: cover },
          },
        ],
      };
    }

    if (description) {
      properties['책소개'] = {
        rich_text: [{ type: 'text', text: { content: description } }],
      };
    }

    if (rating) {
      properties['별점수'] = {
        select: { name: rating },
      };
    }

    if (targetChallengeId) {
      properties['*관련 챌린지'] = {
        relation: [{ id: targetChallengeId }],
      };
    }

    const createdPage = await notion.pages.create({
      parent: { database_id: NOTION_BOOK_DB_ID },
      properties,
    });

    return NextResponse.json({ book: parseBookPage(createdPage) });
  } catch (error: any) {
    console.error('도서 등록 오류:', error);
    return NextResponse.json({ error: error.message || '도서 등록 실패' }, { status: 500 });
  }
}

// DELETE /api/books - 도서 삭제 (노션 아카이브)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bookId = searchParams.get('id');

    if (!bookId) {
      return NextResponse.json({ error: '삭제할 도서 ID가 없습니다.' }, { status: 400 });
    }

    await notion.pages.update({
      page_id: bookId,
      archived: true,
    });

    return NextResponse.json({ success: true, message: '도서가 삭제(아카이브)되었습니다.' });
  } catch (error: any) {
    console.error('도서 삭제 오류:', error);
    return NextResponse.json({ error: error.message || '도서 삭제 실패' }, { status: 500 });
  }
}
