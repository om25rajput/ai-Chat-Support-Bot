import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Database, Brain, Paperclip } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  isRateLimited: boolean;
}

export function ChatInput({ onSendMessage, isLoading, isRateLimited }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (message.trim() && !isLoading && !isRateLimited) {
      onSendMessage(message);
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }, [message]);

  return (
    <div className="border-t border-border p-4 bg-card">
      <div className="flex items-end space-x-3">
        <div className="flex-1">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isRateLimited 
                  ? "Daily limit reached. Try again tomorrow."
                  : "Type your question here... (e.g., 'How do I return an item?')"
              }
              className="resize-none pr-12 min-h-[60px]"
              disabled={isLoading || isRateLimited}
              data-testid="input-chat-message"
            />
            <Button 
              variant="ghost" 
              size="sm" 
              className="absolute bottom-3 right-3"
              disabled={isLoading || isRateLimited}
              data-testid="button-attach-file"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <Database className="h-3 w-3 mr-1" />
                RAG Search Enabled
              </span>
              <span className="flex items-center">
                <Brain className="h-3 w-3 mr-1" />
                Gemini Fallback Active
              </span>
            </div>
            <span data-testid="text-char-count">
              {message.length}/500 characters
            </span>
          </div>
        </div>
        <Button 
          onClick={handleSubmit}
          disabled={!message.trim() || isLoading || isRateLimited}
          className="px-6 py-3"
          data-testid="button-send-message"
        >
          <Send className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Send</span>
        </Button>
      </div>

      {isRateLimited && (
        <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-sm text-amber-700 dark:text-amber-400">
            You've reached your daily query limit. Please try again tomorrow or contact customer care directly.
          </p>
        </div>
      )}
    </div>
  );
}
