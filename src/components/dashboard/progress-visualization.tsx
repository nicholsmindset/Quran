'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  BookOpen,
  Target,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  ChevronDown,
  ChevronUp,
  Star,
  Flame,
  Trophy
} from 'lucide-react';
import { motion } from 'framer-motion';

interface ProgressVisualizationProps {
  data: {
    overview: {
      totalAttempts: number;
      correctAnswers: number;
      accuracy: number;
      completionRate: number;
      activeDays: number;
    };
    streaks: {
      current: number;
      longest: number;
    };
    breakdown: {
      byDifficulty: {
        easy: { total: number; correct: number; accuracy: number };
        medium: { total: number; correct: number; accuracy: number };
        hard: { total: number; correct: number; accuracy: number };
      };
      topSurahs: Array<{
        surah: number;
        total: number;
        correct: number;
        accuracy: number;
      }>;
      recentActivity: Array<{
        date: string;
        total: number;
        correct: number;
        accuracy: number;
      }>;
    };
    trends?: {
      accuracyTrend: number;
      recentAccuracy: number;
      isImproving: boolean;
    };
  };
}

const surahNames: Record<number, string> = {
  1: 'Al-Fatihah', 2: 'Al-Baqarah', 3: 'Ali \'Imran', 4: 'An-Nisa',
  5: 'Al-Ma\'idah', 6: 'Al-An\'am', 7: 'Al-A\'raf', 8: 'Al-Anfal',
  9: 'At-Taubah', 10: 'Yunus', 11: 'Hud', 12: 'Yusuf',
  13: 'Ar-Ra\'d', 14: 'Ibrahim', 15: 'Al-Hijr', 16: 'An-Nahl',
  17: 'Al-Isra', 18: 'Al-Kahf', 19: 'Maryam', 20: 'Ta-Ha',
  // ... would include all 114 surahs
};

export function ProgressVisualization({ data }: ProgressVisualizationProps) {
  const [selectedView, setSelectedView] = useState<'overview' | 'breakdown' | 'trends'>('overview');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Calculate completion percentage based on total Qur'an verses (6236)
  const totalQuranVerses = 6236;
  const estimatedVersesStudied = Math.round((data.overview.totalAttempts / 5) * 0.8); // Rough estimate
  const completionPercentage = (estimatedVersesStudied / totalQuranVerses) * 100;

  return (
    <div className="space-y-6">
      {/* Main Progress Overview */}
      <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              <span>Qur'an Learning Progress</span>
            </CardTitle>
            
            <div className="flex items-center space-x-2">
              {data.trends?.isImproving && (
                <Badge variant="success" className="animate-pulse">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Improving
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-6">
            {/* Overall Qur'an Completion */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Qur'an Completion
                </span>
                <span className="text-sm font-bold text-emerald-600">
                  {completionPercentage.toFixed(2)}%
                </span>
              </div>
              
              <Progress 
                value={completionPercentage} 
                className="h-4 mb-2 bg-gradient-to-r from-emerald-200 to-teal-200" 
              />
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{estimatedVersesStudied} verses studied</span>
                <span>{totalQuranVerses - estimatedVersesStudied} remaining</span>
              </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                icon={BookOpen}
                title="Questions"
                value={data.overview.totalAttempts.toLocaleString()}
                subtitle="Total Attempted"
                color="emerald"
              />
              
              <MetricCard
                icon={Target}
                title="Accuracy"
                value={`${data.overview.accuracy}%`}
                subtitle={`${data.overview.correctAnswers} correct`}
                color="blue"
                trend={data.trends?.accuracyTrend}
              />
              
              <MetricCard
                icon={Flame}
                title="Streak"
                value={`${data.streaks.current}`}
                subtitle={`Best: ${data.streaks.longest}`}
                color="orange"
              />
              
              <MetricCard
                icon={Calendar}
                title="Active Days"
                value={`${data.overview.activeDays}`}
                subtitle={`${data.overview.completionRate}% rate`}
                color="purple"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed View Toggle */}
      <div className="flex items-center space-x-2">
        <Button
          variant={selectedView === 'overview' ? 'islamic' : 'outline'}
          size="sm"
          onClick={() => setSelectedView('overview')}
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Overview
        </Button>
        
        <Button
          variant={selectedView === 'breakdown' ? 'islamic' : 'outline'}
          size="sm"
          onClick={() => setSelectedView('breakdown')}
        >
          <PieChart className="h-4 w-4 mr-2" />
          Breakdown
        </Button>
        
        <Button
          variant={selectedView === 'trends' ? 'islamic' : 'outline'}
          size="sm"
          onClick={() => setSelectedView('trends')}
        >
          <Activity className="h-4 w-4 mr-2" />
          Trends
        </Button>
      </div>

      {/* Content Based on Selected View */}
      {selectedView === 'overview' && (
        <OverviewCharts data={data} />
      )}
      
      {selectedView === 'breakdown' && (
        <BreakdownCharts 
          data={data} 
          expandedSection={expandedSection}
          setExpandedSection={setExpandedSection}
        />
      )}
      
      {selectedView === 'trends' && (
        <TrendsCharts data={data} />
      )}
    </div>
  );
}

function MetricCard({ 
  icon: Icon, 
  title, 
  value, 
  subtitle, 
  color, 
  trend 
}: {
  icon: any;
  title: string;
  value: string;
  subtitle: string;
  color: string;
  trend?: number;
}) {
  const colorClasses = {
    emerald: 'bg-emerald-100 text-emerald-600',
    blue: 'bg-blue-100 text-blue-600',
    orange: 'bg-orange-100 text-orange-600',
    purple: 'bg-purple-100 text-purple-600'
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card className="transition-islamic hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
              <Icon className="h-5 w-5" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <p className="text-xl font-bold truncate">{value}</p>
                {trend !== undefined && (
                  <span className={`text-xs ${trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                    {trend > 0 ? '+' : ''}{trend}%
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">{title}</p>
              <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function OverviewCharts({ data }: { data: any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Difficulty Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Performance by Difficulty</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(data.breakdown.byDifficulty).map(([difficulty, stats]: [string, any]) => (
              <div key={difficulty} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize">{difficulty}</span>
                  <Badge variant="secondary" className="text-xs">
                    {stats.accuracy}%
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Progress 
                    value={stats.accuracy} 
                    className="flex-1 h-2"
                  />
                  <span className="text-xs text-muted-foreground w-12">
                    {stats.correct}/{stats.total}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Studied Surahs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Most Studied Surahs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(data?.breakdown?.topSurahs || []).slice(0, 5).map((surah: any, index: number) => (
              <div key={surah.surah} className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-emerald-600">#{index + 1}</span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">
                      {surahNames[surah.surah] || `Surah ${surah.surah}`}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {surah.accuracy}%
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-1">
                    <Progress 
                      value={(surah.total / Math.max(...data.breakdown.topSurahs.map((s: any) => s.total))) * 100} 
                      className="flex-1 h-1"
                    />
                    <span className="text-xs text-muted-foreground">
                      {surah.total}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function BreakdownCharts({ 
  data, 
  expandedSection, 
  setExpandedSection 
}: { 
  data: any;
  expandedSection: string | null;
  setExpandedSection: (section: string | null) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Expandable Sections */}
      <ExpandableSection
        title="Difficulty Analysis"
        isExpanded={expandedSection === 'difficulty'}
        onToggle={() => setExpandedSection(expandedSection === 'difficulty' ? null : 'difficulty')}
      >
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(data.breakdown.byDifficulty).map(([difficulty, stats]: [string, any]) => (
            <Card key={difficulty} className="p-4">
              <div className="text-center">
                <h3 className="font-semibold capitalize mb-2">{difficulty}</h3>
                <div className="text-2xl font-bold mb-2">{stats.accuracy}%</div>
                <div className="text-xs text-muted-foreground">
                  {stats.correct} of {stats.total} correct
                </div>
                <Progress value={stats.accuracy} className="mt-2" />
              </div>
            </Card>
          ))}
        </div>
      </ExpandableSection>

      <ExpandableSection
        title="Surah Performance"
        isExpanded={expandedSection === 'surahs'}
        onToggle={() => setExpandedSection(expandedSection === 'surahs' ? null : 'surahs')}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.breakdown.topSurahs.map((surah: any, index: number) => (
            <Card key={surah.surah} className="p-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                    <span className="font-bold text-emerald-600">{surah.surah}</span>
                  </div>
                </div>
                
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">
                    {surahNames[surah.surah] || `Surah ${surah.surah}`}
                  </h3>
                  <div className="text-xs text-muted-foreground">
                    {surah.total} questions • {surah.accuracy}% accuracy
                  </div>
                  <Progress value={surah.accuracy} className="mt-2 h-1" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </ExpandableSection>
    </div>
  );
}

function TrendsCharts({ data }: { data: any }) {
  const recentData = (data?.breakdown?.recentActivity || []).slice(-7); // Last 7 days

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity (7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentData.map((day: any, index: number) => (
              <div key={day.date} className="flex items-center space-x-3">
                <div className="text-xs text-muted-foreground w-16">
                  {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                </div>
                
                <div className="flex-1">
                  <Progress value={day.accuracy} className="h-2" />
                </div>
                
                <div className="text-xs text-muted-foreground w-12 text-right">
                  {day.total > 0 ? `${day.accuracy}%` : 'No data'}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {data.trends && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Performance Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm">Recent Performance</span>
                <Badge variant={data.trends.recentAccuracy >= 80 ? 'success' : 'secondary'}>
                  {data.trends.recentAccuracy}%
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm">Trend</span>
                <Badge variant={data.trends.accuracyTrend > 0 ? 'success' : 'destructive'}>
                  {data.trends.accuracyTrend > 0 ? '+' : ''}{data.trends.accuracyTrend}%
                </Badge>
              </div>
              
              <div className="text-center p-4">
                {data.trends.isImproving ? (
                  <div className="text-green-600">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm font-medium">You're improving! 📈</p>
                  </div>
                ) : (
                  <div className="text-blue-600">
                    <Target className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm font-medium">Stay consistent! 🎯</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ExpandableSection({ 
  title, 
  children, 
  isExpanded, 
  onToggle 
}: { 
  title: string; 
  children: React.ReactNode; 
  isExpanded: boolean; 
  onToggle: () => void;
}) {
  return (
    <Card>
      <CardHeader 
        className="cursor-pointer hover:bg-muted/50 transition-colors" 
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </CardHeader>
      
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <CardContent>
            {children}
          </CardContent>
        </motion.div>
      )}
    </Card>
  );
}