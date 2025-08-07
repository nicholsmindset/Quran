'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  HelpCircle, 
  Lightbulb,
  Eye,
  EyeOff,
  AlertTriangle,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AIHint } from '@/types';

interface AIHintsSystemProps {
  questionId: string;
  isEnabled: boolean; // Only show for fill-in-blank questions
  onHintUsed: (level: number) => void;
  className?: string;
}

// API function to fetch hints
async function fetchHints(questionId: string, level: number): Promise<{
  hints: AIHint[];
  nextHintAvailable: boolean;
}> {
  const response = await fetch(`/api/ai/hints/${questionId}?level=${level}`);
  if (!response.ok) {
    throw new Error('Failed to fetch hints');
  }
  const data = await response.json();
  return data.data;
}

export function AIHintsSystem({ 
  questionId, 
  isEnabled, 
  onHintUsed, 
  className = '' 
}: AIHintsSystemProps) {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [showHints, setShowHints] = useState(false);

  const { data: hintData, isLoading, error } = useQuery({
    queryKey: ['hints', questionId, currentLevel],
    queryFn: () => fetchHints(questionId, currentLevel),
    enabled: isEnabled && currentLevel > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  if (!isEnabled) {
    return null;
  }

  const handleRequestHint = (level: number) => {
    setCurrentLevel(level);
    setShowHints(true);
    onHintUsed(level);
  };

  const getHintTypeIcon = (type: string) => {
    switch (type) {
      case 'vocabulary':
        return '📝';
      case 'context':
        return '🌍';
      case 'grammar':
        return '📚';
      case 'theme':
        return '💭';
      default:
        return '💡';
    }
  };

  const getHintTypeLabel = (type: string) => {
    switch (type) {
      case 'vocabulary':
        return 'Vocabulary Hint';
      case 'context':
        return 'Context Hint';
      case 'grammar':
        return 'Grammar Hint';
      case 'theme':
        return 'Theme Hint';
      default:
        return 'Hint';
    }
  };

  return (
    <Card className={`border-blue-200 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-blue-800">
          <HelpCircle className="h-5 w-5" />
          <span>Need Help?</span>
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
            AI Assistant
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Hint Request Buttons */}
        {!showHints ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Get progressive hints to help you find the answer:
            </p>
            <div className="flex flex-col space-y-2">
              <Button
                variant="outline"
                onClick={() => handleRequestHint(1)}
                className="justify-start text-left"
                disabled={isLoading}
              >
                <Lightbulb className="h-4 w-4 mr-2" />
                Level 1 Hint - Gentle guidance
              </Button>
              <Button
                variant="outline"
                onClick={() => handleRequestHint(2)}
                className="justify-start text-left"
                disabled={isLoading}
              >
                <Lightbulb className="h-4 w-4 mr-2" />
                Level 2 Hint - More specific help
              </Button>
              <Button
                variant="outline"
                onClick={() => handleRequestHint(3)}
                className="justify-start text-left border-amber-200 hover:bg-amber-50"
                disabled={isLoading}
              >
                <Eye className="h-4 w-4 mr-2" />
                Level 3 Hint - Strong hint (reveals more)
              </Button>
            </div>
          </div>
        ) : (
          /* Display Hints */
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <span className="ml-2 text-muted-foreground">Loading hints...</span>
              </div>
            ) : error ? (
              <Alert className="border-red-200">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Unable to load hints at this time. Please try again later.
                </AlertDescription>
              </Alert>
            ) : hintData && hintData.hints.length > 0 ? (
              <div className="space-y-3">
                <AnimatePresence>
                  {hintData.hints.map((hint, index) => (
                    <motion.div
                      key={hint.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className={`p-4 rounded-lg border-2 ${
                        hint.isRevealing 
                          ? 'border-amber-200 bg-amber-50' 
                          : 'border-blue-200 bg-blue-50'
                      }`}>
                        <div className="flex items-start space-x-3">
                          <div className="text-2xl">
                            {getHintTypeIcon(hint.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge 
                                variant="outline" 
                                className={hint.isRevealing ? 'border-amber-500 text-amber-700' : 'border-blue-500 text-blue-700'}
                              >
                                Level {hint.level}
                              </Badge>
                              <span className="text-sm font-medium">
                                {getHintTypeLabel(hint.type)}
                              </span>
                              {hint.isRevealing && (
                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                              )}
                            </div>
                            <p className="text-sm leading-relaxed">
                              {hint.content}
                            </p>
                            {hint.isRevealing && (
                              <p className="text-xs text-amber-700 mt-2">
                                ⚠️ This hint reveals significant information about the answer
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Next Level Hint Button */}
                {hintData.nextHintAvailable && currentLevel < 3 && (
                  <Button
                    variant="outline"
                    onClick={() => handleRequestHint(currentLevel + 1)}
                    className="w-full mt-4"
                  >
                    <ChevronRight className="h-4 w-4 mr-2" />
                    Get Level {currentLevel + 1} Hint
                  </Button>
                )}

                {/* Hide Hints Button */}
                <Button
                  variant="ghost"
                  onClick={() => setShowHints(false)}
                  className="w-full text-muted-foreground"
                  size="sm"
                >
                  <EyeOff className="h-4 w-4 mr-2" />
                  Hide Hints
                </Button>
              </div>
            ) : (
              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertDescription>
                  No hints are available for this question at the moment.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Usage Note */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-600">
            💡 Hints are AI-generated to help you learn. Use them wisely to enhance your understanding 
            of Quranic knowledge rather than just finding the answer.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}