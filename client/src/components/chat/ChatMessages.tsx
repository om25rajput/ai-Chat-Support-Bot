import { ScrollArea } from "@/components/ui/scroll-area";
import { Message } from "@/types/chat";
import { Brain, User, Database, Zap, AlertTriangle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  const getSourceConfig = (source?: string) => {
    switch (source) {
      case 'kb':
        return { 
          bg: 'bg-green-100 dark:bg-green-900/20', 
          text: 'text-green-800 dark:text-green-400', 
          icon: Database, 
          label: 'Knowledge Base' 
        };
      case 'gemini':
        return { 
          bg: 'bg-purple-100 dark:bg-purple-900/20', 
          text: 'text-purple-800 dark:text-purple-400', 
          icon: Brain, 
          label: 'Gemini AI' 
        };
      case 'system':
        return { 
          bg: 'bg-amber-100 dark:bg-amber-900/20', 
          text: 'text-amber-800 dark:text-amber-400', 
          icon: AlertTriangle, 
          label: 'System' 
        };
      default:
        return { 
          bg: 'bg-blue-100 dark:bg-blue-900/20', 
          text: 'text-blue-800 dark:text-blue-400', 
          icon: Zap, 
          label: 'Instant' 
        };
    }
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return timestamp.toLocaleDateString();
  };

  return (
    <ScrollArea className="flex-1 p-6">
      <div className="space-y-4" data-testid="chat-messages">
        {messages.map((message) => {
          if (message.type === 'user') {
            return (
              <div key={message.id} className="flex items-start space-x-3 justify-end">
                <div className="bg-primary text-primary-foreground rounded-lg p-4 max-w-2xl" data-testid={`message-user-${message.id}`}>
                  <p className="text-sm">{message.content}</p>
                  <div className="mt-2 text-xs text-primary-foreground/80">
                    <Clock className="inline h-3 w-3 mr-1" />
                    {formatTime(message.timestamp)}
                  </div>
                </div>
                <div className="bg-muted p-2 rounded-full flex-shrink-0">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            );
          }

          const config = getSourceConfig(message.source);
          const SourceIcon = config.icon;

          return (
            <div key={message.id} className="flex items-start space-x-3">
              <div className="bg-primary p-2 rounded-full flex-shrink-0">
                <Brain className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="bg-card border border-border rounded-lg p-4 max-w-2xl" data-testid={`message-bot-${message.id}`}>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="font-medium text-sm">AI Support Agent</span>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full", config.bg, config.text)}>
                    <SourceIcon className="inline h-3 w-3 mr-1" />
                    {config.label}
                  </span>
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap">{message.content}</p>
                
                {(message.responseTime || message.similarityScore) && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center space-x-4">
                        {message.similarityScore && (
                          <span>Match: {(message.similarityScore * 100).toFixed(1)}%</span>
                        )}
                        {message.kbEntryId && (
                          <span>Source: FAQ #{message.kbEntryId.slice(-6)}</span>
                        )}
                      </div>
                      {message.responseTime && (
                        <span>Response time: {message.responseTime}ms</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="bg-primary p-2 rounded-full flex-shrink-0">
              <Brain className="h-4 w-4 text-primary-foreground animate-pulse" />
            </div>
            <div className="bg-card border border-border rounded-lg p-4 max-w-2xl">
              <div className="flex items-center space-x-2 mb-2">
                <span className="font-medium text-sm">AI Support Agent</span>
                <span className="text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 px-2 py-0.5 rounded-full">
                  <Brain className="inline h-3 w-3 mr-1 animate-pulse" />
                  Processing...
                </span>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse"></div>
                <div className="h-4 bg-muted rounded animate-pulse w-3/4"></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
