import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 2000): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: unknown) {
      const err = error as { status?: number; message?: string };
      const is429 =
        err?.status === 429 ||
        err?.message?.includes('429') ||
        err?.message?.includes('Too Many Requests') ||
        err?.message?.includes('rate_limit');
      const is503 =
        err?.status === 503 ||
        err?.message?.includes('503') ||
        err?.message?.includes('Service Unavailable') ||
        err?.message?.includes('overloaded');
      if (is429 && i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 60000));
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

const HIGHLIGHT_EXPLANATION_SYSTEM = `당신은 인문·역사·사회·철학 분야의 전문 해설자입니다.
사용자가 책에서 하이라이트한 문장을 깊이 있게 해설해주세요.
다음 항목을 포함하여 해설하세요:

이 문장이 등장하는 역사적·사회적 배경
핵심 개념이나 사건의 의미와 맥락
저자가 이 문장을 통해 전달하려는 논지나 문제의식
현대적 시사점 또는 독자가 얻을 수 있는 통찰

해설은 700자 내외의 한국어로 작성하고, 딱딱한 나열보다 자연스러운 문장으로 서술하세요.
제목, 헤더, 레이블 없이 해설 본문만 바로 시작하세요.`;

export async function generateHighlightExplanation(
  content: string,
  book: { title: string; author: string | null },
): Promise<string | null> {
  const trimmed = content.trim();
  if (!trimmed) return null;
  if (!process.env.ANTHROPIC_API_KEY) return null;

  const author = book.author?.trim() || '미상';
  const userMessage = `도서: ${book.title} / 저자: ${author}\n\n하이라이트: ${trimmed}`;

  try {
    const message = await withRetry(() =>
      anthropic.messages.create({
        model: 'claude-sonnet-5',
        max_tokens: 1024,
        system: HIGHLIGHT_EXPLANATION_SYSTEM,
        messages: [{ role: 'user', content: userMessage }],
      }),
    );

    const text = message.content
      .filter((block) => block.type === 'text')
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('\n')
      .trim();

    return text.length > 0 ? text : null;
  } catch {
    return null;
  }
}
