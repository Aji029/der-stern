import React, { useEffect, useRef } from 'react';
import { Bot } from 'lucide-react';
import { ToolCallFeedback } from './ToolCallFeedback';
import type { ChatMessage } from '../types';

interface Props {
  messages: ChatMessage[];
}

export function ChatMessages({ messages }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          {msg.role === 'assistant' && (
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center mr-2 mt-0.5">
              <Bot className="h-4 w-4 text-white" />
            </div>
          )}

          <div className={`max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
            {/* Image preview */}
            {msg.imagePreview && (
              <img
                src={msg.imagePreview}
                alt="Attached"
                className="rounded-xl mb-1 max-h-40 object-cover border border-gray-200"
              />
            )}

            {/* Bubble */}
            {msg.isLoading && !msg.content ? (
              <div className="rounded-2xl px-4 py-3 bg-gray-100">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" />
                </div>
              </div>
            ) : msg.content ? (
              <div
                className={`rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-brand-500 text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                }`}
              >
                {msg.content}
              </div>
            ) : null}

            {/* Tool call feedback */}
            {msg.role === 'assistant' && msg.toolCalls && msg.toolCalls.length > 0 && (
              <div className="w-full mt-1">
                <ToolCallFeedback toolCalls={msg.toolCalls} />
              </div>
            )}

            {/* Timestamp */}
            <span className="text-[10px] text-gray-400 mt-1 px-1">
              {msg.timestamp.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
