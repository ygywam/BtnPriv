import { NextRequest, NextResponse } from 'next/server';
import { notion, NOTION_BOOK_DB_ID, NOTION_LOG_DB_ID, NOTION_INSIGHT_DB_ID } from '@/lib/notion';
import { parseChallengePage } from '@/lib/challengeHelper';
import { callGemini } from '@/lib/gemini';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // AI 생성 및 노션 블록 생성을 위한 충분한 시간

// 긴 문자열을 노션 rich_text 2000자 한도 미만 조각들로 분할
function chunkString(str: string, size = 1900): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < str.length; i += size) {
    chunks.push(str.slice(i, i + size));
  }
  return chunks.length ? chunks : [''];
}

// 1. GET: 기존에 노션에 저장된 챌린지 리포트 및 블로그 글 조회
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const challengeId = searchParams.get('challengeId');

    if (!challengeId) {
      return NextResponse.json({ ok: false, error: 'challengeId가 필요합니다.' }, { status: 400 });
    }

    const blocksRes = await notion.blocks.children.list({
      block_id: challengeId,
      page_size: 100,
    });

    const blocks = blocksRes.results as any[];

    // 1-1. 우선순위: challenge-report-json 메타데이터 코드 블록 확인 (100% 손실 없는 즉시 복원)
    for (const b of blocks) {
      if (b.type === 'code') {
        const captionText = b.code?.caption?.map((c: any) => c.plain_text).join('') || '';
        if (captionText.includes('challenge-report-json')) {
          try {
            const rawJson = b.code?.rich_text?.map((r: any) => r.plain_text).join('') || '';
            const data = JSON.parse(rawJson);
            if (data.report && data.blog) {
              return NextResponse.json({
                ok: true,
                report: data.report,
                blog: data.blog,
                savedAt: data.savedAt || null,
              });
            }
          } catch (jsonErr) {
            console.warn('메타데이터 코드 블록 파싱 오류:', jsonErr);
          }
        }
      }
    }

    // 1-2. 보조 복원: 노션의 접이식 토글 블록(독서 리포트 & 블로그 완성글)을 파싱하여 복원
    let reportToggleBlock: any = null;
    let blogToggleBlock: any = null;

    for (const b of blocks) {
      if (b.type === 'toggle') {
        const toggleTitle = b.toggle?.rich_text?.map((t: any) => t.plain_text).join('') || '';
        if (toggleTitle.includes('독서 리포트') || toggleTitle.includes('리포트')) {
          reportToggleBlock = b;
        } else if (toggleTitle.includes('블로그') || toggleTitle.includes('에세이')) {
          blogToggleBlock = b;
        }
      }
    }

    if (!reportToggleBlock && !blogToggleBlock) {
      return NextResponse.json({ ok: true, report: null, blog: null });
    }

    let parsedReport: any = null;
    let parsedBlog: any = null;

    // 독서 리포트 토글 자식 블록들 파싱
    if (reportToggleBlock) {
      try {
        const rChildren = await notion.blocks.children.list({
          block_id: reportToggleBlock.id,
          page_size: 100,
        });

        let summary = '';
        let statsText = '';
        const insightsSelection: any[] = [];
        let reflection = '';
        const recommendedBooks: any[] = [];

        let currentSection: 'header' | 'insights' | 'reflection' | 'recommend' | null = 'header';
        let currentQuote: string = '';

        for (const child of rChildren.results as any[]) {
          const cType = child.type;
          const text = child[cType]?.rich_text?.map((t: any) => t.plain_text).join('') || '';

          if (text.includes('1 · 인사이트 셀렉션')) {
            currentSection = 'insights';
            continue;
          }
          if (text.includes('2 · 독서 키워드와 성찰') || text.includes('사유의 흐름')) {
            currentSection = 'reflection';
            continue;
          }
          if (text.includes('추천도서')) {
            currentSection = 'recommend';
            continue;
          }

          if (currentSection === 'header') {
            if (text.startsWith('📊 성과:')) {
              statsText = text.replace('📊 성과:', '').trim();
            } else if (!summary && text.trim()) {
              summary = text.trim();
            }
          } else if (currentSection === 'insights') {
            if (cType === 'quote') {
              currentQuote = text.trim();
            } else if (cType === 'paragraph' && currentQuote) {
              const lines = text.split('\n');
              const bookInfo = lines[0]?.replace(/^[—\-]\s*/, '').trim() || '';
              const commentary = lines.slice(1).join('\n').trim() || lines[0] || '';
              insightsSelection.push({
                quote: currentQuote,
                bookInfo,
                commentary,
              });
              currentQuote = '';
            }
          } else if (currentSection === 'reflection') {
            if (text.trim()) {
              reflection = (reflection ? reflection + '\n\n' : '') + text.trim();
            }
          } else if (currentSection === 'recommend') {
            if (text.trim()) {
              const lines = text.split('\n');
              const titleLine = lines[0] || '';
              const descLine = lines.find((l: string) => l.includes('내용:')) || '';
              const reasonLine = lines.find((l: string) => l.includes('추천 이유:')) || '';

              if (descLine || reasonLine) {
                const titleMatch = titleLine.match(/📖?\s*(.*?)\s*\((.*?)\)/);
                recommendedBooks.push({
                  title: titleMatch ? titleMatch[1].trim() : titleLine.replace(/^📖\s*/, '').trim(),
                  author: titleMatch ? titleMatch[2].trim() : '',
                  description: descLine.replace(/^[•\-\s]*내용:\s*/, '').trim(),
                  reason: reasonLine.replace(/^[•\-\s]*추천 이유:\s*/, '').trim(),
                });
              } else if (text.includes('—') || text.includes('·')) {
                // 구 양식: 제목 · 저자 — 내용 및 이유
                const parts = text.split('—');
                const header = parts[0] || '';
                const body = parts.slice(1).join('—').trim();
                const subParts = header.split('·');
                const bTitle = subParts[0]?.replace(/^📖\s*/, '').trim() || '';
                const bAuthor = subParts[1]?.trim() || '';
                recommendedBooks.push({
                  title: bTitle,
                  author: bAuthor,
                  description: '',
                  reason: body,
                });
              } else {
                recommendedBooks.push({
                  title: text.replace(/^📖\s*/, '').trim(),
                  author: '',
                  description: '',
                  reason: '',
                });
              }
            }
          }
        }

        parsedReport = {
          summary: summary || '노션에 저장된 독서 리포트입니다.',
          statsText,
          insightsSelection,
          reflection,
          recommendedBooks,
        };
      } catch (err) {
        console.warn('리포트 토글 파싱 실패:', err);
      }
    }

    // 블로그 완성글 토글 자식 블록들 파싱
    if (blogToggleBlock) {
      try {
        const bChildren = await notion.blocks.children.list({
          block_id: blogToggleBlock.id,
          page_size: 100,
        });

        const hookingTitles: string[] = [];
        let mainTitle = '';
        const essayParagraphs: string[] = [];
        let isEssaySection = false;

        for (const child of bChildren.results as any[]) {
          const cType = child.type;
          const text = child[cType]?.rich_text?.map((t: any) => t.plain_text).join('') || '';

          if (cType === 'bulleted_list_item' || cType === 'numbered_list_item') {
            hookingTitles.push(text.trim());
          } else if (cType === 'heading_2' && !mainTitle) {
            mainTitle = text.trim();
            isEssaySection = true;
          } else if (isEssaySection && cType === 'paragraph' && text.trim()) {
            essayParagraphs.push(text.trim());
          }
        }

        parsedBlog = {
          hookingTitles,
          mainTitle: mainTitle || '독서 에세이',
          essayContent: essayParagraphs.join('\n\n'),
        };
      } catch (err) {
        console.warn('블로그 토글 파싱 실패:', err);
      }
    }

    return NextResponse.json({
      ok: true,
      report: parsedReport,
      blog: parsedBlog,
    });
  } catch (error: any) {
    console.error('챌린지 리포트 조회 오류:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

// 2. POST: Gemini AI를 통한 챌린지 리포트 및 블로그 글 신규 생성 및 노션 영구 저장
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

    // 5. Gemini 프롬프트 구성 (추천도서 3~4권 포함)
    const prompt = `
당신은 대한민국 최고의 독서 멘토이자 전문 독서 에세이 작가입니다.
사용자가 이번 독서 챌린지 동안 노션에 기록한 도서 목록, 일자별 독서일지, 문장수집 데이터를 바탕으로 세 가지 핵심 결과물을 작성해야 합니다:
1. '독서 리포트': 이번 챌린지의 총평, 핵심 통계 요약, 인상적인 문장들과 사유(인사이트 셀렉션), 키워드와 성찰
2. '추천도서 (3~4권)': 이번 챌린지에서 읽은 도서들의 주제와 질문, 사용자의 생각을 심화하고 확장할 수 있는 실제 대한민국에 출판된 추천 도서 3~4권 (도서명, 저자, 핵심 내용, 읽은 책들과의 연결점 및 구체적 추천 이유)
3. '블로그 완성글': 블로그나 브런치에 바로 발행할 수 있는 후킹 제목 후보 4개와 깊이 있는 사유가 담긴 완성형 독서 에세이 본문

[챌린지 정보]
- 챌린지 이름: ${challenge.title}
- 챌린지 기간: 시작일 ${challenge.startDate}, 희망일수 ${challenge.targetDays}일

[읽은 도서 목록]
${books.map((b, i) => `${i + 1}. 《${b.title}》 (${b.author}, 전체 ${b.totalPage}p)`).join('\n')}

[작성된 독서일지들]
${logs.map((l) => `- [${l.date}] 《${l.bookTitle}》 ${l.page}p: ${l.content}`).join('\n')}

[수집한 문장 및 나의 생각들]
${insights.map((s) => `- 《${s.bookTitle}》 (${s.page ? s.page + 'p' : s.date}): "${s.quote}"`).join('\n\n')}

반드시 아래 JSON 형식으로만 응답해 주세요. 가공되지 않은 순수 JSON 코드 블록만 출력해야 합니다:
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
    "reflection": "이번 챌린지를 관통하는 중심 키워드 2~3개와 앞으로의 삶과 사유로 확장되는 성찰 제언",
    "recommendedBooks": [
      {
        "title": "실제 출간된 책 제목 (정확한 한국어 도서명)",
        "author": "저자명",
        "description": "이 책의 핵심 내용과 주제 요약 (2~3문장)",
        "reason": "이번 챌린지에서 읽은 책(${books.map((b) => b.title).join(', ')})과 사유의 흐름에 비추어 이 책을 추천하는 구체적인 이유"
      }
    ]
  },
  "blog": {
    "hookingTitles": [
      "후킹 제목 후보 1",
      "후킹 제목 후보 2",
      "후킹 제목 후보 3",
      "후킹 제목 후보 4"
    ],
    "mainTitle": "블로그 에세이 대표 제목",
    "essayContent": "소제목과 함께 풍부한 사유와 개인적 성찰이 녹아든 완성된 블로그 에세이 본문 (줄바꿈 포함 완성글)"
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

    // 7. 기존에 저장되었던 챌린지 리포트 토글 및 메타데이터 블록 정리 (중복 생성 방지)
    try {
      const existingBlocks = await notion.blocks.children.list({
        block_id: challengeId,
        page_size: 100,
      });

      for (const b of existingBlocks.results as any[]) {
        if (b.type === 'toggle') {
          const tText = b.toggle?.rich_text?.map((t: any) => t.plain_text).join('') || '';
          if (tText.includes('독서 리포트') || tText.includes('블로그 완성글')) {
            try {
              await notion.blocks.delete({ block_id: b.id });
            } catch (delErr) {
              console.warn('기존 리포트 토글 삭제 실패:', b.id, delErr);
            }
          }
        } else if (b.type === 'code') {
          const cText = b.code?.caption?.map((c: any) => c.plain_text).join('') || '';
          if (cText.includes('challenge-report-json')) {
            try {
              await notion.blocks.delete({ block_id: b.id });
            } catch (delErr) {
              console.warn('기존 메타데이터 코드 블록 삭제 실패:', b.id, delErr);
            }
          }
        }
      }
    } catch (cleanErr) {
      console.warn('기존 리포트 블록 정리 오류:', cleanErr);
    }

    // 8. 노션 챌린지 페이지 본문에 자식 블록 구성
    // 8-1. 토글 1: 독서 리포트
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

    // 8-2. 추천도서 3~4권 섹션 추가
    if (report.recommendedBooks && Array.isArray(report.recommendedBooks) && report.recommendedBooks.length > 0) {
      reportChildrenBlocks.push({
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ type: 'text', text: { content: '3 · 추천도서 — 다음 독서를 위한 제안' } }],
        },
      });

      for (const b of report.recommendedBooks) {
        reportChildrenBlocks.push({
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              { type: 'text', text: { content: `📖 ${b.title} ` }, annotations: { bold: true } },
              { type: 'text', text: { content: `(${b.author})\n` }, annotations: { italic: true, color: 'gray' } },
              { type: 'text', text: { content: `• 내용: ${b.description || ''}\n• 추천 이유: ${b.reason || ''}` } },
            ],
          },
        });
      }
    }

    // 8-3. 토글 2: 블로그 완성글
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

    // 8-4. 웹앱 즉각 복원용 JSON 데이터 메타데이터 블록 구성 (최대 2000자 단위 분할)
    const jsonPayload = JSON.stringify({
      savedAt: new Date().toISOString(),
      report,
      blog,
    });
    const jsonChunks = chunkString(jsonPayload, 1900);

    // 9. 노션 본문에 2개 토글 블록 및 메타데이터 블록 append
    await notion.blocks.children.append({
      block_id: challengeId,
      children: [
        {
          object: 'block',
          type: 'toggle',
          toggle: {
            rich_text: [{ type: 'text', text: { content: `📊 ${challenge.title} 독서 리포트` } }],
            children: reportChildrenBlocks.slice(0, 95),
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
        {
          object: 'block',
          type: 'code',
          code: {
            caption: [{ type: 'text', text: { content: 'challenge-report-json' } }],
            language: 'json',
            rich_text: jsonChunks.map((chunk) => ({
              type: 'text',
              text: { content: chunk },
            })),
          },
        },
      ],
    });

    return NextResponse.json({
      success: true,
      report,
      blog,
      message: '노션 챌린지 페이지 본문에 독서 리포트, 추천도서 및 블로그 완성글이 안전하게 저장되었습니다.',
    });
  } catch (error: any) {
    console.error('챌린지 리포트 생성 오류:', error);
    return NextResponse.json({ error: error.message || '리포트 생성 실패' }, { status: 500 });
  }
}
