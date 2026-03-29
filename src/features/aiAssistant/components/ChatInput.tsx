import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Send, Paperclip, Mic, MicOff, X } from 'lucide-react';
import { useVoiceInput } from '../hooks/useVoiceInput';

interface Props {
  onSend: (text: string, imageFile?: File) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: Props) {
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice transcript fills the input
  const { isRecording, isSupported, toggleRecording } = useVoiceInput(
    useCallback((transcript: string) => {
      setText((prev) => (prev ? prev + ' ' + transcript : transcript));
      textareaRef.current?.focus();
    }, []),
  );

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  }, [text]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed && !imageFile) return;
    onSend(trimmed, imageFile ?? undefined);
    setText('');
    setImageFile(null);
    setImagePreview(null);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    e.target.value = ''; // reset so same file can be re-attached
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const canSend = !disabled && (text.trim().length > 0 || !!imageFile);

  return (
    <div className="border-t border-gray-200 px-4 pt-3 pb-4">
      {/* Image preview */}
      {imagePreview && (
        <div className="relative inline-block mb-2">
          <img
            src={imagePreview}
            alt="Attachment preview"
            className="h-16 w-16 rounded-xl object-cover border border-gray-200"
          />
          <button
            onClick={removeImage}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-700 rounded-full flex items-center justify-center"
          >
            <X className="h-3 w-3 text-white" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Paperclip — image upload */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-40"
          title="Attach image"
        >
          <Paperclip className="h-5 w-5" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Ask me anything or describe an order…"
          rows={1}
          className="flex-1 resize-none rounded-2xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-40 leading-relaxed"
          style={{ maxHeight: '120px', overflowY: 'auto' }}
        />

        {/* Mic button */}
        {isSupported && (
          <button
            onClick={toggleRecording}
            disabled={disabled}
            className={`flex-shrink-0 p-2 rounded-lg transition-colors disabled:opacity-40 ${
              isRecording
                ? 'text-white bg-red-500 hover:bg-red-600 animate-pulse'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
            title={isRecording ? 'Stop recording' : 'Voice input'}
          >
            {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
        )}

        {/* Send */}
        <button
          onClick={handleSend}
          disabled={!canSend}
          className="flex-shrink-0 p-2 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="Send"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>

      {isRecording && (
        <p className="mt-2 text-xs text-center text-red-500 font-medium animate-pulse">
          🎙 Listening… tap mic to stop
        </p>
      )}
    </div>
  );
}
