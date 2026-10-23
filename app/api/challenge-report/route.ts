import { NextRequest, NextResponse } from 'next/server';
import { notion, NOTION_BOOK_DB_ID, NOTION_LOG_DB_ID, NOTION_INSIGHT_DB_ID } from '@/lib/notion';
import { parseChallengePage } from '@/lib/challengeHelper';
import { callGemini } from '@/lib/gemini';

export const maxDuration = 60; // AI 생성 및 노션 블록 생성을 위한 충분한 시간

export async function POST(req: NextRequest) {
  try {
    const { challengeId } = await req.json();

    if (!challengeId) {
      return NextResponse.json({ error: 'challengeId가 필요합니다.' }, { status: 400 });
    }

    // 1. 챌린지 기본 정보 조회
    const challengePage = await notion.pages.retrieve({ page_id: challengeId });
    const challenge = parseChallengePage(challengePage);

    // 2. 해당 챌린지에 연결된 도서 목록 조회
    const booksQuery = await notion.databases.query({
      database_id: NOTION_BOOK_DB_ID,
      filter: {
        property: '*관련 챌린지',
        relation: { contains: challengeId },
      },
    });
    const books = booksQuery.results.map((p: any) => {
      const props = p.properties;
      const title = props['*책 제목']?.title?.map((t: any) => t.plain_text).join('') || '무제';
      const author = props['저자']?.rich_text?.map((t: any) => t.plain_text).join('') || '';
      const totalPage = props['*전체 페이지수']?.number || 0;
      return { id: p.id, title, author, totalPage };
    });

    // 3. 해당 챌린지에 연결된 독서일지 조회
    const logsQuery = await notion.databases.query({
      database_id: NOTION_LOG_DB_ID,
      filter: {
        property: '관련 챌린지',
        relation: { contains: challengeId },
      },
      sorts: [{ property: '읽은 날짜', direction: 'ascending' }],
    });
    const logs = logsQuery.results.map((p: any) => {
      const props = p.properties;
      const date = props['읽은 날짜']?.title?.map((t: any) => t.plain_text).join('') || '';
      const page = props['이번에 읽은 페이지(숫자)']?.number || 0;
      const content = props['독서 감상록']?.rich_text?.map((t: any) => t.plain_text).join('') || '';
      const bookRel = props['관련 책']?.relation?.[0]?.id;
      const bookTitle = books.find((b) => b.id === bookRel)?.title || '';
      return { date, page, content, bookTitle };
    });

    // 4. 해당 챌린지에 연결된 문장수집 조회
    const insightsQuery = await notion.databases.query({
      database_id: NOTION_INSIGHT_DB_ID,
      filter: {
        property: '관련 챌린지',
        relation: { contains: challengeId },
      },
      sorts: [{ property: '읽은날짜', direction: 'ascending' }],
    });
    const insights = insightsQuery.results.map((p: any) => {
      const props = p.properties;
      const quote = props['내용']?.title?.map((t: any) => t.plain_text).join('') || '';
      const page = props['페이지']?.rich_text?.map((t: any) => t.plain_text).join('') || '';
      const date = props['읽은날짜']?.date?.start || '';
      const bookRel = props['관련 책']?.relation?.[0]?.id;
      const bookTitle = books.find((b) => b.id === bookRel)?.title || '';
      return { quote, page, date, bookTitle };
    });

    if (books.length === 0 && logs.length === 0 && insights.length === 0) {
      return NextResponse.json({
        error: '해당 챌린지에 기록된 책, 일지, 문장수집 데이터가 없어 리포트를 생성할 수 없습니다.',
      }, { status: 400 });
    }

    // 5. Gemini 프롬프트 구성 (노션 8월 챌린지 본문 양식 완벽 반영)
    const prompt = `
당신은 대한민국 최고의 독서 멘토이자 전문 독서 에세이 작가입니다.
사용자가 이번 독서 챌린지 동안 노션에 기록한 도서 목록, 일자별 독서일지, 문장수집 데이터를 바탕으로 두 가지 결과물을 작성해야 합니다:
1. '독서 리포트': 이번 챌린지의 총평, 핵심 통계 요약, 인상적인 문장들과 사유(인사이트 셀렉션), 키워드와 성찰
2. '블로그 완성글': 블로그나 브런치에 바로 발행할 수 있는 후킹 제목 후보 4개와 깊이 있는 사유가 담긴 완성형 독서 에세이 본문

[챌린지 정보]
- 챌린지 이름: ${challenge.title}
- 챌린지 기간: 시작일 ${challenge.startDate}, 희망일수 ${challenge.targetDays}일

[읽은 도서 목록]
${books.map((b, i) => `${i + 1}. 《${b.title}》 (${b.author}, 전체 ${b.totalPage}p)`).join('\n')}

[작성된 독서일지들]
${logs.map((l) => `- [${l.date}] 《${l.bookTitle}》 ${l.page}p: ${l.content}`).join('\n')}

[수집한 문장 및 나의 생각들]
${insights.map((s) => `- 《${s.bookTitle}》 (${s.page ? s.page + 'p' : s.date}): "${s.quote}"`).join('\n\n')}

반드시 아래 JSON 형식으로만 응답해 주세요. 다른 설명 없이 유효한 JSON만 출력해야 합니다:
\`\`\`json
{
  "report": {
    "summary": "이번 챌린지에 대한 따뜻하고 통찰력 있는 총평 (3~4문장)",
    "statsText": "도서 n권, 독서일지 n회, 문장수집 n개 달성 등 성과 요약",
    "insightsSelection": [
      {
        "quote": "가장 인상적인 원문 문장",
        "bookInfo": "《도서명》 (페이지 또는 날짜)",
        "commentary": "이 문장에 담긴 의미와 사용자의 메모를 결합한 깊은 해설 성찰"
      }
    ],
    "reflection": "이번 챌린지를 관통하는 중심 키워드 2~3개와 앞으로의 삶과 사유로 확장되는 성찰 제언"
  },
  "blog": {
    "hookingTitles": [
      "후킹 제목 후보 1",
      "후킹 제목 후보 2",
      "후킹 제목 후보 3",
      "후킹 제목 후보 4"
    ],
    "mainTitle": "블로그 에세이 대표 제목",
    "essayContent": "소제목과 함께 풍부한 사유와 개인적 성찰이 녹아든 완성된 블로그 에세이 본문 (줄바꿈 포함 마크다운 형식)"
  }
}
\`\`\`
`;

    // 6. Gemini 호출
    const geminiRaw = await callGemini(prompt);
    let parsedData: any = null;

    try {
      const jsonMatch = geminiRaw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : geminiRaw;
      parsedData = JSON.parse(jsonStr.trim());
    } catch (e) {
      console.error('Gemini JSON 파싱 오류, 원문:', geminiRaw);
      return NextResponse.json({ error: 'AI 리포트 응답 파싱 실패', raw: geminiRaw }, { status: 500 });
    }

    const { report, blog } = parsedData;

    // 7. 노션 챌린지 페이지 본문에 2개의 토글 블록 생성
    // 7-1. 토글 1: 독서 리포트
    const reportChildrenBlocks: any[] = [
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{ type: 'text', text: { content: report.summary || '' } }],
        },
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{ type: 'text', text: { content: `📊 성과: ${report.statsText || ''}` }, annotations: { bold: true } }],
        },
      },
      {
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ type: 'text', text: { content: '1 · 인사이트 셀렉션 — 당신이 쓴 문장' } }],
        },
      },
    ];

    if (report.insightsSelection && Array.isArray(report.insightsSelection)) {
      for (const item of report.insightsSelection) {
        reportChildrenBlocks.push({
          object: 'block',
          type: 'quote',
          quote: {
            rich_text: [{ type: 'text', text: { content: item.quote || '' } }],
          },
        });
        reportChildrenBlocks.push({
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              { type: 'text', text: { content: `— ${item.bookInfo || ''}\n` }, annotations: { italic: true, color: 'gray' } },
              { type: 'text', text: { content: item.commentary || '' } },
            ],
          },
        });
      }
    }

    reportChildrenBlocks.push({
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{ type: 'text', text: { content: '2 · 독서 키워드와 성찰' } }],
      },
    });
    reportChildrenBlocks.push({
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [{ type: 'text', text: { content: report.reflection || '' } }],
      },
    });

    // 7-2. 토글 2: 블로그 완성글
    const blogChildrenBlocks: any[] = [
      {
        object: 'block',
        type: 'heading_3',
        heading_3: {
          rich_text: [{ type: 'text', text: { content: '후킹 제목 후보 (4)' } }],
        },
      },
    ];

    if (blog.hookingTitles && Array.isArray(blog.hookingTitles)) {
      for (const title of blog.hookingTitles) {
        blogChildrenBlocks.push({
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [{ type: 'text', text: { content: title } }],
          },
        });
      }
    }

    blogChildrenBlocks.push({ object: 'block', type: 'divider', divider: {} });
    blogChildrenBlocks.push({
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{ type: 'text', text: { content: blog.mainTitle || '독서 에세이' } }],
      },
    });

    // 본문 문단들 나누어 추가 (1000자 초과 방지)
    const essayParagraphs = (blog.essayContent || '').split('\n\n').filter(Boolean);
    for (const p of essayParagraphs) {
      blogChildrenBlocks.push({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{ type: 'text', text: { content: p.slice(0, 1900) } }],
        },
      });
    }

    // 8. 노션 본문에 2개 토글 블록 append
    await notion.blocks.children.append({
      block_id: challengeId,
      children: [
        {
          object: 'block',
          type: 'toggle',
          toggle: {
            rich_text: [{ type: 'text', text: { content: `📊 ${challenge.title} 독서 리포트` } }],
            children: reportChildrenBlocks.slice(0, 95), // 노션 최대 자식 한도 100개
          },
        },
        {
          object: 'block',
          type: 'toggle',
          toggle: {
            rich_text: [{ type: 'text', text: { content: `✍️ ${challenge.title} 블로그 완성글` } }],
            children: blogChildrenBlocks.slice(0, 95),
          },
        },
      ],
    });

    return NextResponse.json({
      success: true,
      report,
      blog,
      message: '노션 챌린지 페이지 본문에 독서 리포트 및 블로그 완성글이 토글 블록으로 저장되었습니다.',
    });
  } catch (error: any) {
    console.error('챌린지 리포트 생성 오류:', error);
    return NextResponse.json({ error: error.message || '리포트 생성 실패' }, { status: 500 });
  }
}
