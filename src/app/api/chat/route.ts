import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { messages, data } = await req.json();
    const destination = data?.destination || '여행지';

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response('GEMINI_API_KEY가 설정되지 않았습니다.', { status: 401 });
    }

    const systemInstruction = `당신은 ${destination} 여행을 도와주는 친절하고 전문적인 AI 가이드 'Gemini 여행 비서'입니다. 
여행 관련 질문(맛집, 명소, 날씨, 교통, 준비물 등)에 대해서만 답변해주세요.
답변은 한국어로, 친근하고 도움이 되는 어조로 작성해주세요. 너무 길지 않게 요점 위주로 깔끔하게 정리해서 답변해주세요.`;

    const google = createGoogleGenerativeAI({
      apiKey: apiKey,
    });

    const result = await streamText({
      model: google('gemini-2.5-flash'),
      system: systemInstruction,
      messages,
    });

    return result.toUIMessageStreamResponse();
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return new Response(error.message || 'Server Error', { status: 500 });
  }
}
