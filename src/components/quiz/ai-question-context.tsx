'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  BookOpen, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Globe,
  MessageCircle,
  Lightbulb,
  Loader2
} from 'lucide-react';
import type { QuestionContext } from '@/types';

interface AIQuestionContextProps {
  questionId: string;
  className?: string;
}

// API function to fetch question context
async function fetchQuestionContext(questionId: string): Promise<QuestionContext> {
  const response = await fetch(`/api/ai/question/${questionId}/context`);
  if (!response.ok) {
    throw new Error('Failed to fetch question context');
  }
  const data = await response.json();
  return data.data.context;
}

export function AIQuestionContext({ questionId, className = '' }: AIQuestionContextProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: context, isLoading, error } = useQuery({
    queryKey: ['question-context', questionId],
    queryFn: () => fetchQuestionContext(questionId),
    enabled: isExpanded, // Only fetch when expanded
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (error) {
    return (
      <Card className={`border-amber-200 bg-amber-50 ${className}`}>
        <CardContent className="p-4">
          <p className="text-amber-700 text-sm">
            Unable to load additional context. The question can still be answered without this information.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-emerald-200 ${className}`}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-emerald-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-emerald-600" />
                <CardTitle className="text-lg">Question Context & Background</CardTitle>
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                  AI Enhanced
                </Badge>
              </div>
              <Button variant="ghost" size="sm">
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                <span className="ml-2 text-muted-foreground">Loading contextual information...</span>
              </div>
            ) : context ? (
              <div className="space-y-6">
                {/* Historical Background */}
                {context.historicalBackground && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-emerald-600" />
                      <h4 className="font-semibold text-emerald-800">Historical Background</h4>
                    </div>
                    <p className="text-muted-foreground leading-relaxed pl-6">
                      {context.historicalBackground}
                    </p>
                  </div>
                )}

                {/* Thematic Connections */}
                {context.thematicConnections && context.thematicConnections.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4 text-emerald-600" />
                      <h4 className="font-semibold text-emerald-800">Thematic Connections</h4>
                    </div>
                    <div className="pl-6 space-y-2">
                      {context.thematicConnections.map((connection, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-400 mt-2 flex-shrink-0" />
                          <p className="text-muted-foreground">{connection}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tafsir References */}
                {context.tafsirReferences && context.tafsirReferences.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <MessageCircle className="h-4 w-4 text-emerald-600" />
                      <h4 className="font-semibold text-emerald-800">Scholarly Interpretations</h4>
                    </div>
                    <div className="pl-6 space-y-3">
                      {context.tafsirReferences.map((tafsir, index) => (
                        <div key={index} className="border-l-2 border-emerald-200 pl-4">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-emerald-700">{tafsir.scholar}</span>
                            <Badge variant="outline" className="text-xs">
                              {tafsir.source}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground text-sm leading-relaxed">
                            {tafsir.explanation}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Learning Objectives */}
                {context.difficultyFactors && context.difficultyFactors.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Lightbulb className="h-4 w-4 text-emerald-600" />
                      <h4 className="font-semibold text-emerald-800">Learning Objectives</h4>
                    </div>
                    <div className="pl-6">
                      <p className="text-sm text-muted-foreground mb-2">
                        This question helps you understand:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {context.difficultyFactors.map((factor, index) => (
                          <Badge 
                            key={index} 
                            variant="secondary" 
                            className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          >
                            {factor}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-6 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <p className="text-xs text-emerald-700">
                    💡 This contextual information is provided by our AI system to enhance your learning experience. 
                    All content is reviewed for Islamic authenticity and accuracy.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground">No additional context available for this question.</p>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}