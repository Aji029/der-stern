import React from 'react';
import { X, Bot, RotateCcw } from 'lucide-react';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import type { ChatMessage } from '../types';

interface Props {
  messages: ChatMessage[];
  isLoading: boolean;
  onSend: (text: string, imageFile?: File) => void;
  onReset: () => void;
  onClose: () => void;
}

export function AIAssistantPanel({ messages, isLoading, onSend, onReset, onClose }: Props) {
  return (
    <>
      {/* Backdrop — mobile only */}
      <div
        className="fixed inset-0 bg-black/40 z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed z-50 flex flex-col bg-white
          bottom-0 left-0 right-0 rounded-t-2xl max-h-[92vh]
          lg:right-0 lg:top-0 lg:bottom-0 lg:left-auto lg:w-[420px] lg:rounded-none lg:rounded-l-2xl lg:max-h-full
          shadow-2xl"
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">AI Assistant</h2>
              <p className="text-[10px] text-gray-400">Powered by Gemini 2.5 Flash</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onReset}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              title="New chat"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <ChatMessages messages={messages} />

        {/* Input */}
        <ChatInput onSend={onSend} disabled={isLoading} />
      </div>
    </>
  );
}
