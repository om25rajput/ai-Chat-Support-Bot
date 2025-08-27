import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronRight, MessageCircle, Database, Activity, Clock } from "lucide-react";
import { FAQCategory, KnowledgeBaseStats } from "@/types/chat";
import { useFAQCategories, useKnowledgeBaseStats } from "@/hooks/use-chat";
import { cn } from "@/lib/utils";

interface FAQSidebarProps {
  onSelectFAQ: (questionId: string, question: string) => void;
  onStartDirectChat: () => void;
}

export function FAQSidebar({ onSelectFAQ, onStartDirectChat }: FAQSidebarProps) {
  const [openCategories, setOpenCategories] = useState<string[]>(['Orders']);
  const { data: categories, isLoading: categoriesLoading } = useFAQCategories();
  const { data: stats, isLoading: statsLoading } = useKnowledgeBaseStats();

  const toggleCategory = (categoryName: string) => {
    setOpenCategories(prev => 
      prev.includes(categoryName)
        ? prev.filter(name => name !== categoryName)
        : [...prev, categoryName]
    );
  };

  const getCategoryIcon = (iconClass: string) => {
    // Map Font Awesome classes to Lucide icons
    const iconMap: Record<string, any> = {
      'fas fa-shopping-cart': '🛒',
      'fas fa-credit-card': '💳',
      'fas fa-undo': '↩️',
      'fas fa-times-circle': '❌',
      'fas fa-crown': '👑',
      'fas fa-truck': '🚚',
      'fas fa-shield-alt': '🛡️',
      'fas fa-gift': '🎁',
      'fas fa-user-shield': '🔐',
      'fas fa-globe': '🌍'
    };
    
    return iconMap[iconClass] || '📋';
  };

  return (
    <aside className="w-80 bg-card border-r border-border">
      <ScrollArea className="h-[calc(100vh-80px)]">
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2" data-testid="sidebar-title">Quick Help</h2>
            <p className="text-sm text-muted-foreground">
              Browse frequently asked questions or start a conversation below.
            </p>
          </div>

          {/* FAQ Categories */}
          <div className="space-y-3" data-testid="faq-categories">
            {categoriesLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))
            ) : (
              categories?.map((category) => {
                const isOpen = openCategories.includes(category.name);
                return (
                  <Collapsible 
                    key={category.name} 
                    open={isOpen}
                    onOpenChange={() => toggleCategory(category.name)}
                  >
                    <Card className="border border-border">
                      <CollapsibleTrigger asChild>
                        <Button 
                          variant="ghost" 
                          className="w-full p-4 justify-between hover:bg-secondary"
                          data-testid={`button-category-${category.name.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-lg">{getCategoryIcon(category.icon)}</span>
                            <span className="font-medium">{category.name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary" className="text-xs">
                              {category.count}
                            </Badge>
                            {isOpen ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </div>
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="px-4 pb-4 space-y-2">
                          {category.questions.map((question) => (
                            <Button
                              key={question.id}
                              variant="ghost"
                              className="w-full text-left p-2 text-sm h-auto justify-start"
                              onClick={() => onSelectFAQ(question.id, question.question)}
                              data-testid={`button-faq-${question.id}`}
                            >
                              {question.question}
                            </Button>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                );
              })
            )}

            {/* Direct Chat Option */}
            <Card className="border-2 border-dashed border-primary/30">
              <CardContent className="p-0">
                <Button 
                  variant="ghost" 
                  className="w-full p-4 justify-start hover:bg-primary/5"
                  onClick={onStartDirectChat}
                  data-testid="button-start-direct-chat"
                >
                  <div className="flex items-center space-x-3">
                    <MessageCircle className="h-5 w-5 text-primary" />
                    <div className="text-left">
                      <div className="font-medium text-primary">Ask Something Else</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Start a conversation with our AI assistant
                      </p>
                    </div>
                  </div>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Knowledge Base Stats */}
          <Card className="mt-6 bg-secondary">
            <CardContent className="p-4">
              <h3 className="font-medium text-sm mb-2 flex items-center">
                <Database className="h-4 w-4 mr-2" />
                Knowledge Base
              </h3>
              {statsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : (
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex justify-between" data-testid="stat-total-entries">
                    <span>Total FAQs:</span>
                    <span className="font-medium">{stats?.totalEntries}</span>
                  </div>
                  <div className="flex justify-between" data-testid="stat-last-update">
                    <span>Last Updated:</span>
                    <span>{stats?.lastUpdate}</span>
                  </div>
                  <div className="flex justify-between" data-testid="stat-accuracy">
                    <span>RAG Accuracy:</span>
                    <span className="text-green-600 font-medium">{stats?.accuracy}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </aside>
  );
}
