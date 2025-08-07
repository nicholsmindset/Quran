'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Navbar } from '@/components/layout/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Calendar, 
  BookOpen,
  Target,
  Award,
  BarChart3,
  Filter,
  Download
} from 'lucide-react';

// Mock data for progress tracking
const juzData = Array.from({ length: 30 }, (_, i) => ({
  id: i + 1,
  name: `Juz ${i + 1}`,
  totalVerses: Math.floor(Math.random() * 300) + 150,
  completedVerses: Math.floor(Math.random() * 200),
  accuracy: Math.floor(Math.random() * 30) + 70,
  timeSpent: Math.floor(Math.random() * 120) + 30, // minutes
}));

const surahData = [
  { id: 1, name: 'Al-Fatihah', verses: 7, completed: 7, accuracy: 100 },
  { id: 2, name: 'Al-Baqarah', verses: 286, completed: 245, accuracy: 85 },
  { id: 3, name: 'Al-Imran', verses: 200, completed: 150, accuracy: 88 },
  { id: 4, name: 'An-Nisa', verses: 176, completed: 100, accuracy: 82 },
  { id: 5, name: 'Al-Maidah', verses: 120, completed: 80, accuracy: 90 },
];

const weeklyStats = [
  { week: 'Week 1', questionsAnswered: 45, accuracy: 82, timeSpent: 180 },
  { week: 'Week 2', questionsAnswered: 52, accuracy: 85, timeSpent: 200 },
  { week: 'Week 3', questionsAnswered: 38, accuracy: 88, timeSpent: 160 },
  { week: 'Week 4', questionsAnswered: 61, accuracy: 91, timeSpent: 220 },
];

export default function ProgressPage() {
  const [activeTab, setActiveTab] = useState<'juz' | 'surah' | 'weekly'>('juz');

  const calculateOverallProgress = (data: any[]) => {
    const totalVerses = data.reduce((sum, item) => sum + (item.totalVerses || item.verses), 0);
    const completedVerses = data.reduce((sum, item) => sum + (item.completedVerses || item.completed), 0);
    return Math.round((completedVerses / totalVerses) * 100);
  };

  const renderJuzProgress = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {juzData.map((juz) => {
        const completion = Math.round((juz.completedVerses / juz.totalVerses) * 100);
        return (
          <Card key={juz.id} className="transition-islamic hover:shadow-lg">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{juz.name}</CardTitle>
                <Badge 
                  variant={completion === 100 ? 'success' : completion >= 50 ? 'warning' : 'secondary'}
                >
                  {completion}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Progress value={completion} className="h-2" />
                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <div>
                    <p className="font-medium">{juz.completedVerses}/{juz.totalVerses}</p>
                    <p className="text-xs">Verses</p>
                  </div>
                  <div>
                    <p className="font-medium">{juz.accuracy}%</p>
                    <p className="text-xs">Accuracy</p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Study time: {juz.timeSpent} minutes
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const renderSurahProgress = () => (
    <div className="space-y-4">
      {surahData.map((surah) => {
        const completion = Math.round((surah.completed / surah.verses) * 100);
        return (
          <Card key={surah.id} className="transition-islamic hover:shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{surah.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {surah.completed}/{surah.verses} verses completed
                  </p>
                </div>
                <div className="text-right">
                  <Badge 
                    variant={completion === 100 ? 'success' : completion >= 75 ? 'warning' : 'secondary'}
                    className="mb-2"
                  >
                    {completion}%
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    {surah.accuracy}% accuracy
                  </p>
                </div>
              </div>
              <Progress value={completion} className="h-3" />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const renderWeeklyStats = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <BookOpen className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">{weeklyStats.reduce((sum, week) => sum + week.questionsAnswered, 0)}</p>
            <p className="text-sm text-muted-foreground">Total Questions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">
              {Math.round(weeklyStats.reduce((sum, week) => sum + week.accuracy, 0) / weeklyStats.length)}%
            </p>
            <p className="text-sm text-muted-foreground">Avg Accuracy</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Calendar className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">{Math.round(weeklyStats.reduce((sum, week) => sum + week.timeSpent, 0) / 60)}</p>
            <p className="text-sm text-muted-foreground">Hours Studied</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {weeklyStats.map((week, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{week.week}</h4>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                    <span>{week.questionsAnswered} questions</span>
                    <span>{week.accuracy}% accuracy</span>
                    <span>{Math.round(week.timeSpent / 60)}h {week.timeSpent % 60}m studied</span>
                  </div>
                </div>
                <div className="w-24">
                  <Progress value={week.accuracy} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <Navbar />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Learning Progress</h1>
                <p className="text-muted-foreground">
                  Track your Qur'an learning journey and achievements
                </p>
              </div>
              <div className="flex items-center space-x-2 mt-4 sm:mt-0">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </div>

          {/* Overall Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <BookOpen className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold">{calculateOverallProgress(juzData)}%</p>
                    <p className="text-sm text-muted-foreground">Overall Progress</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Target className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold">87%</p>
                    <p className="text-sm text-muted-foreground">Avg Accuracy</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Award className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold">12</p>
                    <p className="text-sm text-muted-foreground">Day Streak</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Calendar className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold">45</p>
                    <p className="text-sm text-muted-foreground">Study Days</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
              <button
                onClick={() => setActiveTab('juz')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'juz'
                    ? 'bg-white shadow-sm text-emerald-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                By Juz
              </button>
              <button
                onClick={() => setActiveTab('surah')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'surah'
                    ? 'bg-white shadow-sm text-emerald-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                By Surah
              </button>
              <button
                onClick={() => setActiveTab('weekly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'weekly'
                    ? 'bg-white shadow-sm text-emerald-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Weekly Stats
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="min-h-96">
            {activeTab === 'juz' && renderJuzProgress()}
            {activeTab === 'surah' && renderSurahProgress()}
            {activeTab === 'weekly' && renderWeeklyStats()}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}