import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 2000): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: unknown) {
      const err = error as { status?: number; message?: string };
      const is429 =
        err?.status === 429 ||
        err?.message?.includes('429') ||
        err?.message?.includes('Too Many Requests');
      const is503 =
        err?.status === 503 ||
        err?.message?.includes('503') ||
        err?.message?.includes('Service Unavailable');
      if (is429 && i < retries - 1) {
        const retryDelayMatch = err?.message?.match(/retry in (\d+)s/i);
        const waitMs = retryDelayMatch ? parseInt(retryDelayMatch[1]) * 1000 + 1000 : 60000;
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        continue;
      }
      if (is503 && i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}

export async function generateBookStatsYearComment(
  year: number,
  books: { title: string; author: string | null; category: string }[]
): Promise<string | null> {
  if (books.length === 0) return null;
  const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite-preview' });
  const list = books
    .map((b) => `- ${b.title} | ${b.author ?? ''} | ${b.category}`)
    .join('\n');
  const prompt = `너는 독서 기록 분석가야. 사용자가 해당 연도에 완독한 도서 목록을 보고 독서 성향, 선호 장르, 인상적인 점 등을 5줄 이내로 한국어로 코멘트해줘.

다음은 ${year}년에 완독한 도서 목록이야:
${list}

일반 문장으로만 답하고, 글머리 기호나 번호 목록은 쓰지 마. 최대 5줄.`;
  try {
    const result = await withRetry(() => model.generateContent(prompt));
    const text = result.response.text().trim();
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
      .slice(0, 5);
    const out = lines.join('\n');
    return out.length > 0 ? out : null;
  } catch {
    return null;
  }
}

export type BookReadingRecommendationResult = {
  owned: { title: string; author: string; reason: string };
  external: { title: string; author: string; reason: string };
};

function pickString(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

export async function generateBookReadingRecommendations(
  finished: { title: string; author: string | null; category: string }[],
  unreadOwned: { title: string; author: string | null; category: string }[]
): Promise<BookReadingRecommendationResult | null> {
  const system =
    '너는 독서 취향 분석 전문가야. 사용자의 완독 이력을 분석해 다음에 읽으면 좋을 책을 추천해줘. 반드시 JSON 형식으로만 응답해. 형식: {"owned": {"title": "", "author": "", "reason": ""}, "external": {"title": "", "author": "", "reason": ""}}';
  const finishedLines =
    finished.length > 0
      ? finished.map((b) => `- ${b.title} | ${b.author ?? ''} | ${b.category}`).join('\n')
      : '(없음)';
  const unreadLines =
    unreadOwned.length > 0
      ? unreadOwned.map((b) => `- ${b.title} | ${b.author ?? ''} | ${b.category}`).join('\n')
      : '(없음)';
  const ownedExactHint =
    unreadOwned.length > 0
      ? '\n\n응답의 owned.title과 owned.author는 반드시 위 「보유 중 미독서 도서 목록」에 적힌 책 한 권의 제목·저자와 글자·공백까지 완전히 동일하게 적어.'
      : '';
  const user = `완독한 도서 목록:\n${finishedLines}\n\n보유 중 미독서 도서 목록:\n${unreadLines}\n\n위 이력을 바탕으로 다음에 읽을 책을 추천해줘.${ownedExactHint}`;
  const model = genAI.getGenerativeModel({
    model: 'gemini-3.1-flash-lite-preview',
    tools: [{ googleSearch: {} }] as unknown as Parameters<typeof genAI.getGenerativeModel>[0]['tools'],
    systemInstruction: system,
  });
  try {
    const result = await withRetry(() => model.generateContent(user));
    const text = result.response.text();
    const fenced = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    const jsonRaw = fenced?.[1] ?? text.match(/\{[\s\S]*\}/)?.[0];
    if (!jsonRaw) return null;
    const parsed = JSON.parse(jsonRaw) as {
      owned?: { title?: unknown; author?: unknown; reason?: unknown };
      external?: { title?: unknown; author?: unknown; reason?: unknown };
    };
    const owned = parsed.owned;
    const ext = parsed.external;
    if (!owned || !ext) return null;
    const out: BookReadingRecommendationResult = {
      owned: {
        title: pickString(owned.title),
        author: pickString(owned.author),
        reason: pickString(owned.reason),
      },
      external: {
        title: pickString(ext.title),
        author: pickString(ext.author),
        reason: pickString(ext.reason),
      },
    };
    if (!out.external.title) return null;
    return out;
  } catch {
    return null;
  }
}
