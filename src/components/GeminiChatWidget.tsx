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
    <div className="flex flex-col h-[500px] bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-md">
      {/* Header */}
      <div className="flex items-center px-6 py-4 bg-slate-50 border-b border-slate-200">
        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
          <Sparkles className="w-4 h-4 text-indigo-600" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900">Gemini 여행 비서</h3>
          <p className="text-xs text-indigo-600">Powered by Google AI</p>
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
                  ? 'bg-blue-100 ml-3' 
                  : 'bg-indigo-100 mr-3'
              }`}>
                {m.role === 'user' ? <User className="w-4 h-4 text-blue-600" /> : <Bot className="w-4 h-4 text-indigo-600" />}
              </div>
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed border ${
                m.role === 'user'
                  ? 'bg-blue-50 text-slate-800 border-blue-100 rounded-tr-sm'
                  : 'bg-slate-50 text-slate-800 border-slate-200 rounded-tl-sm'
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
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-indigo-100 mr-3">
                <Bot className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 rounded-tl-sm flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
      }} className="p-4 bg-white border-t border-slate-200">
        <div className="relative flex items-center">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`${destination}에 대해 질문해보세요...`}
            className="w-full bg-slate-50 text-slate-900 placeholder-slate-400 text-sm rounded-full pl-5 pr-12 py-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 border border-slate-200 transition-all"
            disabled={status === 'submitted' || status === 'streaming' || error != null}
          />
          <button
            type="submit"
            disabled={status === 'submitted' || status === 'streaming' || !input.trim() || error != null}
            className="absolute right-2 p-2 rounded-full bg-indigo-500 text-white hover:bg-indigo-400 disabled:opacity-50 disabled:hover:bg-indigo-500 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
