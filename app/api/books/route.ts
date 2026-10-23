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

  // 완독률 파싱 및 계산 (노션 수식 문자열 또는 쪽수 비율)
  let progressRate = 0;
  const rateFormula = props['*완독률']?.formula;
  if (rateFormula?.type === 'string' && rateFormula.string) {
    const str = rateFormula.string;
    const match = str.match(/(\d+)%/);
    if (match) {
      progressRate = parseInt(match[1], 10);
    } else if (str.includes('✅ 완독')) {
      progressRate = 100;
    }
  } else if (rateFormula?.type === 'number') {
    progressRate = Math.round(rateFormula.number * (rateFormula.number <= 1 ? 100 : 1));
  }

  // 롤업이나 공식 수식이 0인 경우 읽은 쪽수 대비 전체 쪽수로 직접 정밀 보정
  if (!progressRate && totalPage > 0 && readPages > 0) {
    progressRate = Math.min(100, Math.round((readPages / totalPage) * 100));
  }
  if (totalPage > 0 && readPages >= totalPage) {
    progressRate = 100;
  }

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
    progressRate: Math.min(100, Math.max(0, Math.round(progressRate))),
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

// PATCH /api/books - 도서 챌린지 변경 (단일 변경 또는 미완독 도서 일괄 이월)
export async function PATCH(req: NextRequest) {
  try {
    if (!NOTION_BOOK_DB_ID) {
      return NextResponse.json({ error: 'NOTION_BOOK_DB_ID 미설정' }, { status: 500 });
    }

    const body = await req.json();
    const { action, bookId, targetChallengeId, fromChallengeId, toChallengeId } = body;

    // 1. 개별 도서 챌린지 변경
    if (action === 'changeChallenge' || (!action && bookId && targetChallengeId)) {
      if (!bookId || !targetChallengeId) {
        return NextResponse.json({ error: 'bookId와 targetChallengeId가 필요합니다.' }, { status: 400 });
      }

      await notion.pages.update({
        page_id: bookId,
        properties: {
          '*관련 챌린지': {
            relation: [{ id: targetChallengeId }],
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: '도서의 챌린지가 성공적으로 변경되었습니다.',
      });
    }

    // 2. 미완독 도서 다음 챌린지로 일괄 이월
    if (action === 'batchRollover') {
      if (!fromChallengeId || !toChallengeId) {
        return NextResponse.json(
          { error: 'fromChallengeId와 toChallengeId가 필요합니다.' },
          { status: 400 }
        );
      }

      // 기존 챌린지에 연결된 도서 목록 조회
      const queryRes = await notion.databases.query({
        database_id: NOTION_BOOK_DB_ID,
        filter: {
          property: '*관련 챌린지',
          relation: {
            contains: fromChallengeId,
          },
        },
      });

      const books = queryRes.results.map((p: any) => parseBookPage(p));
      // 완독률 < 100% 인 도서만 필터링
      const incompleteBooks = books.filter((b) => (b.progressRate || 0) < 100);

      const updatedTitles: string[] = [];
      for (const b of incompleteBooks) {
        try {
          await notion.pages.update({
            page_id: b.id,
            properties: {
              '*관련 챌린지': {
                relation: [{ id: toChallengeId }],
              },
            },
          });
          updatedTitles.push(b.title);
        } catch (updateErr) {
          console.error(`도서(${b.title}) 챌린지 이월 실패:`, updateErr);
        }
      }

      return NextResponse.json({
        success: true,
        count: updatedTitles.length,
        titles: updatedTitles,
        message: `${updatedTitles.length}권의 미완독 도서가 성공적으로 이월되었습니다.`,
      });
    }

    return NextResponse.json({ error: '알 수 없는 action입니다.' }, { status: 400 });
  } catch (error: any) {
    console.error('도서 챌린지 변경 오류:', error);
    return NextResponse.json({ error: error.message || '챌린지 변경 실패' }, { status: 500 });
  }
}

