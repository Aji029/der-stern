import React from 'react';
import { Bot } from 'lucide-react';

interface Props {
  onClick: () => void;
  isLoading?: boolean;
}

export function AIAssistantButton({ onClick, isLoading }: Props) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-40 w-14 h-14 rounded-full bg-brand-500 hover:bg-brand-600 active:scale-95 shadow-lg flex items-center justify-center transition-all duration-200"
      aria-label="Open AI Assistant"
      title="AI Assistant"
    >
      <Bot className="h-7 w-7 text-white" />
      {isLoading && (
        <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
      )}
    </button>
  );
}
