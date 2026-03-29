export interface ToolCallStatus {
  name: string;
  status: 'pending' | 'success' | 'error';
  summary?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imagePreview?: string; // base64 data URL thumbnail for uploaded image
  isLoading?: boolean;
  toolCalls?: ToolCallStatus[];
  timestamp: Date;
}
