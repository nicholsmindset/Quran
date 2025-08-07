'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  RotateCcw,
  BookOpen,
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Question, Attempt } from '@/types';

interface QuizInterfaceProps {
  questions: Question[];
  onComplete: (results: Attempt[]) => void;
  timeLimit?: number; // in minutes
}

export function QuizInterface({ questions, onComplete, timeLimit = 10 }: QuizInterfaceProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [fillInAnswers, setFillInAnswers] = useState<Record<number, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(timeLimit * 60); // convert to seconds
  const [isCompleted, setIsCompleted] = useState(false);
  const [results, setResults] = useState<Attempt[]>([]);

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  // Timer effect
  useEffect(() => {
    if (timeRemaining > 0 && !isCompleted) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeRemaining, isCompleted]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswers({ ...selectedAnswers, [currentQuestionIndex]: answer });
  };

  const handleFillInAnswer = (answer: string) => {
    setFillInAnswers({ ...fillInAnswers, [currentQuestionIndex]: answer });
  };

  const getCurrentAnswer = () => {
    return selectedAnswers[currentQuestionIndex] || fillInAnswers[currentQuestionIndex] || '';
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleComplete = () => {
    const attempts: Attempt[] = questions.map((question, index) => {
      const userAnswer = selectedAnswers[index] || fillInAnswers[index] || '';
      const isCorrect = userAnswer.toLowerCase().trim() === question.answer.toLowerCase().trim();
      
      return {
        id: `attempt-${index}`,
        userId: 'current-user', // This should come from auth context
        questionId: question.id,
        correct: isCorrect,
        answeredAt: new Date(),
      };
    });

    setResults(attempts);
    setIsCompleted(true);
    onComplete(attempts);
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setFillInAnswers({});
    setTimeRemaining(timeLimit * 60);
    setIsCompleted(false);
    setResults([]);
  };

  const getScore = () => {
    const correct = results.filter(r => r.correct).length;
    return Math.round((correct / totalQuestions) * 100);
  };

  const getDifficultyColor = (difficulty: Question['difficulty']) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isCompleted) {
    const score = getScore();
    const correctAnswers = results.filter(r => r.correct).length;

    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-emerald-800">
            Quiz Complete!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Score Display */}
          <div className="text-center space-y-4">
            <div className="text-6xl font-bold text-emerald-600">
              {score}%
            </div>
            <p className="text-lg text-muted-foreground">
              You got {correctAnswers} out of {totalQuestions} questions correct
            </p>
            
            <div className="flex justify-center">
              <Badge 
                variant={score >= 80 ? 'success' : score >= 60 ? 'warning' : 'destructive'}
                className="text-lg px-4 py-2"
              >
                {score >= 80 ? (
                  <>
                    <Star className="h-4 w-4 mr-1" />
                    Excellent!
                  </>
                ) : score >= 60 ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Good Job!
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-1" />
                    Keep Practicing
                  </>
                )}
              </Badge>
            </div>
          </div>

          {/* Results Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-center p-4 bg-emerald-50 rounded-lg">
              <CheckCircle className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-emerald-600">{correctAnswers}</p>
              <p className="text-sm text-emerald-700">Correct Answers</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-red-600">{totalQuestions - correctAnswers}</p>
              <p className="text-sm text-red-700">Incorrect Answers</p>
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            <Button onClick={handleRestart} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Take Again
            </Button>
            <Button onClick={() => window.location.href = '/dashboard'} variant="islamic">
              <BookOpen className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentQuestion) {
    return <div>No questions available</div>;
  }

  const isFillInQuestion = currentQuestion.choices.length === 0;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-emerald-600" />
              <span className="font-medium">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </span>
              <Badge 
                variant="secondary" 
                className={getDifficultyColor(currentQuestion.difficulty)}
              >
                {currentQuestion.difficulty}
              </Badge>
            </div>
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className={timeRemaining < 60 ? 'text-red-600 font-bold' : ''}>
                {formatTime(timeRemaining)}
              </span>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="islamic-pattern">
            <CardHeader>
              <CardTitle className="text-lg">{currentQuestion.prompt}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isFillInQuestion ? (
                // Fill-in-the-blank question
                <div className="space-y-2">
                  <Input
                    placeholder="Type your answer here..."
                    value={fillInAnswers[currentQuestionIndex] || ''}
                    onChange={(e) => handleFillInAnswer(e.target.value)}
                    className="text-lg p-4"
                  />
                </div>
              ) : (
                // Multiple choice question
                <div className="space-y-2">
                  {currentQuestion.choices.map((choice, index) => {
                    const isSelected = selectedAnswers[currentQuestionIndex] === choice;
                    return (
                      <Button
                        key={index}
                        variant={isSelected ? 'islamic' : 'outline'}
                        className="w-full p-4 text-left justify-start h-auto"
                        onClick={() => handleAnswerSelect(choice)}
                      >
                        <span className="font-medium mr-2">
                          {String.fromCharCode(65 + index)}.
                        </span>
                        {choice}
                      </Button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </Button>
            <Button
              variant="islamic"
              onClick={handleNext}
              disabled={!getCurrentAnswer()}
            >
              {currentQuestionIndex === totalQuestions - 1 ? 'Complete' : 'Next'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}