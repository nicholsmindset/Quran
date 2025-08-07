'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Target,
  Clock,
  TrendingUp,
  Brain,
  BookOpen,
  RefreshCw,
  Loader2,
  ChevronRight,
  Star,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PersonalizedRecommendation } from '@/types';

interface PersonalizedRecommendationsProps {
  className?: string;
}

// API functions
async function fetchRecommendations(): Promise<PersonalizedRecommendation[]> {
  const response = await fetch('/api/ai/recommendations');
  if (!response.ok) {
    throw new Error('Failed to fetch recommendations');
  }
  const data = await response.json();
  return data.data.recommendations;
}

async function generateNewRecommendations(): Promise<PersonalizedRecommendation[]> {
  const response = await fetch('/api/ai/recommendations', {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('Failed to generate recommendations');
  }
  const data = await response.json();
  return data.data.recommendations;
}

export function PersonalizedRecommendations({ className = '' }: PersonalizedRecommendationsProps) {
  const [expandedRecommendation, setExpandedRecommendation] = useState<string | null>(null);

  // Fetch existing recommendations
  const { 
    data: recommendations, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['personalized-recommendations'],
    queryFn: fetchRecommendations,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  // Generate new recommendations
  const generateMutation = useMutation({
    mutationFn: generateNewRecommendations,
    onSuccess: () => {
      refetch();
    }
  });

  const handleGenerateRecommendations = () => {
    generateMutation.mutate();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'study_plan':
        return <BookOpen className="h-5 w-5 text-emerald-600" />;
      case 'topic_focus':
        return <Target className="h-5 w-5 text-blue-600" />;
      case 'difficulty_adjustment':
        return <TrendingUp className="h-5 w-5 text-purple-600" />;
      case 'review_schedule':
        return <Calendar className="h-5 w-5 text-orange-600" />;
      default:
        return <Star className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'study_plan':
        return 'Study Plan';
      case 'topic_focus':
        return 'Topic Focus';
      case 'difficulty_adjustment':
        return 'Difficulty Adjustment';
      case 'review_schedule':
        return 'Review Schedule';
      default:
        return 'Recommendation';
    }
  };

  if (error) {
    return (
      <Card className={`border-amber-200 ${className}`}>
        <CardContent className="p-6 text-center">
          <Brain className="h-8 w-8 mx-auto mb-3 text-amber-600" />
          <p className="text-amber-700 mb-4">Unable to load your personalized recommendations</p>
          <Button 
            onClick={() => refetch()} 
            variant="outline" 
            size="sm"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-6 w-6 text-emerald-600" />
            <span>Personalized Learning Recommendations</span>
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
              AI Powered
            </Badge>
          </CardTitle>
          <Button
            onClick={handleGenerateRecommendations}
            disabled={generateMutation.isPending || isLoading}
            variant="outline"
            size="sm"
          >
            {generateMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
              <span className="ml-2 text-muted-foreground">Analyzing your learning pattern...</span>
            </div>
          </div>
        ) : recommendations && recommendations.length > 0 ? (
          <div className="space-y-4">
            <AnimatePresence>
              {recommendations.map((recommendation, index) => (
                <motion.div
                  key={recommendation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="border border-slate-200 hover:shadow-md transition-shadow">
                    <CardHeader 
                      className="cursor-pointer"
                      onClick={() => setExpandedRecommendation(
                        expandedRecommendation === recommendation.id ? null : recommendation.id
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          {getTypeIcon(recommendation.type)}
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-semibold text-lg">{recommendation.title}</h4>
                              <Badge 
                                variant="outline" 
                                className={getPriorityColor(recommendation.priority)}
                              >
                                {recommendation.priority} priority
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <span className="flex items-center space-x-1">
                                <span>{getTypeLabel(recommendation.type)}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>{recommendation.estimatedTime} min</span>
                              </span>
                            </div>
                          </div>
                        </div>
                        <ChevronRight 
                          className={`h-5 w-5 text-muted-foreground transition-transform ${
                            expandedRecommendation === recommendation.id ? 'rotate-90' : ''
                          }`} 
                        />
                      </div>
                    </CardHeader>
                    
                    <AnimatePresence>
                      {expandedRecommendation === recommendation.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <CardContent className="pt-0">
                            <div className="space-y-4">
                              <p className="text-muted-foreground leading-relaxed">
                                {recommendation.description}
                              </p>
                              
                              {recommendation.actionItems.length > 0 && (
                                <div className="space-y-2">
                                  <h5 className="font-medium text-sm">Action Steps:</h5>
                                  <div className="space-y-2">
                                    {recommendation.actionItems.map((item, itemIndex) => (
                                      <div key={itemIndex} className="flex items-start space-x-2">
                                        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center mt-0.5">
                                          <span className="text-xs font-medium text-emerald-700">
                                            {itemIndex + 1}
                                          </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground flex-1">
                                          {item}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                  <span>Estimated time:</span>
                                  <Progress value={Math.min((recommendation.estimatedTime / 60) * 100, 100)} className="w-20 h-2" />
                                  <span>{recommendation.estimatedTime}min</span>
                                </div>
                                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                                  Start Learning
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {generateMutation.isPending && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-4"
              >
                <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-emerald-600" />
                <p className="text-sm text-muted-foreground">Generating new recommendations based on your recent performance...</p>
              </motion.div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Brain className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h4 className="font-medium mb-2">No Recommendations Yet</h4>
            <p className="text-muted-foreground mb-4">
              Complete more quizzes to receive personalized learning recommendations
            </p>
            <Button 
              onClick={handleGenerateRecommendations}
              disabled={generateMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Generate Recommendations
                </>
              )}
            </Button>
          </div>
        )}
        
        {recommendations && recommendations.length > 0 && (
          <div className="mt-6 p-4 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg border border-emerald-200">
            <p className="text-xs text-emerald-700">
              🧠 These recommendations are generated by analyzing your learning patterns, strengths, and areas for improvement. 
              They adapt as you continue your Quranic studies.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}