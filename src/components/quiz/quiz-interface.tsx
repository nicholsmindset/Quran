'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Clock, 
  BookOpen,
  Save,
  ArrowLeft,
  AlertCircle,
  Loader2,
  CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { QuizSession, Question } from '@/types';
import { toast } from '@/hooks/use-toast';

// AI Enhancement Components
import { AIQuestionContext } from './ai-question-context';
import { AIHintsSystem } from './ai-hints-system';
import { AIExplanation } from './ai-explanation';

interface QuizInterfaceProps {
  session: QuizSession;
  onComplete: (sessionId: string) => void;
  onBackToLanding: () => void;
}

// API functions
async function fetchSessionQuestions(sessionId: string): Promise<Question[]> {
  const response = await fetch(`/api/quiz/session/${sessionId}/questions`);
  if (!response.ok) {
    throw new Error('Failed to fetch questions');
  }
  const data = await response.json();
  return data.data?.questions || [];
}

async function saveAnswer(sessionId: string, questionId: string, answer: string): Promise<QuizSession> {
  const response = await fetch(`/api/quiz/session/${sessionId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      question_id: questionId, 
      answer: answer,
      move_to_next: false // Don't auto-advance for auto-save
    })
  });
  if (!response.ok) {
    throw new Error('Failed to save answer');
  }
  const data = await response.json();
  return {
    id: sessionId,
    userId: 'current-user',
    dailyQuizId: 'current-quiz',
    currentQuestionIndex: data.data?.session?.currentQuestionIndex || 0,
    answers: {},
    status: data.data?.session?.status || 'in_progress',
    startedAt: new Date(),
    lastActivityAt: new Date(data.data?.session?.lastActivityAt || Date.now()),
    timezone: 'UTC'
  };
}

export function QuizInterface({ 
  session: initialSession, 
  onComplete, 
  onBackToLanding 
}: QuizInterfaceProps) {
  const [session, setSession] = useState(initialSession);
  const [currentAnswers, setCurrentAnswers] = useState<Record<string, string>>(initialSession.answers);
  const [timeRemaining, setTimeRemaining] = useState(10 * 60); // 10 minutes
  const [lastSaved, setLastSaved] = useState<Date>(new Date());
  const [isSaving, setIsSaving] = useState(false);
  
  // AI Enhancement State
  const [showExplanation, setShowExplanation] = useState<Record<string, boolean>>({});
  const [hintsUsed, setHintsUsed] = useState<Record<string, number>>({});

  // Fetch questions for the quiz
  const { data: questions, isLoading: questionsLoading, error } = useQuery({
    queryKey: ['session-questions', session.id],
    queryFn: () => fetchSessionQuestions(session.id),
  });

  // Auto-save mutation
  const saveAnswerMutation = useMutation({
    mutationFn: ({ questionId, answer }: { questionId: string; answer: string }) => 
      saveAnswer(session.id, questionId, answer),
    onMutate: () => setIsSaving(true),
    onSuccess: (updatedSession) => {
      setSession(updatedSession);
      setLastSaved(new Date());
      setIsSaving(false);
    },
    onError: (error) => {
      setIsSaving(false);
      toast.error({
        title: 'Save Failed',
        description: 'Failed to save answer. Please try again.'
      });
      console.error('Save error:', error);
    }
  });

  // Auto-save functionality
  const debouncedSave = useCallback(
    debounce((questionId: string, answer: string) => {
      if (answer.trim()) {
        saveAnswerMutation.mutate({ questionId, answer });
      }
    }, 2000),
    [saveAnswerMutation]
  );

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          onComplete(session.id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [session.id, onComplete]);

  // Auto-save effect (every 10 seconds for any unsaved changes)
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      const currentQuestion = questions?.[session.currentQuestionIndex];
      if (currentQuestion) {
        const currentAnswer = currentAnswers[currentQuestion.id];
        const savedAnswer = session.answers[currentQuestion.id];
        
        if (currentAnswer !== savedAnswer && currentAnswer?.trim()) {
          saveAnswerMutation.mutate({ 
            questionId: currentQuestion.id, 
            answer: currentAnswer 
          });
        }
      }
    }, 10000); // Auto-save every 10 seconds

    return () => clearInterval(autoSaveInterval);
  }, [currentAnswers, session.answers, session.currentQuestionIndex, questions, saveAnswerMutation]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setCurrentAnswers(prev => ({ ...prev, [questionId]: answer }));
    debouncedSave(questionId, answer);
    
    // Hide explanation when user changes answer
    setShowExplanation(prev => ({ ...prev, [questionId]: false }));
  };
  
  const handleAnswerSubmit = (questionId: string) => {
    // Show explanation after user submits answer
    setShowExplanation(prev => ({ ...prev, [questionId]: true }));
  };
  
  const handleHintUsed = (questionId: string, level: number) => {
    setHintsUsed(prev => ({ ...prev, [questionId]: level }));
  };

  const handleNavigation = (direction: 'prev' | 'next') => {
    if (!questions) return;

    const newIndex = direction === 'next' 
      ? Math.min(session.currentQuestionIndex + 1, questions.length - 1)
      : Math.max(session.currentQuestionIndex - 1, 0);

    setSession(prev => ({ ...prev, currentQuestionIndex: newIndex }));
  };

  const handleComplete = () => {
    onComplete(session.id);
  };

  const getCurrentAnswer = (questionId: string) => {
    return currentAnswers[questionId] || session.answers[questionId] || '';
  };

  const canNavigateNext = () => {
    if (!questions) return false;
    const currentQuestion = questions[session.currentQuestionIndex];
    return getCurrentAnswer(currentQuestion.id).trim() !== '';
  };

  const getDifficultyColor = (difficulty: Question['difficulty']) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (questionsLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-emerald-600" />
            <p className="text-muted-foreground">Loading quiz questions...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !questions || questions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-600" />
            <p className="text-red-600 mb-4">Failed to load quiz questions</p>
            <Button onClick={onBackToLanding} variant="outline">
              Back to Quiz
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[session.currentQuestionIndex];
  const totalQuestions = questions.length;
  const progress = ((session.currentQuestionIndex + 1) / totalQuestions) * 100;
  const isFillInQuestion = currentQuestion.choices.length === 0;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={onBackToLanding}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
              
              <div className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-emerald-600" />
                <span className="font-medium">
                  Question {session.currentQuestionIndex + 1} of {totalQuestions}
                </span>
                <Badge 
                  variant="secondary" 
                  className={getDifficultyColor(currentQuestion.difficulty)}
                >
                  {currentQuestion.difficulty}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Auto-save indicator */}
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Saved {formatTimeAgo(lastSaved)}</span>
                  </>
                )}
              </div>
              
              {/* Timer */}
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className={timeRemaining < 60 ? 'text-red-600 font-bold' : ''}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
            </div>
          </div>
          <Progress value={progress} className="h-3" />
        </CardContent>
      </Card>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={session.currentQuestionIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="islamic-pattern border-emerald-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl leading-relaxed">
                {currentQuestion.prompt}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {isFillInQuestion ? (
                // Fill-in-the-blank question
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      placeholder="Type your answer here..."
                      value={getCurrentAnswer(currentQuestion.id)}
                      onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                      className="text-lg p-4 border-emerald-200 focus:border-emerald-500"
                      dir="auto"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && getCurrentAnswer(currentQuestion.id).trim()) {
                          handleAnswerSubmit(currentQuestion.id);
                        }
                      }}
                    />
                    {getCurrentAnswer(currentQuestion.id).trim() && (
                      <Button
                        onClick={() => handleAnswerSubmit(currentQuestion.id)}
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        Submit Answer
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your answer is automatically saved as you type.
                  </p>
                  
                  {/* AI Hints for fill-in-blank questions */}
                  <AIHintsSystem
                    questionId={currentQuestion.id}
                    isEnabled={true}
                    onHintUsed={(level) => handleHintUsed(currentQuestion.id, level)}
                  />
                </div>
              ) : (
                // Multiple choice question
                <div className="space-y-3">
                  {currentQuestion.choices.map((choice, index) => {
                    const isSelected = getCurrentAnswer(currentQuestion.id) === choice;
                    return (
                      <Button
                        key={index}
                        variant={isSelected ? 'islamic' : 'outline'}
                        className="w-full p-4 text-left justify-start h-auto text-wrap"
                        onClick={() => {
                          handleAnswerChange(currentQuestion.id, choice);
                          handleAnswerSubmit(currentQuestion.id);
                        }}
                      >
                        <span className="font-medium mr-3 text-emerald-600">
                          {String.fromCharCode(65 + index)}.
                        </span>
                        <span className="flex-1">{choice}</span>
                      </Button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
      
      {/* AI Question Context */}
      <AIQuestionContext questionId={currentQuestion.id} />
      
      {/* AI Explanation (shown after answer submission) */}
      {showExplanation[currentQuestion.id] && getCurrentAnswer(currentQuestion.id).trim() && (
        <AIExplanation
          questionId={currentQuestion.id}
          userAnswer={getCurrentAnswer(currentQuestion.id)}
          correctAnswer={currentQuestion.answer}
          isCorrect={getCurrentAnswer(currentQuestion.id) === currentQuestion.answer}
        />
      )}

      {/* Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={() => handleNavigation('prev')}
              disabled={session.currentQuestionIndex === 0}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Previous</span>
            </Button>

            <div className="text-center space-y-1">
              <p className="text-sm text-muted-foreground">
                {Object.keys(currentAnswers).length + Object.keys(session.answers).length} of {totalQuestions} answered
              </p>
              {hintsUsed[currentQuestion.id] && (
                <p className="text-xs text-blue-600">
                  Hints used: Level {hintsUsed[currentQuestion.id]}
                </p>
              )}
            </div>

            {session.currentQuestionIndex === totalQuestions - 1 ? (
              <Button
                variant="islamic"
                onClick={handleComplete}
                disabled={!canNavigateNext()}
                className="flex items-center space-x-2"
              >
                <span>Complete Quiz</span>
                <BookOpen className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="islamic"
                onClick={() => handleNavigation('next')}
                disabled={!canNavigateNext()}
                className="flex items-center space-x-2"
              >
                <span>Next</span>
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper functions
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  }) as T;
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}