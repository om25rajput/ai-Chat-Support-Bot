import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Brain, Database, Zap, Check, Clock } from "lucide-react";

interface RAGProcessModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStep: 'searching' | 'similarity' | 'gemini' | 'complete';
  vectorsSearched?: number;
  bestScore?: number;
}

export function RAGProcessModal({ 
  isOpen, 
  onClose, 
  currentStep, 
  vectorsSearched = 1000, 
  bestScore = 0.89 
}: RAGProcessModalProps) {
  const steps = [
    { 
      key: 'searching', 
      label: 'Searching Knowledge Base...', 
      icon: Database,
      complete: ['similarity', 'gemini', 'complete'].includes(currentStep)
    },
    { 
      key: 'similarity', 
      label: 'Calculating Similarity...', 
      icon: Zap,
      complete: ['gemini', 'complete'].includes(currentStep),
      active: currentStep === 'similarity'
    },
    { 
      key: 'gemini', 
      label: 'Consulting Gemini AI...', 
      icon: Brain,
      complete: currentStep === 'complete',
      active: currentStep === 'gemini'
    }
  ];

  const getProgress = () => {
    switch (currentStep) {
      case 'searching': return 25;
      case 'similarity': return 50;
      case 'gemini': return 75;
      case 'complete': return 100;
      default: return 0;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md" data-testid="rag-process-modal">
        <div className="text-center">
          <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="text-primary text-2xl h-8 w-8 animate-pulse" />
          </div>
          
          <h3 className="font-semibold text-lg mb-4" data-testid="modal-title">
            Processing Your Query
          </h3>
          
          <Progress value={getProgress()} className="mb-4" />
          
          <div className="space-y-3 text-sm mb-4">
            {steps.map((step) => {
              const StepIcon = step.icon;
              return (
                <div key={step.key} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <StepIcon className="h-4 w-4" />
                    <span>{step.label}</span>
                  </div>
                  {step.complete ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : step.active ? (
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                  ) : (
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="bg-secondary rounded-lg p-3">
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between" data-testid="vectors-searched">
                <span>Vectors Searched:</span>
                <span>{vectorsSearched.toLocaleString()}</span>
              </div>
              <div className="flex justify-between" data-testid="best-match-score">
                <span>Best Match Score:</span>
                <Badge variant="outline" className="text-xs">
                  {(bestScore * 100).toFixed(1)}%
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
