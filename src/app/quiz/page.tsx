'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Navbar } from '@/components/layout/navbar';
import { QuizInterface } from '@/components/quiz/quiz-interface';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, BookOpen, Settings, RefreshCw } from 'lucide-react';
import type { Question, Attempt } from '@/types';

// Mock questions data - in production, this would come from your API
const mockQuestions: Question[] = [
  {
    id: '1',
    verseId: 'verse-1',
    prompt: 'Complete the verse: "In the name of Allah, the Most Gracious, ..."',
    choices: [
      'the Most Merciful',
      'the Most Powerful',
      'the Most Wise',
      'the Most High'
    ],
    answer: 'the Most Merciful',
    difficulty: 'easy',
    approvedAt: new Date(),
  },
  {
    id: '2',
    verseId: 'verse-2',
    prompt: 'What is the Arabic word for "prayer"?',
    choices: [
      'Salah',
      'Zakat',
      'Hajj',
      'Sawm'
    ],
    answer: 'Salah',
    difficulty: 'medium',
    approvedAt: new Date(),
  },
  {
    id: '3',
    verseId: 'verse-3',
    prompt: 'Fill in the blank: "And whoever relies upon Allah - then He is _______ for him."',
    choices: [],
    answer: 'sufficient',
    difficulty: 'hard',
    approvedAt: new Date(),
  },
  {
    id: '4',
    verseId: 'verse-4',
    prompt: 'How many chapters (Surahs) are in the Qur\'an?',
    choices: [
      '114',
      '113',
      '115',
      '112'
    ],
    answer: '114',
    difficulty: 'easy',
    approvedAt: new Date(),
  },
  {
    id: '5',
    verseId: 'verse-5',
    prompt: 'What is the longest Surah in the Qur\'an?',
    choices: [
      'Al-Baqarah',
      'Al-Imran',
      'An-Nisa',
      'Al-Maidah'
    ],
    answer: 'Al-Baqarah',
    difficulty: 'medium',
    approvedAt: new Date(),
  },
];

interface QuizSettings {
  difficulty: 'all' | 'easy' | 'medium' | 'hard';
  questionCount: number;
  timeLimit: number;
}

export default function QuizPage() {
  const [isStarted, setIsStarted] = useState(false);
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  const [settings, setSettings] = useState<QuizSettings>({
    difficulty: 'all',
    questionCount: 5,
    timeLimit: 10, // minutes
  });

  // In production, this would be a real API call
  const { data: questions, isLoading, refetch } = useQuery({
    queryKey: ['questions', settings],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      let filteredQuestions = mockQuestions;
      if (settings.difficulty !== 'all') {
        filteredQuestions = mockQuestions.filter(q => q.difficulty === settings.difficulty);
      }
      
      // Shuffle and limit questions
      const shuffled = [...filteredQuestions].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, settings.questionCount);
    },
  });

  useEffect(() => {
    if (questions) {
      setCurrentQuestions(questions);
    }
  }, [questions]);

  const handleStartQuiz = () => {
    setIsStarted(true);
  };

  const handleQuizComplete = async (results: Attempt[]) => {
    // In production, submit results to API
    console.log('Quiz completed:', results);
    
    // For now, just log the results
    const score = results.filter(r => r.correct).length / results.length * 100;
    console.log(`Quiz Score: ${score}%`);
  };

  const handleBackToSetup = () => {
    setIsStarted(false);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'destructive';
      default: return 'secondary';
    }
  };

  if (isStarted && currentQuestions.length > 0) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-6 text-center">
              <Button 
                variant="outline" 
                onClick={handleBackToSetup}
                className="mb-4"
              >
                Back to Setup
              </Button>
            </div>
            <QuizInterface 
              questions={currentQuestions}
              onComplete={handleQuizComplete}
              timeLimit={settings.timeLimit}
            />
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <Navbar />
        
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100">
                <BookOpen className="h-10 w-10 text-emerald-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Qur'an Quiz
            </h1>
            <p className="text-muted-foreground">
              Test your knowledge of the Holy Qur'an
            </p>
          </div>

          {/* Quiz Setup */}
          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-emerald-600" />
                <span>Quiz Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Difficulty Selection */}
              <div>
                <label className="text-sm font-medium mb-3 block">
                  Difficulty Level
                </label>
                <div className="flex flex-wrap gap-2">
                  {['all', 'easy', 'medium', 'hard'].map((level) => (
                    <Button
                      key={level}
                      variant={settings.difficulty === level ? 'islamic' : 'outline'}
                      onClick={() => setSettings({ ...settings, difficulty: level as any })}
                      className="capitalize"
                    >
                      {level === 'all' ? 'All Levels' : level}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Question Count */}
              <div>
                <label className="text-sm font-medium mb-3 block">
                  Number of Questions
                </label>
                <div className="flex flex-wrap gap-2">
                  {[5, 10, 15, 20].map((count) => (
                    <Button
                      key={count}
                      variant={settings.questionCount === count ? 'islamic' : 'outline'}
                      onClick={() => setSettings({ ...settings, questionCount: count })}
                    >
                      {count}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Time Limit */}
              <div>
                <label className="text-sm font-medium mb-3 block">
                  Time Limit (minutes)
                </label>
                <div className="flex flex-wrap gap-2">
                  {[5, 10, 15, 20].map((time) => (
                    <Button
                      key={time}
                      variant={settings.timeLimit === time ? 'islamic' : 'outline'}
                      onClick={() => setSettings({ ...settings, timeLimit: time })}
                    >
                      {time} min
                    </Button>
                  ))}
                </div>
              </div>

              {/* Quiz Preview */}
              <div className="border-t pt-6">
                <h3 className="font-medium mb-3">Quiz Preview</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-emerald-50 rounded-lg">
                    <p className="text-2xl font-bold text-emerald-600">
                      {isLoading ? '...' : currentQuestions.length}
                    </p>
                    <p className="text-sm text-muted-foreground">Questions</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">
                      {settings.timeLimit}
                    </p>
                    <p className="text-sm text-muted-foreground">Minutes</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <Badge 
                      variant={getDifficultyColor(settings.difficulty)}
                      className="text-lg px-3 py-1 capitalize"
                    >
                      {settings.difficulty === 'all' ? 'Mixed' : settings.difficulty}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">Difficulty</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => refetch()}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Generate New Questions
                </Button>
                <Button 
                  variant="islamic" 
                  onClick={handleStartQuiz}
                  disabled={isLoading || currentQuestions.length === 0}
                  className="flex-1"
                  size="lg"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <BookOpen className="h-4 w-4 mr-2" />
                  )}
                  Start Quiz
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  );
}