// 챌린지 자동 조회, 생성 및 기간 조절 헬퍼 함수
import { notion, NOTION_CHALLENGE_DB_ID } from './notion';
import { Challenge } from './types';

// 주어진 연, 월의 마지막 날짜(28~31) 구하기
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * 날짜(YYYY-MM-DD)를 기준으로 해당 월 챌린지를 찾고, 없으면 노션에 자동 생성
 */
export async function getOrCreateChallengeByDate(dateStr?: string): Promise<Challenge> {
  const targetDate = dateStr ? new Date(dateStr) : new Date();
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth() + 1;
  const lastDay = getDaysInMonth(year, month);

  const monthStr = String(month).padStart(2, '0');
  const defaultStartDate = `${year}-${monthStr}-01`;
  const defaultTitle = `${year}년 ${month}월 챌린지(${month}/1~${month}/${lastDay})`;

  if (!NOTION_CHALLENGE_DB_ID) {
    throw new Error('NOTION_CHALLENGE_DB_ID 환경변수가 설정되지 않았습니다.');
  }

  // 1. 기존 노션 챌린지 DB에서 해당 월 챌린지 검색
  const searchFilter = {
    or: [
      {
        property: '*챌린지 이름',
        title: {
          contains: `${year}년 ${month}월`,
        },
      },
      {
        property: '*챌린지 시작일',
        date: {
          equals: defaultStartDate,
        },
      },
    ],
  };

  try {
    const queryRes = await notion.databases.query({
      database_id: NOTION_CHALLENGE_DB_ID,
      filter: searchFilter,
      page_size: 1,
    });

    if (queryRes.results.length > 0) {
      const page = queryRes.results[0] as any;
      return parseChallengePage(page);
    }

    // 2. 없으면 노션 챌린지 DB에 새 월간 챌린지 페이지 자동 생성
    const newPage = await notion.pages.create({
      parent: { database_id: NOTION_CHALLENGE_DB_ID },
      properties: {
        '*챌린지 이름': {
          title: [
            {
              type: 'text',
              text: { content: defaultTitle },
            },
          ],
        },
        '*챌린지 시작일': {
          date: {
            start: defaultStartDate,
          },
        },
        '*희망 일수': {
          number: lastDay,
        },
        '상태': {
          status: {
            name: '진행중',
          },
        },
      },
    });

    return parseChallengePage(newPage);
  } catch (err: any) {
    console.error('챌린지 자동 생성/조회 오류:', err);
    throw err;
  }
}

/**
 * 챌린지 기간 및 일수 수동 조절 (1주, 2주, 1달, 2달, 사용자 커스텀)
 */
export async function updateChallengePeriod(
  challengeId: string,
  startDate: string,
  targetDays: number,
  title?: string
): Promise<Challenge> {
  const updateProps: any = {
    '*챌린지 시작일': {
      date: {
        start: startDate,
      },
    },
    '*희망 일수': {
      number: targetDays,
    },
  };

  if (title) {
    updateProps['*챌린지 이름'] = {
      title: [{ type: 'text', text: { content: title } }],
    };
  }

  const updatedPage = await notion.pages.update({
    page_id: challengeId,
    properties: updateProps,
  });

  return parseChallengePage(updatedPage);
}

/**
 * 노션 원본 페이지 객체를 Challenge 인터페이스로 변환
 */
export function parseChallengePage(page: any): Challenge {
  const props = page.properties;

  const titleProp = props['*챌린지 이름'] || props['이름'];
  const title = titleProp?.title?.map((t: any) => t.plain_text).join('') || '이름 없음';

  const startDateProp = props['*챌린지 시작일'];
  const startDate = startDateProp?.date?.start || '';

  const targetDaysProp = props['*희망 일수'];
  const targetDays = targetDaysProp?.number || 30;

  const endDateProp = props['*목표 종료일'];
  let endDate = '';
  if (endDateProp?.formula?.date) {
    endDate = endDateProp.formula.date.start || '';
  }

  const progressProp = props['*진행상황'];
  const progressText = progressProp?.formula?.string || '';

  const statusProp = props['상태'];
  const status = statusProp?.status?.name || '';

  const bookRelation = props['*관련 책']?.relation?.map((r: any) => r.id) || [];
  const logRelation = props['*독서 기록(관계형)']?.relation?.map((r: any) => r.id) || [];
  const insightRelation = props['3️⃣ 문장수집 DB']?.relation?.map((r: any) => r.id) || [];

  return {
    id: page.id,
    title,
    startDate,
    targetDays,
    endDate,
    progressText,
    status,
    bookIds: bookRelation,
    logIds: logRelation,
    insightIds: insightRelation,
  };
}
