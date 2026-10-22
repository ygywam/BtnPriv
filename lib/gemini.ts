// Google Gemini API 호출 유틸리티 (서버 사이드 전용)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = 'gemini-2.5-flash';

export async function callGemini(prompt: string, base64Image?: string, mimeType: string = 'image/jpeg'): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY 환경변수가 설정되지 않았습니다.');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const contents: any[] = [];
  const parts: any[] = [];

  if (base64Image) {
    // base64 데이터 헤더 분리
    const cleanBase64 = base64Image.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
    parts.push({
      inline_data: {
        mime_type: mimeType,
        data: cleanBase64,
      },
    });
  }

  parts.push({ text: prompt });
  contents.push({ parts });

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API 통신 실패 (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return text;
}
