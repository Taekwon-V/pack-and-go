// @ts-nocheck
'use client';

import { useChat } from '@ai-sdk/react';
import { Bot, Send, User, Sparkles, AlertCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function GeminiChatWidget({ destination }: { destination: string }) {
  const [input, setInput] = useState('');
  
  const { messages, append, status, error } = useChat({
    api: '/api/chat',
    initialMessages: [
      {
        id: '1',
        role: 'assistant',
        content: `안녕하세요! **${destination}** 여행에 대해 무엇이든 물어보세요. 맛집, 명소, 교통편 등 어떤 것이든 답변해 드릴게요! ✨`
      }
    ]
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-[500px] bg-black/40 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl">
      {/* Header */}
      <div className="flex items-center px-6 py-4 bg-white/5 border-b border-white/10">
        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center mr-3">
          <Sparkles className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <h3 className="font-bold text-white">Gemini 여행 비서</h3>
          <p className="text-xs text-emerald-400">Powered by Google AI</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="m-4 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-200">
            {error.message.includes('API key') 
              ? 'Gemini API 키가 설정되지 않았습니다. .env.local 파일에 GEMINI_API_KEY를 추가해주세요.'
              : '오류가 발생했습니다. 잠시 후 다시 시도해주세요.'}
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                m.role === 'user' 
                  ? 'bg-blue-600/50 ml-3' 
                  : 'bg-emerald-600/50 mr-3'
              }`}>
                {m.role === 'user' ? <User className="w-4 h-4 text-blue-200" /> : <Bot className="w-4 h-4 text-emerald-200" />}
              </div>
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-blue-600/30 text-blue-50 rounded-tr-sm'
                  : 'bg-white/10 text-gray-200 rounded-tl-sm'
              }`}>
                {/* Render text with basic formatting support (newlines to br) */}
                {m.content.split('\n').map((line, i) => (
                  <span key={i}>
                    {line}
                    {i !== m.content.split('\n').length - 1 && <br />}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
        {status === 'submitted' || status === 'streaming' ? (
          <div className="flex justify-start">
            <div className="flex flex-row max-w-[85%]">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-emerald-600/50 mr-3">
                <Bot className="w-4 h-4 text-emerald-200" />
              </div>
              <div className="px-5 py-4 rounded-2xl bg-white/10 rounded-tl-sm flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        ) : null}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={(e) => {
        e.preventDefault();
        if (!input.trim()) return;
        append({ role: 'user', content: input }, { data: { destination } });
        setInput('');
      }} className="p-4 bg-white/5 border-t border-white/10">
        <div className="relative flex items-center">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`${destination}에 대해 질문해보세요...`}
            className="w-full bg-black/50 text-white placeholder-gray-500 text-sm rounded-full pl-5 pr-12 py-3.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 border border-white/10 transition-all"
            disabled={status === 'submitted' || status === 'streaming' || error != null}
          />
          <button
            type="submit"
            disabled={status === 'submitted' || status === 'streaming' || !input.trim() || error != null}
            className="absolute right-2 p-2 rounded-full bg-emerald-500 text-white hover:bg-emerald-400 disabled:opacity-50 disabled:hover:bg-emerald-500 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
