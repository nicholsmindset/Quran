'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare,
  CheckCircle,
  XCircle,
  BookOpen,
  ArrowRight,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { AIExplanation } from '@/types';

interface AIExplanationProps {
  questionId: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  onExplanationGenerated?: (explanation: AIExplanation) => void;
  className?: string;
}

// API function to request explanation
async function requestExplanation(data: {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
}): Promise<AIExplanation> {
  const response = await fetch('/api/ai/explain', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to generate explanation');
  }

  const result = await response.json();
  return result.data.explanation;
}

export function AIExplanation({
  questionId,
  userAnswer,
  correctAnswer,
  isCorrect,
  onExplanationGenerated,
  className = ''
}: AIExplanationProps) {
  const [explanation, setExplanation] = useState<AIExplanation | null>(null);

  const explanationMutation = useMutation({
    mutationFn: requestExplanation,
    onSuccess: (data) => {
      setExplanation(data);
      onExplanationGenerated?.(data);
    },
    onError: (error) => {
      console.error('Failed to generate explanation:', error);
    }
  });

  const handleRequestExplanation = () => {
    explanationMutation.mutate({
      questionId,
      userAnswer,
      isCorrect
    });
  };

  return (
    <Card className={`border-l-4 ${isCorrect ? 'border-green-500' : 'border-red-500'} ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {isCorrect ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600" />
          )}
          <span className={isCorrect ? 'text-green-800' : 'text-red-800'}>
            {isCorrect ? 'Correct Answer!' : 'Incorrect Answer'}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Answer Summary */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-muted-foreground">Your Answer:</span>
            <Badge variant={isCorrect ? 'default' : 'destructive'}>
              {userAnswer}
            </Badge>
          </div>
          {!isCorrect && (
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-muted-foreground">Correct Answer:</span>
              <Badge variant="outline" className="border-green-500 text-green-700">
                {correctAnswer}
              </Badge>
            </div>
          )}
        </div>

        {/* Explanation Content */}
        {explanation ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center space-x-2 mb-3">
                <MessageSquare className="h-4 w-4 text-emerald-600" />
                <span className="font-medium text-emerald-800">AI Explanation</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                {explanation.explanation}
              </p>
            </div>

            {/* Additional Context */}
            {explanation.additionalContext && (
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex items-center space-x-2 mb-2">
                  <BookOpen className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-800">Additional Context</span>
                </div>
                <p className="text-blue-700 text-sm leading-relaxed">
                  {explanation.additionalContext}
                </p>
              </div>
            )}

            {/* Related Concepts */}
            {explanation.relatedConcepts && explanation.relatedConcepts.length > 0 && (
              <div className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">Related Concepts:</span>
                <div className="flex flex-wrap gap-2">
                  {explanation.relatedConcepts.map((concept, index) => (
                    <Badge key={index} variant="secondary" className="bg-emerald-100 text-emerald-700">
                      {concept}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Further Reading */}
            {explanation.furtherReading && explanation.furtherReading.length > 0 && (
              <div className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">Further Reading:</span>
                <div className="space-y-1">
                  {explanation.furtherReading.map((reading, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <ArrowRight className="h-3 w-3 mt-1 text-emerald-600 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{reading}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Learning Note */}
            <div className="mt-4 p-3 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg border border-emerald-200">
              <p className="text-xs text-emerald-700">
                🤖 This explanation was generated by AI to help you understand the Islamic concepts and Quranic knowledge. 
                All content is reviewed for authenticity and accuracy.
              </p>
            </div>
          </motion.div>
        ) : (
          /* Request Explanation Button */
          <div className="text-center py-4">
            <Button
              onClick={handleRequestExplanation}
              disabled={explanationMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {explanationMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Explanation...
                </>
              ) : (
                <>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Get AI Explanation
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Understand why this answer is {isCorrect ? 'correct' : 'incorrect'} and learn more about the concept
            </p>

            {explanationMutation.isError && (
              <div className="mt-3 p-2 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-700">
                    Unable to generate explanation. Please try again.
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}