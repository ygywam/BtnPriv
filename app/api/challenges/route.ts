import { NextRequest, NextResponse } from 'next/server';
import { notion, NOTION_CHALLENGE_DB_ID } from '@/lib/notion';
import { getOrCreateChallengeByDate, parseChallengePage, updateChallengePeriod } from '@/lib/challengeHelper';

// GET /api/challenges - 전체 챌린지 목록 조회
export async function GET(req: NextRequest) {
  try {
    if (!NOTION_CHALLENGE_DB_ID) {
      return NextResponse.json({ error: 'NOTION_CHALLENGE_DB_ID 미설정' }, { status: 500 });
    }

    const queryRes = await notion.databases.query({
      database_id: NOTION_CHALLENGE_DB_ID,
      sorts: [
        {
          property: '*챌린지 시작일',
          direction: 'descending',
        },
      ],
      page_size: 50,
    });

    const challenges = queryRes.results.map((page: any) => parseChallengePage(page));
    return NextResponse.json({ challenges });
  } catch (error: any) {
    console.error('챌린지 목록 조회 오류:', error);
    return NextResponse.json({ error: error.message || '챌린지 목록 조회 실패' }, { status: 500 });
  }
}

// POST /api/challenges - 챌린지 생성 또는 기간/희망일수 수정
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, challengeId, date, startDate, targetDays, title } = body;

    // 1. 날짜 기준 자동 조회/생성
    if (action === 'get_or_create') {
      const challenge = await getOrCreateChallengeByDate(date);
      return NextResponse.json({ challenge });
    }

    // 2. 기존 챌린지 기간 및 일수 조절
    if (action === 'update_period') {
      if (!challengeId || !startDate || !targetDays) {
        return NextResponse.json({ error: '필수 파라미터(challengeId, startDate, targetDays)가 누락되었습니다.' }, { status: 400 });
      }
      const updated = await updateChallengePeriod(challengeId, startDate, Number(targetDays), title);
      return NextResponse.json({ challenge: updated });
    }

    return NextResponse.json({ error: '알 수 없는 액션' }, { status: 400 });
  } catch (error: any) {
    console.error('챌린지 처리 오류:', error);
    return NextResponse.json({ error: error.message || '챌린지 처리 실패' }, { status: 500 });
  }
}
