'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Navbar } from '@/components/layout/navbar';
import { ProgressOverview } from '@/components/dashboard/progress-overview';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Play, 
  Users, 
  TrendingUp,
  Clock,
  Award,
  Calendar,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

// Mock data - in production, this would come from your API
const mockProgressData = {
  totalVerses: 6236, // Total verses in Quran
  completedVerses: 457,
  currentStreak: 12,
  longestStreak: 28,
  accuracy: 85,
  questionsAnswered: 1240,
  studyDays: 45,
};

const mockRecentActivity = [
  {
    id: '1',
    type: 'quiz_completed',
    title: 'Completed Surah Al-Baqarah Quiz',
    description: '15/20 questions correct',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    score: 75,
  },
  {
    id: '2',
    type: 'streak',
    title: 'Streak Milestone',
    description: '10 days in a row!',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    score: null,
  },
  {
    id: '3',
    type: 'quiz_completed',
    title: 'Completed Surah Al-Fatihah Quiz',
    description: '7/7 questions correct',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    score: 100,
  },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Good morning');
    } else if (hour < 17) {
      setGreeting('Good afternoon');
    } else {
      setGreeting('Good evening');
    }
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'quiz_completed':
        return BookOpen;
      case 'streak':
        return Award;
      default:
        return Clock;
    }
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
  };

  return (
    <ProtectedRoute fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to continue</h1>
          <Link href="/auth">
            <Button variant="islamic">Sign In</Button>
          </Link>
        </div>
      </div>
    }>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <Navbar />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {greeting}, {user?.email?.split('@')[0]}!
            </h1>
            <p className="text-muted-foreground">
              Continue your Qur'an learning journey. May Allah bless your studies.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Progress Overview */}
              <ProgressOverview data={mockProgressData} />

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Play className="h-5 w-5 text-emerald-600" />
                    <span>Quick Actions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Link href="/quiz">
                      <Button 
                        variant="islamic" 
                        className="w-full h-20 text-lg"
                        size="lg"
                      >
                        <BookOpen className="h-6 w-6 mr-2" />
                        Start Quiz
                      </Button>
                    </Link>
                    <Link href="/progress">
                      <Button 
                        variant="outline" 
                        className="w-full h-20 text-lg"
                        size="lg"
                      >
                        <TrendingUp className="h-6 w-6 mr-2" />
                        View Progress
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Role-based Cards */}
              {user?.role === 'teacher' && (
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      <span>Teacher Dashboard</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Manage your students and create custom quizzes
                    </p>
                    <Link href="/teacher">
                      <Button variant="outline">
                        Go to Teacher Dashboard
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}

              {user?.role === 'scholar' && (
                <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Award className="h-5 w-5 text-purple-600" />
                      <span>Scholar Panel</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Review and approve AI-generated questions
                    </p>
                    <Link href="/scholar">
                      <Button variant="outline">
                        Review Questions
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Today's Goal */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-emerald-600" />
                    <span>Today's Goal</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Daily Questions</span>
                      <Badge variant="success">5/5 Complete</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Study Time</span>
                      <Badge variant="secondary">23 minutes</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Streak</span>
                      <Badge variant="warning">{mockProgressData.currentStreak} days</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-emerald-600" />
                    <span>Recent Activity</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockRecentActivity.map((activity) => {
                      const IconComponent = getActivityIcon(activity.type);
                      return (
                        <div key={activity.id} className="flex items-start space-x-3">
                          <div className="p-1 rounded-full bg-emerald-100">
                            <IconComponent className="h-4 w-4 text-emerald-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {activity.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {activity.description}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatRelativeTime(activity.timestamp)}
                            </p>
                          </div>
                          {activity.score && (
                            <Badge 
                              variant={activity.score >= 80 ? 'success' : 'secondary'}
                              className="text-xs"
                            >
                              {activity.score}%
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}