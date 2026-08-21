'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { Bot, Send, User, Sparkles, AlertCircle } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

function getMessageText(message: UIMessage): string {
  return message.parts.reduce((text, part) => (part.type === 'text' ? text + part.text : text), '');
}

export default function GeminiChatWidget({ destination }: { destination: string }) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const transport = useMemo(() => new DefaultChatTransport({ api: '/api/chat' }), []);
  const { messages, sendMessage, status, error, clearError } = useChat<UIMessage>({
    transport,
    messages: [
      {
        id: '1',
        role: 'assistant',
        parts: [
          {
            type: 'text',
            text: `안녕하세요! **${destination}** 여행에 대해 무엇이든 물어보세요. 맛집, 명소, 교통편 등 어떤 것이든 답변해 드릴게요! ✨`,
          },
        ],
      },
    ],
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    type ChatDebugSnapshot = {
      messages: UIMessage[];
      sendMessage: typeof sendMessage;
      status: typeof status;
      error: typeof error;
    };

    const debugWindow = window as Window & { MY_CHAT?: ChatDebugSnapshot };
    debugWindow.MY_CHAT = { messages, sendMessage, status, error };

    return () => {
      delete debugWindow.MY_CHAT;
    };
  }, [messages, sendMessage, status, error]);

  const isBusy = status === 'submitted' || status === 'streaming';
  const canSubmit = input.trim().length > 0 && !isBusy;

  const submitMessage = () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || !canSubmit) return;

    clearError();
    void sendMessage({ text: trimmedInput }, { body: { destination } });
    setInput('');
  };

  return (
    <section className="editorial-chat-box" aria-label={`${destination} Gemini 여행 비서`}>
      <header className="editorial-chat-header">
        <div className="editorial-chat-identity">
          <span className="editorial-chat-mark" aria-hidden="true">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <h3 className="editorial-chat-title">Gemini 여행 비서</h3>
            <p className="editorial-chat-subtitle">{destination} / shared field guide</p>
          </div>
        </div>
        <span className="editorial-chat-status">Ready to help</span>
      </header>

      {error && (
        <div className="editorial-chat-error" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            {error.message.includes('API key')
              ? 'Gemini API 키가 설정되지 않았습니다.'
              : '응답을 가져오지 못했습니다. 다시 시도해주세요.'}
          </p>
          <button type="button" onClick={clearError} className="editorial-chat-retry editorial-focus">
            Retry
          </button>
        </div>
      )}

      <div className="editorial-chat-messages" role="log" aria-live="polite" aria-label="Gemini 대화 내용">
        {messages.map((message) => {
          const messageText = getMessageText(message);

          return (
            <div key={message.id} className="editorial-chat-message" data-role={message.role}>
              <span className="editorial-chat-avatar" aria-hidden="true">
                {message.role === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
              </span>
              <div className="editorial-chat-bubble">
                {messageText.split('\n').map((line, index, lines) => (
                  <span key={`${message.id}-${index}`}>
                    {line}
                    {index !== lines.length - 1 && <br />}
                  </span>
                ))}
              </div>
            </div>
          );
        })}

        {isBusy && (
          <div className="editorial-chat-message" data-role="assistant" aria-label="Gemini가 답변을 작성하는 중입니다">
            <span className="editorial-chat-avatar" aria-hidden="true">
              <Bot className="h-3.5 w-3.5" />
            </span>
            <div className="editorial-chat-typing" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          submitMessage();
        }}
        className="editorial-chat-composer"
      >
        <label htmlFor="gemini-chat-input" className="sr-only">
          {destination}에 대해 질문하기
        </label>
        <div className="editorial-chat-composer-row">
          <textarea
            id="gemini-chat-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                submitMessage();
              }
            }}
            placeholder={`${destination}에 대해 질문해보세요...`}
            rows={1}
            className="editorial-chat-input editorial-focus"
            disabled={isBusy}
          />
          <button type="submit" disabled={!canSubmit} className="editorial-chat-send editorial-focus" aria-label="메시지 보내기">
            <Send className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <p className="editorial-chat-helper">Enter to send · Shift + Enter for a new line</p>
      </form>
    </section>
  );
}
