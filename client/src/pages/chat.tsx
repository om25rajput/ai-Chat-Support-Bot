import { useState, useRef, useEffect } from "react";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatMessages } from "@/components/chat/ChatMessages";
import { ChatInput } from "@/components/chat/ChatInput";
import { FAQSidebar } from "@/components/chat/FAQSidebar";
import { RAGProcessModal } from "@/components/chat/RAGProcessModal";
import { useChat } from "@/hooks/use-chat";
import { Badge } from "@/components/ui/badge";
import { Brain } from "lucide-react";

export default function ChatPage() {
  const {
    messages,
    isLoading,
    sessionId,
    rateLimitRemaining,
    isRateLimited,
    sendMessage,
    selectFAQ,
    clearChat,
    isProcessing
  } = useChat();

  const [showRAGModal, setShowRAGModal] = useState(false);
  const [ragStep, setRAGStep] = useState<'searching' | 'similarity' | 'gemini' | 'complete'>('searching');
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  // Show RAG modal when processing
  useEffect(() => {
    if (isProcessing) {
      setShowRAGModal(true);
      setRAGStep('searching');
      
      // Simulate RAG process steps
      const timer1 = setTimeout(() => setRAGStep('similarity'), 500);
      const timer2 = setTimeout(() => setRAGStep('gemini'), 1000);
      const timer3 = setTimeout(() => {
        setRAGStep('complete');
        setTimeout(() => setShowRAGModal(false), 500);
      }, 2000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [isProcessing]);

  const handleStartDirectChat = () => {
    chatInputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4 sticky top-0 z-50">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="bg-primary text-primary-foreground p-2 rounded-lg">
              <Brain className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground" data-testid="app-title">
                AI Customer Support
              </h1>
              <p className="text-sm text-muted-foreground">
                Powered by Gemini API & RAG System
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Online
            </Badge>
            <div className="text-sm text-muted-foreground" data-testid="header-rate-limit">
              <span className="font-medium">{rateLimitRemaining}</span>/25 queries today
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <FAQSidebar 
          onSelectFAQ={selectFAQ}
          onStartDirectChat={handleStartDirectChat}
        />

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col bg-background">
          <ChatHeader 
            onClearChat={clearChat}
            rateLimitRemaining={rateLimitRemaining}
          />
          <ChatMessages 
            messages={messages}
            isLoading={isLoading}
          />
          <ChatInput 
            onSendMessage={sendMessage}
            isLoading={isLoading}
            isRateLimited={isRateLimited}
          />
        </main>
      </div>

      {/* RAG Process Modal */}
      <RAGProcessModal 
        isOpen={showRAGModal}
        onClose={() => setShowRAGModal(false)}
        currentStep={ragStep}
        vectorsSearched={1247}
        bestScore={0.89}
      />
    </div>
  );
}
