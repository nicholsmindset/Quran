'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Target, 
  Flame, 
  Award,
  TrendingUp,
  Calendar
} from 'lucide-react';

interface ProgressData {
  totalVerses: number;
  completedVerses: number;
  currentStreak: number;
  longestStreak: number;
  accuracy: number;
  questionsAnswered: number;
  studyDays: number;
}

interface ProgressOverviewProps {
  data: ProgressData;
}

export function ProgressOverview({ data }: ProgressOverviewProps) {
  const completionPercentage = (data.completedVerses / data.totalVerses) * 100;

  const stats = [
    {
      title: 'Verses Studied',
      value: `${data.completedVerses}/${data.totalVerses}`,
      icon: BookOpen,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
    },
    {
      title: 'Current Streak',
      value: `${data.currentStreak} days`,
      icon: Flame,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Accuracy Rate',
      value: `${data.accuracy}%`,
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Questions Answered',
      value: data.questionsAnswered.toLocaleString(),
      icon: Award,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Main Progress Card */}
      <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            <span>Learning Progress</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Overall Completion
              </span>
              <span className="text-sm font-bold text-emerald-600">
                {completionPercentage.toFixed(1)}%
              </span>
            </div>
            <Progress value={completionPercentage} className="h-3" />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{data.completedVerses} verses completed</span>
              <span>{data.totalVerses - data.completedVerses} remaining</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="transition-islamic hover:shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.title}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Achievement Badges */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="h-5 w-5 text-yellow-600" />
            <span>Recent Achievements</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {data.currentStreak >= 7 && (
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                <Flame className="h-3 w-3 mr-1" />
                Week Streak
              </Badge>
            )}
            {data.accuracy >= 80 && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                <Target className="h-3 w-3 mr-1" />
                High Accuracy
              </Badge>
            )}
            {data.questionsAnswered >= 100 && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                <BookOpen className="h-3 w-3 mr-1" />
                Century Club
              </Badge>
            )}
            {data.studyDays >= 30 && (
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                <Calendar className="h-3 w-3 mr-1" />
                Monthly Learner
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}