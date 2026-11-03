import { NextRequest, NextResponse } from 'next/server';
import { notion, NOTION_LOG_DB_ID } from '@/lib/notion';
import { getOrCreateChallengeByDate } from '@/lib/challengeHelper';
import { ReadingLog } from '@/lib/types';

// 노션 원본 페이지 객체를 ReadingLog 인터페이스로 변환
function parseLogPage(page: any): ReadingLog {
  const props = page.properties;

  const dateProp = props['읽은 날짜'] || props['날짜'] || props['이름'];
  const date = dateProp?.title?.map((t: any) => t.plain_text).join('') || '';

  const pageNum = props['이번에 읽은 페이지(숫자)']?.number || props['읽은 페이지']?.number || 0;
  const content = props['독서 감상록']?.rich_text?.map((t: any) => t.plain_text).join('') || '';

  const bookRelation = props['관련 책']?.relation || props['*관련 책']?.relation || [];
  const bookId = bookRelation.length > 0 ? bookRelation[0].id : '';

  const challengeRelation = props['관련 챌린지']?.relation || props['*관련 챌린지']?.relation || [];
  const challengeId = challengeRelation.length > 0 ? challengeRelation[0].id : '';

  const createdAt = page.created_time || '';

  return {
    id: page.id,
    date,
    page: pageNum,
    content,
    bookId,
    challengeId,
    createdAt,
  };
}

// GET /api/logs - 독서일지 목록 조회
export async function GET(req: NextRequest) {
  try {
    if (!NOTION_LOG_DB_ID) {
      return NextResponse.json({ error: 'NOTION_LOG_DB_ID 미설정' }, { status: 500 });
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
      database_id: NOTION_LOG_DB_ID,
      ...filterObj,
      sorts: [
        {
          property: '읽은 날짜',
          direction: 'descending',
        },
      ],
      page_size: 100,
    });

    const logs = queryRes.results.map((p: any) => parseLogPage(p));
    return NextResponse.json({ logs });
  } catch (error: any) {
    console.error('독서일지 조회 오류:', error);
    return NextResponse.json({ error: error.message || '독서일지 조회 실패' }, { status: 500 });
  }
}

// POST /api/logs - 독서일지 작성 (도서 및 해당 월 챌린지 자동 연결)
export async function POST(req: NextRequest) {
  try {
    if (!NOTION_LOG_DB_ID) {
      return NextResponse.json({ error: 'NOTION_LOG_DB_ID 미설정' }, { status: 500 });
    }

    const body = await req.json();
    const { bookId, date, page, content, challengeId } = body;

    if (!bookId) {
      return NextResponse.json({ error: '관련 책 ID는 필수입니다.' }, { status: 400 });
    }

    const logDate = date || new Date().toISOString().slice(0, 10);

    // 읽은 날짜 기준으로 해당 월 챌린지 ID 자동 확보
    let targetChallengeId = challengeId;
    if (!targetChallengeId) {
      const autoChallenge = await getOrCreateChallengeByDate(logDate);
      targetChallengeId = autoChallenge.id;
    }

    const properties: any = {
      '읽은 날짜': {
        title: [{ type: 'text', text: { content: logDate } }],
      },
      '이번에 읽은 페이지(숫자)': {
        number: page ? Number(page) : 0,
      },
      '독서 감상록': {
        rich_text: [{ type: 'text', text: { content: content || '' } }],
      },
      '관련 책': {
        relation: [{ id: bookId }],
      },
    };

    if (targetChallengeId) {
      properties['관련 챌린지'] = {
        relation: [{ id: targetChallengeId }],
      };
    }

    const createdPage = await notion.pages.create({
      parent: { database_id: NOTION_LOG_DB_ID },
      properties,
    });

    return NextResponse.json({ log: parseLogPage(createdPage) });
  } catch (error: any) {
    console.error('독서일지 작성 오류:', error);
    return NextResponse.json({ error: error.message || '독서일지 작성 실패' }, { status: 500 });
  }
}

// DELETE /api/logs - 독서일지 삭제 (노션 아카이브)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const logId = searchParams.get('id');

    if (!logId) {
      return NextResponse.json({ error: '삭제할 일지 ID가 없습니다.' }, { status: 400 });
    }

    await notion.pages.update({
      page_id: logId,
      archived: true,
    });

    return NextResponse.json({ success: true, message: '독서일지가 삭제되었습니다.' });
  } catch (error: any) {
    console.error('독서일지 삭제 오류:', error);
    return NextResponse.json({ error: error.message || '독서일지 삭제 실패' }, { status: 500 });
  }
}
