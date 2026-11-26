// Google Gemini API 호출 유틸리티 (서버 사이드 전용)
// 경량·고속 모델부터 시작해 과부하(503/429) 시 상위 모델로 자동 폴백
export const GEMINI_FALLBACK_MODELS = [
  'gemini-2.5-flash-lite',
  'gemini-3.5-flash-lite',
  'gemini-3.7-flash',
  'gemini-3.8-flash',
] as const;

export const GEMINI_MODEL = GEMINI_FALLBACK_MODELS[0];

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

export async function callGemini(prompt: string, base64Image?: string, mimeType: string = 'image/jpeg'): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY 환경변수가 설정되지 않았습니다.');
  }

  const parts: any[] = [];
  if (base64Image) {
    // base64 데이터 헤더 분리
    const cleanBase64 = base64Image.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '');
    parts.push({
      inline_data: {
        mime_type: mimeType,
        data: cleanBase64,
      },
    });
  }
  parts.push({ text: prompt });

  const body = JSON.stringify({ contents: [{ parts }] });
  let lastError: Error | null = null;

  for (let i = 0; i < GEMINI_FALLBACK_MODELS.length; i++) {
    const model = GEMINI_FALLBACK_MODELS[i];
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    if (res.ok) {
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }

    const errText = await res.text();
    lastError = new Error(`Gemini API 통신 오류 (${model}, ${res.status}): ${errText}`);

    if (!RETRYABLE_STATUS.has(res.status) || i === GEMINI_FALLBACK_MODELS.length - 1) {
      throw lastError;
    }

    console.warn(`[Gemini] ${model} 응답 ${res.status} — 다음 예비 모델로 재시도합니다.`);
  }

  throw lastError || new Error('Gemini API 호출에 실패했습니다.');
}
