import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { base64Data, mimeType = 'image/jpeg' } = await request.json();
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!base64Data) {
      return NextResponse.json({ ok: false, error: '분석할 이미지 데이터가 없습니다.' }, { status: 400 });
    }

    if (!geminiKey) {
      return NextResponse.json({ ok: false, error: 'GEMINI_API_KEY가 설정되지 않았습니다.' }, { status: 500 });
    }

    // base64 헤더 제거 (data:image/jpeg;base64, 부분)
    const rawBase64 = base64Data.includes('base64,')
      ? base64Data.split('base64,')[1]
      : base64Data;

    const detectedMime = base64Data.includes('data:')
      ? base64Data.substring(5, base64Data.indexOf(';'))
      : mimeType;

    const prompt = `너는 정밀한 한국어 및 다국어 텍스트 인식(OCR) 전문가야.
제공된 이미지(책 본문 페이지 또는 손글씨 메모)에 담긴 글을 그대로 정확하게 추출해줘.
지침:
1. 불필요한 설명, 인사말, 서두, 마크다운 코드블록(\`\`\`) 등은 일체 포함하지 말고 오직 추출된 본문 글자만 출력할 것.
2. 오타나 오인식이 없도록 한 글자 한 글자 정확히 판독할 것.
3. 문단 줄바꿈은 원래 이미지의 구조를 최대한 반영할 것.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
    const payload = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: detectedMime,
                data: rawBase64,
              },
            },
          ],
        },
      ],
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini OCR 통신 오류 (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const ocrText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return NextResponse.json({
      ok: true,
      text: ocrText.trim(),
      ocrText: ocrText.trim(),
    });
  } catch (error: any) {
    console.error('Gemini OCR 오류:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
