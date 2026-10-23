// 노션 공식 SDK 인스턴스 및 환경변수 래퍼 (서버 전용, 브라우저 노출 없음)
import { Client } from '@notionhq/client';

export const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

export const NOTION_CHALLENGE_DB_ID = process.env.NOTION_CHALLENGE_DB_ID || '';
export const NOTION_BOOK_DB_ID = process.env.NOTION_BOOK_DB_ID || '';
export const NOTION_LOG_DB_ID = process.env.NOTION_LOG_DB_ID || '';
export const NOTION_INSIGHT_DB_ID = process.env.NOTION_INSIGHT_DB_ID || '';

/**
 * Base64 이미지 데이터를 노션 공식 file_uploads API를 통해 업로드하고 file_upload id를 반환하는 함수
 */
export async function uploadImageToNotion(base64Data: string, customFilename?: string): Promise<string> {
  const match = base64Data.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  let mimeType = 'image/jpeg';
  let rawBase64 = base64Data;
  if (match) {
    mimeType = match[1];
    rawBase64 = match[2];
  }
  const ext = mimeType.split('/')[1] || 'jpg';
  const filename = customFilename || `ocr_photo_${Date.now()}.${ext}`;
  const buffer = Buffer.from(rawBase64, 'base64');

  // Step 1: Notion file_upload 세션 생성
  const createRes = await fetch('https://api.notion.com/v1/file_uploads', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    body: JSON.stringify({
      filename,
      content_type: mimeType,
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`노션 파일 업로드 세션 생성 실패 (${createRes.status}): ${errText}`);
  }

  const uploadObj = await createRes.json();
  if (!uploadObj.upload_url || !uploadObj.id) {
    throw new Error(`노션 파일 업로드 URL 또는 ID 누락: ${JSON.stringify(uploadObj)}`);
  }

  // Step 2: 바이너리 전송 (multipart/form-data)
  const formData = new FormData();
  const blob = new Blob([buffer], { type: mimeType });
  formData.append('file', blob, filename);

  const sendRes = await fetch(uploadObj.upload_url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
      'Notion-Version': '2022-06-28',
    },
    body: formData,
  });

  if (!sendRes.ok) {
    const errText = await sendRes.text();
    throw new Error(`노션 파일 바이너리 전송 실패 (${sendRes.status}): ${errText}`);
  }

  return uploadObj.id;
}
