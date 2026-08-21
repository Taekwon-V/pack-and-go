import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, type ModelMessage } from 'ai';

export const runtime = 'nodejs';

type MessageRole = 'system' | 'user' | 'assistant';

type IncomingPart = {
  type?: unknown;
  text?: unknown;
};

type IncomingMessage = {
  role: MessageRole;
  content?: unknown;
  parts?: unknown;
};

type ChatRequestBody = {
  messages?: unknown;
  data?: unknown;
  destination?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isIncomingMessage(value: unknown): value is IncomingMessage {
  if (!isRecord(value)) return false;

  return value.role === 'system' || value.role === 'user' || value.role === 'assistant';
}

function getTextContent(message: IncomingMessage): string {
  if (typeof message.content === 'string') return message.content;
  if (!Array.isArray(message.parts)) return '';

  return message.parts
    .filter((part): part is IncomingPart => isRecord(part))
    .filter((part) => part.type === 'text' && typeof part.text === 'string')
    .map((part) => part.text as string)
    .join('\n');
}

function getDestination(data: unknown, destination: unknown): string {
  if (isRecord(data) && typeof data.destination === 'string') return data.destination;
  return typeof destination === 'string' ? destination : '여행지';
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ChatRequestBody;
    const messages = Array.isArray(body.messages) ? body.messages.filter(isIncomingMessage) : [];
    const destination = getDestination(body.data, body.destination);

    console.log('INCOMING MESSAGES:', JSON.stringify(messages, null, 2));

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response('GEMINI_API_KEY가 설정되지 않았습니다.', { status: 401 });
    }

    const systemInstruction = `당신은 ${destination} 여행을 도와주는 친절하고 전문적인 AI 가이드 'Gemini 여행 비서'입니다.
여행 관련 질문(맛집, 명소, 날씨, 교통, 준비물 등)에 대해서만 답변해주세요.
답변은 한국어로, 친근하고 도움이 되는 어조로 작성해주세요. 너무 길지 않게 요점 위주로 깔끔하게 정리해서 답변해주세요.`;

    const google = createGoogleGenerativeAI({ apiKey });
    const coreMessages: ModelMessage[] = messages.map((message) => ({
      role: message.role,
      content: getTextContent(message),
    }));

    const result = await streamText({
      model: google('gemini-2.5-flash'),
      system: systemInstruction,
      messages: coreMessages,
    });

    return result.toUIMessageStreamResponse();
  } catch (error: unknown) {
    console.error('Gemini API Error:', error);
    const message = error instanceof Error ? error.message : 'Server Error';
    return new Response(message, { status: 500 });
  }
}
