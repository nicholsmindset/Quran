'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen,
  Users,
  TrendingUp,
  Calendar,
  Award,
  Flame,
  Clock,
  Star,
  Target,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Plus,
  Share2,
  Trophy,
  PlayCircle,
  BarChart3,
  Moon,
  Sun,
  Heart,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

// Enhanced Progress Components
import { StreakCelebration } from './streak-celebration';
import { ProgressVisualization } from './progress-visualization';
import { RecentActivityFeed } from './recent-activity-feed';
import { PerformanceInsights } from './performance-insights';
import { GroupDashboard } from './group-dashboard';
import { StudentGroupView } from './student-group-view';
import { AchievementSystem } from './achievement-system';
import { LearningPathRecommendations } from './learning-path-recommendations';
import { IslamicGreeting } from './islamic-greeting';
import { ProgressSharing } from './progress-sharing';

interface EnhancedDashboardProps {
  className?: string;
}

interface DashboardData {
  userProgress: any;
  dailyQuizStatus: any;
  groups: any[];
  recommendations: any[];
  achievements: any[];
  streakData: any;
  recentActivity: any[];
}

export function EnhancedDashboard({ className }: EnhancedDashboardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedView, setSelectedView] = useState<'overview' | 'groups' | 'achievements' | 'insights'>('overview');
  const [showCelebration, setShowCelebration] = useState(false);

  // Fetch comprehensive dashboard data
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['enhanced-dashboard', user?.id],
    queryFn: async (): Promise<DashboardData> => {
      const [progressRes, quizRes, groupsRes, recommendationsRes] = await Promise.all([
        fetch('/api/user/progress?include_breakdown=true&period=month'),
        fetch('/api/quiz/daily/status'),
        user?.role === 'teacher' ? fetch('/api/groups') : 
        user?.role === 'learner' ? fetch('/api/groups/student') : 
        Promise.resolve({ json: () => ({ groups: [] }) }),
        fetch('/api/ai/recommendations')
      ]);

      const [progress, quiz, groups, recommendations] = await Promise.all([
        progressRes.json(),
        quizRes.json(),
        groupsRes.json(),
        recommendationsRes.json()
      ]);

      return {
        userProgress: progress.data,
        dailyQuizStatus: quiz.data,
        groups: groups.groups || [],
        recommendations: recommendations.data || [],
        achievements: progress.data?.achievements || [],
        streakData: progress.data?.streaks || { current: 0, longest: 0 },
        recentActivity: progress.data?.recentActivity || []
      };
    },
    enabled: !!user?.id,
    refetchInterval: 30000 // Refresh every 30 seconds for real-time updates
  });

  // Check for streak milestones and trigger celebration
  useEffect(() => {
    if (dashboardData?.streakData?.current && dashboardData.streakData.current > 0) {
      const milestones = [7, 14, 30, 50, 100];
      if (milestones.includes(dashboardData.streakData.current)) {
        setShowCelebration(true);
      }
    }
  }, [dashboardData?.streakData?.current]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-6">
          <CardContent>
            <p className="text-center text-muted-foreground">
              Failed to load dashboard. Please try again.
            </p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4 w-full"
              variant="islamic"
            >
              Refresh
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Islamic Greeting & Navigation */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <IslamicGreeting 
          user={user} 
          streakData={dashboardData?.streakData}
          completedToday={dashboardData?.dailyQuizStatus?.hasCompletedToday}
        />
        
        <div className="flex items-center space-x-2">
          <Button
            variant={selectedView === 'overview' ? 'islamic' : 'outline'}
            size="sm"
            onClick={() => setSelectedView('overview')}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </Button>
          
          {(user?.role === 'teacher' || (user?.role === 'learner' && dashboardData?.groups?.length > 0)) && (
            <Button
              variant={selectedView === 'groups' ? 'islamic' : 'outline'}
              size="sm"
              onClick={() => setSelectedView('groups')}
            >
              <Users className="h-4 w-4 mr-2" />
              Groups
            </Button>
          )}
          
          <Button
            variant={selectedView === 'achievements' ? 'islamic' : 'outline'}
            size="sm"
            onClick={() => setSelectedView('achievements')}
          >
            <Trophy className="h-4 w-4 mr-2" />
            Achievements
          </Button>
          
          <Button
            variant={selectedView === 'insights' ? 'islamic' : 'outline'}
            size="sm"
            onClick={() => setSelectedView('insights')}
          >
            <Target className="h-4 w-4 mr-2" />
            Insights
          </Button>
        </div>
      </div>

      {/* Daily Quiz Status & Quick Actions */}
      <QuickActionCard 
        dailyQuizStatus={dashboardData?.dailyQuizStatus}
        streakData={dashboardData?.streakData}
        userRole={user?.role}
      />

      {/* Main Content Based on Selected View */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedView}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {selectedView === 'overview' && (
            <OverviewView dashboardData={dashboardData} />
          )}
          
          {selectedView === 'groups' && (
            <GroupsView 
              user={user} 
              groups={dashboardData?.groups}
              userRole={user?.role}
            />
          )}
          
          {selectedView === 'achievements' && (
            <AchievementsView 
              achievements={dashboardData?.achievements}
              streakData={dashboardData?.streakData}
              userProgress={dashboardData?.userProgress}
            />
          )}
          
          {selectedView === 'insights' && (
            <InsightsView 
              userProgress={dashboardData?.userProgress}
              recommendations={dashboardData?.recommendations}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Streak Celebration Modal */}
      <StreakCelebration
        isOpen={showCelebration}
        onClose={() => setShowCelebration(false)}
        streakCount={dashboardData?.streakData?.current || 0}
        streakType={getStreakType(dashboardData?.streakData?.current || 0)}
      />
    </div>
  );
}

// Quick Action Card Component
function QuickActionCard({ dailyQuizStatus, streakData, userRole }: any) {
  const isPrayerTime = checkPrayerTime();
  
  return (
    <Card className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border-emerald-200">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-emerald-100 rounded-full">
              {dailyQuizStatus?.hasCompletedToday ? (
                <Award className="h-8 w-8 text-emerald-600" />
              ) : (
                <PlayCircle className="h-8 w-8 text-emerald-600" />
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-semibold">
                {dailyQuizStatus?.hasCompletedToday 
                  ? 'Today\'s Quiz Complete! ✨' 
                  : 'Ready for Today\'s Challenge?'
                }
              </h3>
              
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-2">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-muted-foreground">
                    {streakData?.current || 0} day streak
                  </span>
                </div>
                
                {isPrayerTime && (
                  <div className="flex items-center space-x-2 text-purple-600">
                    <Moon className="h-4 w-4" />
                    <span className="text-sm">Prayer time reminder</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {!dailyQuizStatus?.hasCompletedToday ? (
              <Link href="/quiz">
                <Button size="lg" variant="islamic" className="group">
                  <PlayCircle className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                  Start Today's Quiz
                </Button>
              </Link>
            ) : (
              <div className="flex items-center space-x-2">
                <Badge variant="success" className="px-3 py-1">
                  <Star className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
                
                <ProgressSharing 
                  score={dailyQuizStatus?.todayScore}
                  streak={streakData?.current}
                />
              </div>
            )}
            
            {userRole === 'teacher' && (
              <Link href="/teacher/groups">
                <Button variant="outline" size="lg">
                  <Users className="h-5 w-5 mr-2" />
                  Manage Groups
                </Button>
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Overview View Component
function OverviewView({ dashboardData }: { dashboardData: DashboardData }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Progress & Activity */}
      <div className="lg:col-span-2 space-y-6">
        <ProgressVisualization data={dashboardData.userProgress} />
        <PerformanceInsights data={dashboardData.userProgress} />
        <LearningPathRecommendations recommendations={dashboardData.recommendations} />
      </div>
      
      {/* Right Column - Sidebar */}
      <div className="space-y-6">
        <RecentActivityFeed activities={dashboardData.recentActivity} />
        <AchievementSystem 
          achievements={dashboardData.achievements}
          streakData={dashboardData.streakData}
        />
      </div>
    </div>
  );
}

// Groups View Component
function GroupsView({ user, groups, userRole }: any) {
  if (userRole === 'teacher') {
    return <GroupDashboard groups={groups} user={user} />;
  } else if (userRole === 'learner') {
    return <StudentGroupView groups={groups} user={user} />;
  }
  
  return (
    <Card>
      <CardContent className="p-6 text-center">
        <p className="text-muted-foreground">Group features not available for your role.</p>
      </CardContent>
    </Card>
  );
}

// Achievements View Component
function AchievementsView({ achievements, streakData, userProgress }: any) {
  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            <span>Your Islamic Learning Journey</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white/50 rounded-lg">
              <Flame className="h-8 w-8 text-orange-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-600">
                {streakData?.current || 0}
              </div>
              <div className="text-sm text-muted-foreground">Current Streak</div>
            </div>
            
            <div className="text-center p-4 bg-white/50 rounded-lg">
              <Target className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">
                {userProgress?.overview?.accuracy || 0}%
              </div>
              <div className="text-sm text-muted-foreground">Accuracy Rate</div>
            </div>
            
            <div className="text-center p-4 bg-white/50 rounded-lg">
              <BookOpen className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-emerald-600">
                {userProgress?.overview?.totalAttempts || 0}
              </div>
              <div className="text-sm text-muted-foreground">Questions Answered</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <AchievementSystem achievements={achievements} streakData={streakData} expanded={true} />
    </div>
  );
}

// Insights View Component
function InsightsView({ userProgress, recommendations }: any) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <PerformanceInsights data={userProgress} expanded={true} />
      <LearningPathRecommendations recommendations={recommendations} expanded={true} />
    </div>
  );
}

// Dashboard Loading Skeleton
function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/3"></div>
      <div className="h-32 bg-gray-200 rounded"></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
        <div className="space-y-6">
          <div className="h-48 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
}

// Helper Functions
function getStreakType(streak: number): string {
  if (streak >= 100) return 'legendary';
  if (streak >= 50) return 'master';
  if (streak >= 30) return 'champion';
  if (streak >= 14) return 'dedicated';
  if (streak >= 7) return 'committed';
  return 'beginner';
}

function checkPrayerTime(): boolean {
  const now = new Date();
  const hour = now.getHours();
  // Simplified prayer time check - would normally use Islamic calendar API
  return [5, 12, 15, 18, 20].includes(hour);
}