import { NextResponse } from 'next/server';
import { notion, NOTION_LOG_DB_ID as LOG_DB_ID, NOTION_INSIGHT_DB_ID as INSIGHT_DB_ID } from '@/lib/notion';

export async function POST(request: Request) {
  try {
    const { bookTitle, author, readingLogs: clientReadingLogs, pageLogs: clientPageLogs, notionPageId, notes: clientNotes } = await request.json();
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!geminiKey) {
      return NextResponse.json({ ok: false, error: '서버에 GEMINI_API_KEY가 설정되지 않았습니다.' }, { status: 500 });
    }

    let readingLogs = clientReadingLogs || [];
    let pageLogs = clientPageLogs || [];

    // 만약 클라이언트에서 로그가 누락되었고 notionPageId가 있다면 노션 DB에서 직접 조회
    if (notionPageId && readingLogs.length === 0 && LOG_DB_ID) {
      try {
        const logRes = await notion.databases.query({
          database_id: LOG_DB_ID,
          filter: { property: '관련 책', relation: { contains: notionPageId } },
        });
        readingLogs = logRes.results.map((p: any) => ({
          readDate: p.properties['읽은 날짜']?.title[0]?.plain_text || '',
          readPages: p.properties['이번에 읽은 페이지(숫자)']?.number || 0,
          note: p.properties['독서 감상록']?.rich_text[0]?.plain_text || '',
        }));
      } catch (e) {
        console.warn('AI 감상문 생성 중 독서일지 조회 건너뜀:', e);
      }
    }

    if (notionPageId && pageLogs.length === 0 && INSIGHT_DB_ID) {
      try {
        const insightRes = await notion.databases.query({
          database_id: INSIGHT_DB_ID,
          filter: { property: '관련 책', relation: { contains: notionPageId } },
        });
        pageLogs = insightRes.results.map((p: any) => ({
          page: p.properties['페이지']?.rich_text[0]?.plain_text || '',
          notes: p.properties['내용']?.title[0]?.plain_text || '',
        }));
      } catch (e) {
        console.warn('AI 감상문 생성 중 문장수집 조회 건너뜀:', e);
      }
    }

    let readingSummary = readingLogs
      .map((l: any) => `[진도/감정] 날짜:${l.readDate}, 누적:${l.readPages}쪽 - "${l.note}"`)
      .join('\n');
    if (!readingSummary && clientNotes) {
      readingSummary = clientNotes;
    }
    const pageSummary = pageLogs
      .map((l: any) => `[발췌/인사이트] ${l.page}쪽 - "${l.notes}"`)
      .join('\n');

    const prompt = `너는 이 책을 정독하고 메모를 남긴 '독자 본인'이야.
아래 기록을 융합하여 '나만의 독서 감상문'을 작성해줘.

[도서명]: ${bookTitle}
[저자]: ${author}
[진도 및 감정]:
${readingSummary || '없음'}
[발췌 및 인사이트]:
${pageSummary || '없음'}

지침: 1인칭 주인공 어조 확립, 제3자 말투 금지, 마크다운 기호 금지. 빈 줄(엔터)만 사용.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API 통신 오류 (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // 노션 해당 도서 페이지 본문에 감상문 블록 추가
    if (notionPageId && generatedText) {
      try {
        const paragraphs = generatedText.split('\n').filter((p: string) => p.trim() !== '');
        const blocks = [
          {
            object: 'block',
            type: 'heading_2',
            heading_2: {
              rich_text: [{ type: 'text', text: { content: '✨ Gemini AI 감상문' } }],
              color: 'blue_background',
            },
          },
          ...paragraphs.map((p: string) => ({
            object: 'block',
            type: 'paragraph',
            paragraph: { rich_text: [{ type: 'text', text: { content: p.substring(0, 1999) } }] },
          })),
        ];

        await notion.blocks.children.append({
          block_id: notionPageId,
          children: blocks as any,
        });
      } catch (blockErr) {
        console.warn('노션 감상문 본문 추가 오류:', blockErr);
      }
    }

    return NextResponse.json({
      ok: true,
      report: generatedText,
      aiReport: generatedText,
    });
  } catch (error: any) {
    console.error('AI 감상문 생성 오류:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
