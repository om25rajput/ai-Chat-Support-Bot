import { useState, useCallback, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Message, ChatState, FAQCategory } from '@/types/chat';
import { ChatResponse } from '@shared/schema';
// Use browser-compatible UUID generation
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function useChat() {
  const queryClient = useQueryClient();
  const [state, setState] = useState<ChatState>(() => ({
    messages: [],
    isLoading: false,
    sessionId: `session_${generateUUID()}`,
    rateLimitRemaining: 25,
    isRateLimited: false
  }));

  // Initialize with welcome message
  useEffect(() => {
    setState(prev => ({
      ...prev,
      messages: [{
        id: generateUUID(),
        type: 'bot',
        content: "Welcome! I'm your AI customer support assistant. I have access to over 1,000 FAQ entries and can help you with orders, payments, returns, and more. Browse the categories on the left for instant answers, or type your question below for a personalized response.",
        timestamp: new Date(),
        source: 'system'
      }]
    }));
  }, []);

  // Send chat message
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest('POST', '/api/chat/query', {
        message,
        sessionId: state.sessionId
      });
      return await response.json() as ChatResponse;
    },
    onMutate: (message: string) => {
      // Add user message immediately
      const userMessage: Message = {
        id: generateUUID(),
        type: 'user',
        content: message,
        timestamp: new Date()
      };
      
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, userMessage],
        isLoading: true
      }));
    },
    onSuccess: (response: ChatResponse) => {
      const botMessage: Message = {
        id: generateUUID(),
        type: 'bot',
        content: response.response,
        timestamp: new Date(),
        source: response.source,
        responseTime: response.responseTime,
        similarityScore: response.similarityScore,
        kbEntryId: response.kbEntryId
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, botMessage],
        isLoading: false,
        rateLimitRemaining: response.rateLimitRemaining,
        isRateLimited: response.rateLimitRemaining <= 0
      }));
    },
    onError: (error) => {
      const errorMessage: Message = {
        id: generateUUID(),
        type: 'system',
        content: "I'm sorry, I encountered an error processing your request. Please try again or contact customer support.",
        timestamp: new Date(),
        source: 'system'
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, errorMessage],
        isLoading: false
      }));
    }
  });

  // Select FAQ
  const selectFAQMutation = useMutation({
    mutationFn: async ({ questionId, question }: { questionId: string; question: string }) => {
      // Add user message for the question
      const userMessage: Message = {
        id: generateUUID(),
        type: 'user',
        content: question,
        timestamp: new Date()
      };
      
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, userMessage],
        isLoading: true
      }));

      const response = await apiRequest('POST', '/api/faq/select', {
        questionId,
        category: '' // Not needed for selection
      });
      return await response.json() as ChatResponse;
    },
    onSuccess: (response: ChatResponse) => {
      const botMessage: Message = {
        id: generateUUID(),
        type: 'bot',
        content: response.response,
        timestamp: new Date(),
        source: response.source,
        responseTime: response.responseTime,
        kbEntryId: response.kbEntryId
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, botMessage],
        isLoading: false
      }));
    },
    onError: () => {
      setState(prev => ({
        ...prev,
        isLoading: false
      }));
    }
  });

  const sendMessage = useCallback((message: string) => {
    if (message.trim() && !state.isLoading && !state.isRateLimited) {
      sendMessageMutation.mutate(message.trim());
    }
  }, [sendMessageMutation, state.isLoading, state.isRateLimited]);

  const selectFAQ = useCallback((questionId: string, question: string) => {
    if (!state.isLoading) {
      selectFAQMutation.mutate({ questionId, question });
    }
  }, [selectFAQMutation, state.isLoading]);

  const clearChat = useCallback(() => {
    setState(prev => ({
      ...prev,
      messages: [{
        id: generateUUID(),
        type: 'bot',
        content: "Chat cleared. How can I help you today?",
        timestamp: new Date(),
        source: 'system'
      }]
    }));
  }, []);

  return {
    ...state,
    sendMessage,
    selectFAQ,
    clearChat,
    isProcessing: sendMessageMutation.isPending || selectFAQMutation.isPending
  };
}

export function useFAQCategories() {
  return useQuery({
    queryKey: ['/api/faq/categories'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useKnowledgeBaseStats() {
  return useQuery({
    queryKey: ['/api/kb/stats'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
