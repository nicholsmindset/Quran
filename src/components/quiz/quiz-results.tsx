'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  XCircle,
  Star,
  Award,
  Flame,
  BookOpen,
  RotateCcw,
  Home,
  TrendingUp,
  Clock,
  Share2,
  Trophy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { QuizResult } from '@/types';

interface QuizResultsProps {
  result: QuizResult;
  onReturnToDashboard: () => void;
  onTakeAnother: () => void;
}

export function QuizResults({
  result,
  onReturnToDashboard,
  onTakeAnother
}: QuizResultsProps) {
  
  const scorePercentage = result.score;
  const correctAnswers = result.correctAnswers;
  const totalQuestions = result.totalQuestions;
  const timeSpentMinutes = Math.round(result.timeSpent / (1000 * 60));

  const getScoreLevel = () => {
    if (scorePercentage >= 90) return { level: 'excellent', color: 'text-emerald-600', icon: Trophy };
    if (scorePercentage >= 80) return { level: 'great', color: 'text-blue-600', icon: Star };
    if (scorePercentage >= 70) return { level: 'good', color: 'text-amber-600', icon: Award };
    if (scorePercentage >= 60) return { level: 'passing', color: 'text-orange-600', icon: CheckCircle };
    return { level: 'keep practicing', color: 'text-red-600', icon: XCircle };
  };

  const getMotivationalMessage = () => {
    if (scorePercentage >= 90) {
      return {
        title: "Excellent! Masha'Allah!",
        message: "Your dedication to learning the Qur'an is truly inspiring. May Allah continue to bless your studies.",
        arabic: "بارك الله فيك"
      };
    }
    if (scorePercentage >= 80) {
      return {
        title: "Great Work! Keep Going!",
        message: "You're making wonderful progress in your Qur'anic studies. Continue this beautiful journey.",
        arabic: "أحسنت"
      };
    }
    if (scorePercentage >= 60) {
      return {
        title: "Good Effort! Keep Learning!",
        message: "Every step in learning about the Qur'an is blessed. Keep studying and you'll improve.",
        arabic: "جزاك الله خيرا"
      };
    }
    return {
      title: "Keep Practicing!",
      message: "Learning the Qur'an is a lifelong journey. Don't be discouraged - every effort is rewarded by Allah.",
      arabic: "اصبر واحتسب"
    };
  };

  const scoreLevel = getScoreLevel();
  const motivation = getMotivationalMessage();
  const ScoreIcon = scoreLevel.icon;

  const achievements = [
    {
      condition: correctAnswers === totalQuestions,
      title: "Perfect Score!",
      description: "All answers correct",
      icon: Trophy,
      color: "text-yellow-600"
    },
    {
      condition: timeSpentMinutes <= 5,
      title: "Speed Scholar",
      description: "Completed quickly",
      icon: Clock,
      color: "text-blue-600"
    },
    {
      condition: result.streakUpdated,
      title: "Streak Extended!",
      description: "Daily goal achieved",
      icon: Flame,
      color: "text-orange-600"
    }
  ].filter(achievement => achievement.condition);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Main Results Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="islamic-pattern border-emerald-200 shadow-xl">
          <CardHeader className="text-center pb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="mx-auto mb-6"
            >
              <div className="p-6 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 shadow-lg">
                <ScoreIcon className={`h-16 w-16 ${scoreLevel.color}`} />
              </div>
            </motion.div>
            
            <CardTitle className="text-4xl font-bold text-gray-900 mb-2">
              {motivation.title}
            </CardTitle>
            <p className="text-xl text-muted-foreground mb-4">
              {motivation.message}
            </p>
            <p className="text-2xl font-arabic text-emerald-700 mb-6">
              {motivation.arabic}
            </p>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Score Display */}
            <div className="text-center space-y-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: "spring" }}
              >
                <div className={`text-8xl font-bold mb-4 ${scoreLevel.color}`}>
                  {scorePercentage}%
                </div>
              </motion.div>
              
              <div className="flex items-center justify-center space-x-8">
                <div className="text-center">
                  <p className="text-3xl font-bold text-emerald-600">
                    {correctAnswers}
                  </p>
                  <p className="text-sm text-muted-foreground">Correct</p>
                </div>
                <div className="h-12 w-px bg-gray-300"></div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-600">
                    {totalQuestions}
                  </p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
                <div className="h-12 w-px bg-gray-300"></div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">
                    {timeSpentMinutes}
                  </p>
                  <p className="text-sm text-muted-foreground">Minutes</p>
                </div>
              </div>

              <Progress 
                value={scorePercentage} 
                className="h-4 max-w-md mx-auto" 
              />
            </div>

            {/* Achievements */}
            {achievements.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-6 border border-emerald-200"
              >
                <h3 className="text-lg font-semibold text-emerald-800 mb-4 text-center">
                  🎉 Achievements Unlocked!
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {achievements.map((achievement, index) => {
                    const AchievementIcon = achievement.icon;
                    return (
                      <motion.div
                        key={index}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.8 + (index * 0.2) }}
                        className="text-center p-4 bg-white rounded-lg shadow-sm"
                      >
                        <AchievementIcon className={`h-8 w-8 mx-auto mb-2 ${achievement.color}`} />
                        <p className="font-semibold text-sm">{achievement.title}</p>
                        <p className="text-xs text-muted-foreground">{achievement.description}</p>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Detailed Results */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                <span>Detailed Results</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Answer Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                  <p className="text-3xl font-bold text-green-600 mb-1">
                    {correctAnswers}
                  </p>
                  <p className="text-green-700 font-medium">Correct Answers</p>
                  <p className="text-sm text-green-600 mt-2">
                    {Math.round((correctAnswers / totalQuestions) * 100)}% accuracy
                  </p>
                </div>
                
                <div className="text-center p-6 bg-red-50 rounded-lg border border-red-200">
                  <XCircle className="h-12 w-12 text-red-600 mx-auto mb-3" />
                  <p className="text-3xl font-bold text-red-600 mb-1">
                    {totalQuestions - correctAnswers}
                  </p>
                  <p className="text-red-700 font-medium">Incorrect Answers</p>
                  <p className="text-sm text-red-600 mt-2">
                    Review these topics
                  </p>
                </div>
              </div>

              {/* Performance Insights */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Performance Insights</h4>
                <div className="space-y-3">
                  {result.answers.map((answer, index) => (
                    <div 
                      key={answer.questionId}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center space-x-3">
                        {answer.isCorrect ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                        <span className="font-medium">Question {index + 1}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={answer.isCorrect ? 'success' : 'destructive'}
                          className="text-xs"
                        >
                          {answer.isCorrect ? 'Correct' : 'Incorrect'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {Math.round(answer.timeSpent / 1000)}s
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Actions & Social */}
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          {/* Action Buttons */}
          <Card>
            <CardHeader>
              <CardTitle>What's Next?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={onReturnToDashboard} 
                variant="islamic" 
                className="w-full"
                size="lg"
              >
                <Home className="h-4 w-4 mr-2" />
                Return to Dashboard
              </Button>
              
              <Button 
                onClick={onTakeAnother} 
                variant="outline" 
                className="w-full"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Practice More
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: 'Quran Quiz Results',
                      text: `I scored ${scorePercentage}% on today's Quran quiz! ${correctAnswers}/${totalQuestions} correct.`,
                    });
                  }
                }}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share Results
              </Button>
            </CardContent>
          </Card>

          {/* Progress Card */}
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-purple-600" />
                <span>Keep Learning</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-purple-800 text-sm leading-relaxed">
                  "And whoever fears Allah - He will make for him a way out"
                </p>
                <p className="text-xs text-purple-600">— Surah At-Talaq 65:2</p>
                
                <div className="mt-4 p-3 bg-white rounded-lg">
                  <p className="text-sm font-medium text-purple-800 mb-2">
                    Today's Learning Goal
                  </p>
                  <div className="flex justify-between text-xs text-purple-600 mb-1">
                    <span>Progress</span>
                    <span>Complete ✓</span>
                  </div>
                  <Progress value={100} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Motivation Card */}
          {result.streakUpdated && (
            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Flame className="h-5 w-5 text-amber-600" />
                  <span>Streak Updated!</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1, type: "spring" }}
                >
                  <Flame className="h-12 w-12 text-amber-500 mx-auto mb-3" />
                  <p className="text-amber-800 font-semibold">
                    Great consistency! 
                  </p>
                  <p className="text-sm text-amber-700">
                    Keep up the daily practice!
                  </p>
                </motion.div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}