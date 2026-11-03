import { NextRequest, NextResponse } from 'next/server';
import { notion, NOTION_INSIGHT_DB_ID } from '@/lib/notion';
import { getOrCreateChallengeByDate } from '@/lib/challengeHelper';
import { Insight } from '@/lib/types';

// 노션 원본 페이지 객체를 Insight 인터페이스로 변환
function parseInsightPage(page: any): Insight {
  const props = page.properties;

  const quoteProp = props['내용'] || props['문장'] || props['인용구'] || props['이름'];
  const quote = quoteProp?.title?.map((t: any) => t.plain_text).join('') || '';

  const pageNum = props['페이지']?.rich_text?.map((t: any) => t.plain_text).join('') || '';

  const dateProp = props['읽은날짜'] || props['날짜'];
  const date = dateProp?.date?.start || '';

  const bookRelation = props['관련 책']?.relation || props['*관련 책']?.relation || [];
  const bookId = bookRelation.length > 0 ? bookRelation[0].id : '';

  const challengeRelation = props['관련 챌린지']?.relation || props['*관련 챌린지']?.relation || [];
  const challengeId = challengeRelation.length > 0 ? challengeRelation[0].id : '';

  const createdAt = page.created_time || '';

  return {
    id: page.id,
    quote,
    page: pageNum,
    date,
    bookId,
    challengeId,
    createdAt,
  };
}

// GET /api/insights - 문장수집 목록 조회
export async function GET(req: NextRequest) {
  try {
    if (!NOTION_INSIGHT_DB_ID) {
      return NextResponse.json({ error: 'NOTION_INSIGHT_DB_ID 미설정' }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const bookId = searchParams.get('bookId');
    const challengeId = searchParams.get('challengeId');

    const filterConditions: any[] = [];
    if (bookId) {
      filterConditions.push({
        property: '관련 책',
        relation: { contains: bookId },
      });
    }
    if (challengeId) {
      filterConditions.push({
        property: '관련 챌린지',
        relation: { contains: challengeId },
      });
    }

    const filterObj: any = {};
    if (filterConditions.length === 1) {
      filterObj.filter = filterConditions[0];
    } else if (filterConditions.length > 1) {
      filterObj.filter = { and: filterConditions };
    }

    const queryRes = await notion.databases.query({
      database_id: NOTION_INSIGHT_DB_ID,
      ...filterObj,
      sorts: [
        {
          timestamp: 'created_time',
          direction: 'descending',
        },
      ],
      page_size: 100,
    });

    const insights = queryRes.results.map((p: any) => parseInsightPage(p));
    return NextResponse.json({ insights });
  } catch (error: any) {
    console.error('문장수집 조회 오류:', error);
    return NextResponse.json({ error: error.message || '문장수집 조회 실패' }, { status: 500 });
  }
}

// POST /api/insights - 문장수집 등록 (도서 및 해당 월 챌린지 자동 연결)
export async function POST(req: NextRequest) {
  try {
    if (!NOTION_INSIGHT_DB_ID) {
      return NextResponse.json({ error: 'NOTION_INSIGHT_DB_ID 미설정' }, { status: 500 });
    }

    const body = await req.json();
    const { bookId, quote, page, date, challengeId } = body;

    if (!quote) {
      return NextResponse.json({ error: '문장 내용은 필수입니다.' }, { status: 400 });
    }

    const insightDate = date || new Date().toISOString().slice(0, 10);

    // 날짜 기준으로 해당 월 챌린지 ID 자동 확보
    let targetChallengeId = challengeId;
    if (!targetChallengeId) {
      const autoChallenge = await getOrCreateChallengeByDate(insightDate);
      targetChallengeId = autoChallenge.id;
    }

    const properties: any = {
      '내용': {
        title: [{ type: 'text', text: { content: quote } }],
      },
      '페이지': {
        rich_text: [{ type: 'text', text: { content: String(page || '') } }],
      },
      '읽은날짜': {
        date: { start: insightDate },
      },
    };

    if (bookId) {
      properties['관련 책'] = {
        relation: [{ id: bookId }],
      };
    }

    if (targetChallengeId) {
      properties['관련 챌린지'] = {
        relation: [{ id: targetChallengeId }],
      };
    }

    const createdPage = await notion.pages.create({
      parent: { database_id: NOTION_INSIGHT_DB_ID },
      properties,
    });

    return NextResponse.json({ insight: parseInsightPage(createdPage) });
  } catch (error: any) {
    console.error('문장수집 등록 오류:', error);
    return NextResponse.json({ error: error.message || '문장수집 등록 실패' }, { status: 500 });
  }
}

// DELETE /api/insights - 문장수집 삭제 (노션 아카이브)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const insightId = searchParams.get('id');

    if (!insightId) {
      return NextResponse.json({ error: '삭제할 문장수집 ID가 없습니다.' }, { status: 400 });
    }

    await notion.pages.update({
      page_id: insightId,
      archived: true,
    });

    return NextResponse.json({ success: true, message: '문장수집이 삭제되었습니다.' });
  } catch (error: any) {
    console.error('문장수집 삭제 오류:', error);
    return NextResponse.json({ error: error.message || '문장수집 삭제 실패' }, { status: 500 });
  }
}
