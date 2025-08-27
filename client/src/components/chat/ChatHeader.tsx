import { Button } from "@/components/ui/button";
import { Trash2, Brain, Database } from "lucide-react";

interface ChatHeaderProps {
  onClearChat: () => void;
  rateLimitRemaining: number;
}

export function ChatHeader({ onClearChat, rateLimitRemaining }: ChatHeaderProps) {
  return (
    <div className="bg-card border-b border-border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-primary/10 p-2 rounded-full">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold" data-testid="chat-title">AI Customer Support Agent</h2>
            <p className="text-sm text-muted-foreground">
              <span className="inline-flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Online • Powered by Gemini API
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
            RAG + AI Hybrid
          </span>
          <span className="text-sm text-muted-foreground" data-testid="rate-limit-counter">
            {rateLimitRemaining}/25 queries today
          </span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClearChat}
            data-testid="button-clear-chat"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
