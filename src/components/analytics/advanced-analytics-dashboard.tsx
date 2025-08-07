'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  BookOpen,
  Clock,
  Target,
  Award,
  AlertCircle,
  Download,
  Filter,
  Calendar,
  Eye,
  Zap,
  CheckCircle2,
  XCircle,
  Activity,
  Globe,
  Brain,
  Star,
  Timer,
  FileText,
  PieChart,
  LineChart
} from 'lucide-react';
import { cn } from '@/lib/cn';

interface AnalyticsDashboardProps {
  timeRange?: '7d' | '30d' | '90d' | '1y';
  userRole?: 'admin' | 'scholar' | 'teacher';
}

interface AnalyticsData {
  overview: {
    totalUsers: number;
    activeUsers: number;
    questionsAnswered: number;
    averageAccuracy: number;
    totalQuestions: number;
    pendingModeration: number;
  };
  trends: {
    userGrowth: number[];
    engagementRate: number[];
    accuracyTrend: number[];
    questionGeneration: number[];
  };
  demographics: {
    roleDistribution: { role: string; count: number; percentage: number }[];
    regionDistribution: { region: string; count: number; percentage: number }[];
    deviceTypes: { type: string; count: number; percentage: number }[];
  };
  performance: {
    responseTime: number;
    uptime: number;
    errorRate: number;
    throughput: number;
  };
  scholarModeration: {
    totalScholars: number;
    activeScholars: number;
    averageProcessingTime: number;
    slaCompliance: number;
    qualityScore: number;
    pendingQueue: number;
  };
  userEngagement: {
    dailyActiveUsers: number;
    sessionDuration: number;
    retentionRate: number;
    streakParticipation: number;
    completionRate: number;
  };
  contentMetrics: {
    questionAccuracy: number;
    difficultyDistribution: { level: string; count: number; accuracy: number }[];
    topicPerformance: { topic: string; accuracy: number; volume: number }[];
    versePopularity: { surah: number; ayah: number; frequency: number }[];
  };
}

export function AdvancedAnalyticsDashboard({ 
  timeRange = '30d', 
  userRole = 'admin' 
}: AnalyticsDashboardProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [selectedView, setSelectedView] = useState<'overview' | 'users' | 'content' | 'moderation' | 'performance'>('overview');
  const [exportFormat, setExportFormat] = useState<'pdf' | 'csv' | 'json'>('pdf');

  // Fetch analytics data
  const { data: analyticsData, isLoading, refetch } = useQuery({
    queryKey: ['analytics', selectedTimeRange, userRole],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/dashboard?timeRange=${selectedTimeRange}&role=${userRole}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    },
  });

  // Sample data for demonstration
  useEffect(() => {
    if (!analyticsData) return;
  }, [analyticsData]);

  const mockData: AnalyticsData = {
    overview: {
      totalUsers: 15847,
      activeUsers: 8943,
      questionsAnswered: 284619,
      averageAccuracy: 78.5,
      totalQuestions: 12500,
      pendingModeration: 247
    },
    trends: {
      userGrowth: [100, 150, 200, 280, 350, 420, 500, 620, 750, 890, 1020, 1200],
      engagementRate: [65, 68, 72, 69, 74, 76, 73, 78, 80, 82, 79, 84],
      accuracyTrend: [72, 73, 75, 74, 76, 77, 78, 79, 78, 79, 80, 78],
      questionGeneration: [50, 65, 80, 95, 120, 140, 160, 185, 200, 225, 240, 260]
    },
    demographics: {
      roleDistribution: [
        { role: 'Learners', count: 14250, percentage: 89.9 },
        { role: 'Teachers', count: 1350, percentage: 8.5 },
        { role: 'Scholars', count: 247, percentage: 1.6 }
      ],
      regionDistribution: [
        { region: 'Middle East', count: 6340, percentage: 40.0 },
        { region: 'South Asia', count: 4755, percentage: 30.0 },
        { region: 'Southeast Asia', count: 2377, percentage: 15.0 },
        { region: 'North America', count: 1585, percentage: 10.0 },
        { region: 'Europe', count: 790, percentage: 5.0 }
      ],
      deviceTypes: [
        { type: 'Mobile', count: 11135, percentage: 70.3 },
        { type: 'Desktop', count: 3955, percentage: 24.9 },
        { type: 'Tablet', count: 757, percentage: 4.8 }
      ]
    },
    performance: {
      responseTime: 247,
      uptime: 99.7,
      errorRate: 0.12,
      throughput: 2847
    },
    scholarModeration: {
      totalScholars: 247,
      activeScholars: 189,
      averageProcessingTime: 3.2,
      slaCompliance: 96.8,
      qualityScore: 94.2,
      pendingQueue: 247
    },
    userEngagement: {
      dailyActiveUsers: 8943,
      sessionDuration: 18.5,
      retentionRate: 84.2,
      streakParticipation: 67.8,
      completionRate: 91.4
    },
    contentMetrics: {
      questionAccuracy: 78.5,
      difficultyDistribution: [
        { level: 'Easy', count: 4200, accuracy: 89.2 },
        { level: 'Medium', count: 5800, accuracy: 76.4 },
        { level: 'Hard', count: 2500, accuracy: 61.8 }
      ],
      topicPerformance: [
        { topic: 'Fiqh', accuracy: 82.1, volume: 3400 },
        { topic: 'Tafsir', accuracy: 79.5, volume: 2800 },
        { topic: 'Hadith', accuracy: 76.8, volume: 2200 },
        { topic: 'History', accuracy: 74.2, volume: 1900 },
        { topic: 'Arabic Language', accuracy: 71.6, volume: 2200 }
      ],
      versePopularity: [
        { surah: 2, ayah: 255, frequency: 1247 }, // Ayat al-Kursi
        { surah: 1, ayah: 1, frequency: 1189 }, // Al-Fatiha
        { surah: 112, ayah: 1, frequency: 987 }, // Al-Ikhlas
        { surah: 2, ayah: 152, frequency: 845 },
        { surah: 3, ayah: 185, frequency: 798 }
      ]
    }
  };

  const data = analyticsData?.data || mockData;

  const getTimeRangeLabel = (range: string) => {
    switch (range) {
      case '7d': return 'Last 7 Days';
      case '30d': return 'Last 30 Days';
      case '90d': return 'Last 90 Days';
      case '1y': return 'Last Year';
      default: return 'Last 30 Days';
    }
  };

  const handleExport = async () => {
    const response = await fetch(`/api/analytics/export?format=${exportFormat}&timeRange=${selectedTimeRange}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${selectedTimeRange}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  };

  const MetricCard = ({ 
    title, 
    value, 
    change, 
    changeType, 
    icon: Icon, 
    suffix = '', 
    format = 'number' 
  }: {
    title: string;
    value: number;
    change?: number;
    changeType?: 'positive' | 'negative' | 'neutral';
    icon: any;
    suffix?: string;
    format?: 'number' | 'percentage' | 'currency' | 'time';
  }) => {
    const formatValue = (val: number) => {
      switch (format) {
        case 'percentage': return `${val}%`;
        case 'currency': return `$${val.toLocaleString()}`;
        case 'time': return `${val}min`;
        default: return val.toLocaleString();
      }
    };

    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">{formatValue(value)}{suffix}</p>
                {change !== undefined && (
                  <div className={cn(
                    "flex items-center gap-1 text-xs",
                    changeType === 'positive' ? "text-emerald-600" :
                    changeType === 'negative' ? "text-red-600" : "text-gray-600"
                  )}>
                    {changeType === 'positive' ? <TrendingUp className="h-3 w-3" /> :
                     changeType === 'negative' ? <TrendingDown className="h-3 w-3" /> :
                     <Activity className="h-3 w-3" />}
                    {Math.abs(change)}%
                  </div>
                )}
              </div>
            </div>
            <div className={cn(
              "p-3 rounded-full",
              changeType === 'positive' ? "bg-emerald-100 text-emerald-600" :
              changeType === 'negative' ? "bg-red-100 text-red-600" :
              "bg-blue-100 text-blue-600"
            )}>
              <Icon className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading analytics dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-muted-foreground">{getTimeRangeLabel(selectedTimeRange)} • Updated in real-time</p>
        </div>
        
        <div className="flex gap-2">
          <div className="flex items-center gap-1 bg-white px-3 py-2 rounded-md border">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <select
              className="text-sm border-none bg-transparent focus:outline-none"
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value as any)}
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="1y">Last Year</option>
            </select>
          </div>
          
          <div className="flex items-center gap-1 bg-white px-3 py-2 rounded-md border">
            <Download className="h-4 w-4 text-muted-foreground" />
            <select
              className="text-sm border-none bg-transparent focus:outline-none"
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as any)}
            >
              <option value="pdf">PDF Report</option>
              <option value="csv">CSV Data</option>
              <option value="json">JSON Export</option>
            </select>
          </div>
          
          <Button onClick={handleExport} size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Users"
          value={data.overview.totalUsers}
          change={12.5}
          changeType="positive"
          icon={Users}
        />
        <MetricCard
          title="Active Users"
          value={data.overview.activeUsers}
          change={8.2}
          changeType="positive"
          icon={Activity}
        />
        <MetricCard
          title="Questions Answered"
          value={data.overview.questionsAnswered}
          change={15.7}
          changeType="positive"
          icon={BookOpen}
        />
        <MetricCard
          title="Average Accuracy"
          value={data.overview.averageAccuracy}
          change={2.1}
          changeType="positive"
          icon={Target}
          format="percentage"
        />
      </div>

      {/* Main Analytics Tabs */}
      <Tabs value={selectedView} onValueChange={(value: any) => setSelectedView(value)}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Content
          </TabsTrigger>
          <TabsTrigger value="moderation" className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Moderation
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Performance
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Growth Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  User Growth Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end justify-between gap-2">
                  {data.trends.userGrowth.map((value, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div 
                        className="bg-blue-500 rounded-t w-full transition-all duration-300 hover:bg-blue-600"
                        style={{ height: `${(value / Math.max(...data.trends.userGrowth)) * 200}px` }}
                      />
                      <span className="text-xs text-muted-foreground mt-1">
                        {index + 1}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex justify-between text-sm text-muted-foreground">
                  <span>Jan</span>
                  <span>Dec</span>
                </div>
              </CardContent>
            </Card>

            {/* Engagement Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Engagement Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Daily Active Users</span>
                    <span className="text-sm text-muted-foreground">{data.userEngagement.dailyActiveUsers.toLocaleString()}</span>
                  </div>
                  <Progress value={(data.userEngagement.dailyActiveUsers / data.overview.totalUsers) * 100} className="h-2" />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Session Duration</span>
                    <span className="text-sm text-muted-foreground">{data.userEngagement.sessionDuration}min</span>
                  </div>
                  <Progress value={data.userEngagement.sessionDuration * 2} className="h-2" />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Retention Rate</span>
                    <span className="text-sm text-muted-foreground">{data.userEngagement.retentionRate}%</span>
                  </div>
                  <Progress value={data.userEngagement.retentionRate} className="h-2" />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Completion Rate</span>
                    <span className="text-sm text-muted-foreground">{data.userEngagement.completionRate}%</span>
                  </div>
                  <Progress value={data.userEngagement.completionRate} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Demographics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Role Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.demographics.roleDistribution.map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-3 h-3 rounded-full",
                          index === 0 ? "bg-blue-500" :
                          index === 1 ? "bg-green-500" : "bg-purple-500"
                        )} />
                        <span className="text-sm font-medium">{item.role}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{item.count.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{item.percentage}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Regional Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.demographics.regionDistribution.map((item, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{item.region}</span>
                        <span className="text-sm text-muted-foreground">{item.percentage}%</span>
                      </div>
                      <Progress value={item.percentage} className="h-1" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Device Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.demographics.deviceTypes.map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "p-1.5 rounded",
                          index === 0 ? "bg-blue-100 text-blue-600" :
                          index === 1 ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"
                        )}>
                          {index === 0 ? <Globe className="h-3 w-3" /> :
                           index === 1 ? <Eye className="h-3 w-3" /> : <Timer className="h-3 w-3" />}
                        </div>
                        <span className="text-sm font-medium">{item.type}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{item.percentage}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Daily Active Users"
              value={data.userEngagement.dailyActiveUsers}
              change={5.2}
              changeType="positive"
              icon={Users}
            />
            <MetricCard
              title="Session Duration"
              value={data.userEngagement.sessionDuration}
              change={12.1}
              changeType="positive"
              icon={Clock}
              format="time"
            />
            <MetricCard
              title="Retention Rate"
              value={data.userEngagement.retentionRate}
              change={3.7}
              changeType="positive"
              icon={Target}
              format="percentage"
            />
            <MetricCard
              title="Streak Participation"
              value={data.userEngagement.streakParticipation}
              change={-2.1}
              changeType="negative"
              icon={Award}
              format="percentage"
            />
          </div>

          {/* User Analytics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Engagement Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end justify-between gap-1">
                  {data.trends.engagementRate.map((rate, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div 
                        className="bg-emerald-500 rounded-t w-full transition-all duration-300 hover:bg-emerald-600"
                        style={{ height: `${(rate / 100) * 200}px` }}
                      />
                      <span className="text-xs text-muted-foreground mt-1">{rate}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Learning Progress Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Beginners (0-25%)</span>
                      <span>3,247 users</span>
                    </div>
                    <Progress value={20.5} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Intermediate (26-75%)</span>
                      <span>8,934 users</span>
                    </div>
                    <Progress value={56.4} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Advanced (76-100%)</span>
                      <span>3,666 users</span>
                    </div>
                    <Progress value={23.1} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Questions"
              value={data.overview.totalQuestions}
              change={8.9}
              changeType="positive"
              icon={BookOpen}
            />
            <MetricCard
              title="Average Accuracy"
              value={data.contentMetrics.questionAccuracy}
              change={1.2}
              changeType="positive"
              icon={Target}
              format="percentage"
            />
            <MetricCard
              title="Questions Generated"
              value={260}
              change={23.5}
              changeType="positive"
              icon={Brain}
            />
            <MetricCard
              title="Pending Moderation"
              value={data.overview.pendingModeration}
              change={-15.2}
              changeType="positive"
              icon={AlertCircle}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Difficulty Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Question Difficulty Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.contentMetrics.difficultyDistribution.map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            item.level === 'Easy' ? 'secondary' :
                            item.level === 'Medium' ? 'default' : 'destructive'
                          }>
                            {item.level}
                          </Badge>
                          <span className="text-sm">{item.count.toLocaleString()} questions</span>
                        </div>
                        <span className="text-sm font-medium">{item.accuracy}%</span>
                      </div>
                      <Progress value={item.accuracy} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Topic Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Topic Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.contentMetrics.topicPerformance.map((topic, index) => (
                    <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-gray-50">
                      <div>
                        <p className="text-sm font-medium">{topic.topic}</p>
                        <p className="text-xs text-muted-foreground">{topic.volume.toLocaleString()} questions</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{topic.accuracy}%</p>
                        <p className="text-xs text-muted-foreground">accuracy</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Popular Verses */}
          <Card>
            <CardHeader>
              <CardTitle>Most Popular Verses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {data.contentMetrics.versePopularity.map((verse, index) => (
                  <Card key={index} className="border border-emerald-200">
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-emerald-100 rounded-full">
                        <BookOpen className="h-6 w-6 text-emerald-600" />
                      </div>
                      <p className="font-medium">Surah {verse.surah}:{verse.ayah}</p>
                      <p className="text-sm text-muted-foreground">{verse.frequency} views</p>
                      <Badge variant="outline" className="mt-2">
                        #{index + 1} Popular
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Moderation Tab */}
        <TabsContent value="moderation" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Active Scholars"
              value={data.scholarModeration.activeScholars}
              change={2.1}
              changeType="positive"
              icon={Users}
            />
            <MetricCard
              title="Avg Processing Time"
              value={data.scholarModeration.averageProcessingTime}
              change={-8.5}
              changeType="positive"
              icon={Clock}
              format="time"
            />
            <MetricCard
              title="SLA Compliance"
              value={data.scholarModeration.slaCompliance}
              change={1.8}
              changeType="positive"
              icon={CheckCircle2}
              format="percentage"
            />
            <MetricCard
              title="Quality Score"
              value={data.scholarModeration.qualityScore}
              change={0.7}
              changeType="positive"
              icon={Star}
              format="percentage"
            />
          </div>

          {/* Scholar Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Scholar Workload Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>High Performers (&gt;95% SLA)</span>
                      <span>142 scholars</span>
                    </div>
                    <Progress value={75.1} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Regular Performers (85-95% SLA)</span>
                      <span>38 scholars</span>
                    </div>
                    <Progress value={20.1} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Needs Support (&lt;85% SLA)</span>
                      <span>9 scholars</span>
                    </div>
                    <Progress value={4.8} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Moderation Queue Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-emerald-600 mb-2">
                    {data.scholarModeration.pendingQueue}
                  </div>
                  <p className="text-muted-foreground">Questions Pending</p>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 rounded bg-red-50">
                    <span className="text-sm">High Priority</span>
                    <Badge variant="destructive">67</Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded bg-yellow-50">
                    <span className="text-sm">Medium Priority</span>
                    <Badge variant="secondary">124</Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded bg-blue-50">
                    <span className="text-sm">Low Priority</span>
                    <Badge variant="outline">56</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Avg Response Time"
              value={data.performance.responseTime}
              change={-12.3}
              changeType="positive"
              icon={Zap}
              suffix="ms"
            />
            <MetricCard
              title="System Uptime"
              value={data.performance.uptime}
              change={0.1}
              changeType="positive"
              icon={CheckCircle2}
              format="percentage"
            />
            <MetricCard
              title="Error Rate"
              value={data.performance.errorRate}
              change={-25.8}
              changeType="positive"
              icon={XCircle}
              format="percentage"
            />
            <MetricCard
              title="Requests/Hour"
              value={data.performance.throughput}
              change={18.7}
              changeType="positive"
              icon={Activity}
            />
          </div>

          {/* Performance Monitoring */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Health Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Database Performance</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-sm font-medium">Excellent</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">API Response Times</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-sm font-medium">Good</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Memory Usage</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                    <span className="text-sm font-medium">Moderate</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">CDN Performance</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-sm font-medium">Optimal</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resource Utilization</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>CPU Usage</span>
                    <span>45%</span>
                  </div>
                  <Progress value={45} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Memory Usage</span>
                    <span>67%</span>
                  </div>
                  <Progress value={67} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Storage Usage</span>
                    <span>34%</span>
                  </div>
                  <Progress value={34} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Network I/O</span>
                    <span>23%</span>
                  </div>
                  <Progress value={23} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}