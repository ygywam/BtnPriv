// 노션 공식 SDK 인스턴스 및 환경변수 래퍼 (서버 전용, 브라우저 노출 없음)
import { Client } from '@notionhq/client';

export const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

export const NOTION_CHALLENGE_DB_ID = process.env.NOTION_CHALLENGE_DB_ID || '';
export const NOTION_BOOK_DB_ID = process.env.NOTION_BOOK_DB_ID || '';
export const NOTION_LOG_DB_ID = process.env.NOTION_LOG_DB_ID || '';
export const NOTION_INSIGHT_DB_ID = process.env.NOTION_INSIGHT_DB_ID || '';
