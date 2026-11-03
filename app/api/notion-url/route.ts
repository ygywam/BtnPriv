import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // 사용자가 Vercel에 등록한 NOTION_PAGE_URL 또는 NEXT_PUBLIC_NOTION_PAGE_URL 둘 다 지원
  const url = process.env.NOTION_PAGE_URL || process.env.NEXT_PUBLIC_NOTION_PAGE_URL;
  const mode = req.nextUrl.searchParams.get('mode');

  // JSON 확인 모드
  if (mode === 'check') {
    return NextResponse.json({ ok: true, hasUrl: !!url, url: url || null });
  }

  // URL이 설정되어 있으면 노션 페이지로 즉시 이동
  if (url) {
    return NextResponse.redirect(url, 307);
  }

  // URL이 설정되지 않은 경우 안내 페이지 표시
  const html = `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="utf-8" />
      <title>노션 바로가기 안내 - 북튜닝</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", sans-serif;
          display: grid;
          place-items: center;
          min-height: 100vh;
          margin: 0;
          background: #fbf8f3;
          color: #2b221a;
          padding: 16px;
          box-sizing: border-box;
        }
        .card {
          background: white;
          padding: 36px 28px;
          border-radius: 24px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.08);
          max-width: 440px;
          width: 100%;
          text-align: center;
          border: 1px solid #e8ded2;
          box-sizing: border-box;
        }
        .icon { font-size: 42px; margin-bottom: 12px; }
        h2 { margin: 0 0 12px; font-size: 20px; font-weight: 800; color: #965327; }
        p { font-size: 14px; line-height: 1.6; color: #6b5c51; margin: 0 0 24px; }
        code { background: #f4ede4; padding: 4px 8px; border-radius: 6px; font-weight: bold; color: #80431a; font-family: monospace; }
        button {
          background: #965327;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: bold;
          font-size: 14px;
          cursor: pointer;
          transition: 0.15s ease;
        }
        button:hover { background: #7a3e18; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="icon">📚</div>
        <h2>노션 바로가기 URL 미설정</h2>
        <p>
          Vercel 대시보드의 <strong>Environment Variables</strong>에<br />
          <code>NOTION_PAGE_URL</code> 환경변수로<br />
          내 노션 페이지 주소를 등록해 주세요.
        </p>
        <button onclick="window.close()">창 닫기</button>
      </div>
    </body>
    </html>
  `;

  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
