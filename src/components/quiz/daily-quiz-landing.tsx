'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  Calendar,
  Clock,
  Star,
  Play,
  RotateCcw,
  CheckCircle,
  Award,
  Flame,
  TrendingUp,
  Sun,
  Moon
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { QuizStatus } from '@/types';

interface DailyQuizLandingProps {
  quizStatus?: QuizStatus;
  onStartQuiz: () => void;
  onResumeQuiz: () => void;
  isStarting: boolean;
}

export function DailyQuizLanding({
  quizStatus,
  onStartQuiz,
  onResumeQuiz,
  isStarting
}: DailyQuizLandingProps) {
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good Morning', icon: Sun, color: 'text-amber-500' };
    if (hour < 17) return { text: 'Good Afternoon', icon: Sun, color: 'text-orange-500' };
    return { text: 'Good Evening', icon: Moon, color: 'text-indigo-500' };
  };

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

  if (!quizStatus) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-emerald-600" />
            <h2 className="text-xl font-semibold mb-2">Loading Today's Quiz</h2>
            <p className="text-muted-foreground">Please wait while we prepare your daily challenge...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Islamic Greeting Header */}
      <motion.div 
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center justify-center mb-6">
          <div className="p-4 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 shadow-lg">
            <GreetingIcon className={`h-12 w-12 ${greeting.color}`} />
          </div>
        </div>
        
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          {greeting.text}! السلام عليكم
        </h1>
        <p className="text-xl text-muted-foreground mb-2">
          Welcome to your daily Qur'an journey
        </p>
        <p className="text-sm text-emerald-600 font-medium">
          "And whoever relies upon Allah - then He is sufficient for him"
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Quiz Card */}
        <motion.div 
          className="lg:col-span-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="islamic-pattern border-emerald-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <Calendar className="h-6 w-6 text-emerald-600" />
                <span className="text-2xl">Today's Challenge</span>
                <Badge variant="secondary" className="ml-auto">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Quiz Status */}
              {quizStatus.hasCompletedToday ? (
                <motion.div 
                  className="text-center p-8 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200"
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-green-800 mb-2">
                    Alhamdulillah! Quiz Completed
                  </h3>
                  <p className="text-green-700 mb-4">
                    You've completed today's daily quiz. May Allah reward your efforts!
                  </p>
                  <Badge variant="success" className="text-lg px-4 py-2">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Today's Goal Achieved
                  </Badge>
                </motion.div>
              ) : quizStatus.currentSession ? (
                <motion.div 
                  className="text-center p-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200"
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <RotateCcw className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-blue-800 mb-2">
                    Resume Your Quiz
                  </h3>
                  <p className="text-blue-700 mb-4">
                    You have a quiz in progress. Continue where you left off.
                  </p>
                  <div className="flex items-center justify-center space-x-4 mb-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {quizStatus.currentSession.currentQuestionIndex + 1}
                      </p>
                      <p className="text-sm text-blue-700">Current Question</p>
                    </div>
                    <div className="h-12 w-px bg-blue-300"></div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">5</p>
                      <p className="text-sm text-blue-700">Total Questions</p>
                    </div>
                  </div>
                  <Progress 
                    value={(quizStatus.currentSession.currentQuestionIndex / 5) * 100} 
                    className="h-3 mb-6" 
                  />
                  <Button 
                    onClick={onResumeQuiz}
                    variant="islamic"
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    <Play className="h-5 w-5 mr-2" />
                    Resume Quiz
                  </Button>
                </motion.div>
              ) : (
                <motion.div 
                  className="text-center p-8 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200"
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <BookOpen className="h-16 w-16 text-emerald-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-emerald-800 mb-2">
                    Ready for Today's Challenge?
                  </h3>
                  <p className="text-emerald-700 mb-6">
                    Test your knowledge with 5 carefully selected questions from the Holy Qur'an
                  </p>
                  
                  {/* Quiz Features */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <div className="text-center p-4 bg-white rounded-lg border border-emerald-100">
                      <BookOpen className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                      <p className="font-semibold text-emerald-800">5 Questions</p>
                      <p className="text-sm text-emerald-600">Balanced difficulty</p>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg border border-emerald-100">
                      <Clock className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                      <p className="font-semibold text-emerald-800">10 Minutes</p>
                      <p className="text-sm text-emerald-600">Take your time</p>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg border border-emerald-100">
                      <Star className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                      <p className="font-semibold text-emerald-800">Auto-Save</p>
                      <p className="text-sm text-emerald-600">Progress saved</p>
                    </div>
                  </div>

                  <Button 
                    onClick={onStartQuiz}
                    disabled={isStarting}
                    variant="islamic"
                    size="lg"
                    className="w-full sm:w-auto text-lg px-8 py-4"
                  >
                    {isStarting ? (
                      <>
                        <Clock className="h-5 w-5 mr-2 animate-spin" />
                        Starting Quiz...
                      </>
                    ) : (
                      <>
                        <Play className="h-5 w-5 mr-2" />
                        Start Today's Quiz
                      </>
                    )}
                  </Button>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Sidebar */}
        <motion.div 
          className="space-y-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {/* Streak Card */}
          <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Flame className="h-5 w-5 text-amber-600" />
                <span>Study Streak</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center space-x-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-amber-600">
                      {quizStatus.streakInfo.current}
                    </p>
                    <p className="text-sm text-amber-700">Current Streak</p>
                  </div>
                  <div className="h-12 w-px bg-amber-300"></div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-amber-600">
                      {quizStatus.streakInfo.longest}
                    </p>
                    <p className="text-sm text-amber-700">Best Streak</p>
                  </div>
                </div>
                
                {quizStatus.streakInfo.current > 0 && (
                  <motion.div
                    className="flex justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.8, type: "spring" }}
                  >
                    <Badge variant="warning" className="px-3 py-1">
                      <Flame className="h-4 w-4 mr-1" />
                      {quizStatus.streakInfo.current} days strong!
                    </Badge>
                  </motion.div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Progress Card */}
          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <span>Progress</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-purple-700">Weekly Goal</span>
                  <Badge variant="secondary">5/7 days</Badge>
                </div>
                <Progress value={71} className="h-2" />
                
                <div className="text-center pt-2">
                  <p className="text-sm text-purple-600">
                    Complete today's quiz to maintain your progress!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Motivation Card */}
          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-green-600" />
                <span>Today's Inspiration</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <blockquote className="text-center">
                <p className="text-green-800 font-medium text-sm mb-3 leading-relaxed">
                  "And it is He who sends down rain from heaven, and We produce thereby 
                  the vegetation of every kind"
                </p>
                <footer className="text-xs text-green-600">
                  — Surah Al-An'am 6:99
                </footer>
              </blockquote>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}