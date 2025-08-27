export interface Message {
  id: string;
  type: 'user' | 'bot' | 'system';
  content: string;
  timestamp: Date;
  source?: 'kb' | 'gemini' | 'instant' | 'system';
  responseTime?: number;
  similarityScore?: number;
  kbEntryId?: string;
}

export interface FAQCategory {
  name: string;
  icon: string;
  count: number;
  questions: Array<{
    id: string;
    question: string;
    answer: string;
  }>;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  sessionId: string;
  rateLimitRemaining: number;
  isRateLimited: boolean;
}

export interface KnowledgeBaseStats {
  totalEntries: number;
  lastUpdate: string;
  accuracy: string;
  avgUsage: number;
  categoriesCount: number;
}
