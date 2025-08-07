'use client';

import { useState } from 'react';
import { AdvancedAnalyticsDashboard } from '@/components/analytics/advanced-analytics-dashboard';
import { QualityMetricsPanel } from '@/components/scholar/quality-metrics-panel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Award, 
  Clock, 
  Target, 
  Star,
  CheckCircle2,
  TrendingUp,
  Eye,
  BookOpen
} from 'lucide-react';

export default function ScholarAnalyticsPage() {
  const [selectedScholarId] = useState('scholar_123'); // This would come from auth context

  const mockScholarStats = {
    totalReviewed: 1247,
    approved: 1089,
    rejected: 89,
    edited: 69,
    avgProcessingTime: 3.2,
    currentSLA: 96.8,
    period: 'weekly' as const
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Scholar Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Award className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Scholar Dashboard</h1>
              <p className="text-gray-600">Your performance metrics and analytics</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
              <Star className="h-3 w-3 mr-1" />
              Expert Scholar
            </Badge>
            <Badge variant="outline" className="border-emerald-200 text-emerald-600">
              Fiqh Specialist
            </Badge>
          </div>
        </div>

        {/* Personal Performance Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white border border-emerald-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Questions Reviewed</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{mockScholarStats.totalReviewed}</div>
              <div className="flex items-center gap-1 text-xs text-emerald-600">
                <TrendingUp className="h-3 w-3" />
                +12.5% this week
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {Math.round((mockScholarStats.approved / mockScholarStats.totalReviewed) * 100)}%
              </div>
              <div className="flex items-center gap-1 text-xs text-blue-600">
                <TrendingUp className="h-3 w-3" />
                +2.3% this week
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Processing Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {mockScholarStats.avgProcessingTime}min
              </div>
              <div className="flex items-center gap-1 text-xs text-emerald-600">
                <TrendingUp className="h-3 w-3 rotate-180" />
                -0.8min faster
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">SLA Compliance</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {mockScholarStats.currentSLA}%
              </div>
              <div className="flex items-center gap-1 text-xs text-orange-600">
                <TrendingUp className="h-3 w-3" />
                +1.2% this week
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scholar Analytics Tabs */}
        <Tabs defaultValue="personal" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personal" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              Personal Metrics
            </TabsTrigger>
            <TabsTrigger value="quality" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Quality Analytics
            </TabsTrigger>
            <TabsTrigger value="platform" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Platform Overview
            </TabsTrigger>
          </TabsList>

          {/* Personal Metrics Tab */}
          <TabsContent value="personal" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Your Review Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-900">Review Breakdown</p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-emerald-600">Approved</span>
                        <span className="font-medium">{mockScholarStats.approved}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-blue-600">Edited</span>
                        <span className="font-medium">{mockScholarStats.edited}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-red-600">Rejected</span>
                        <span className="font-medium">{mockScholarStats.rejected}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-900">Specialization Areas</p>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="secondary">Fiqh</Badge>
                      <Badge variant="outline">Tafsir</Badge>
                      <Badge variant="outline">Hadith</Badge>
                      <Badge variant="outline">Arabic Language</Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-900">Recent Achievements</p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <Award className="h-3 w-3 text-yellow-500" />
                        <span>30-Day Excellence Streak</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Star className="h-3 w-3 text-blue-500" />
                        <span>Efficiency Master</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quality Analytics Tab */}
          <TabsContent value="quality" className="space-y-4">
            <QualityMetricsPanel scholarId={selectedScholarId} stats={mockScholarStats} />
          </TabsContent>

          {/* Platform Overview Tab */}
          <TabsContent value="platform" className="space-y-4">
            <AdvancedAnalyticsDashboard timeRange="30d" userRole="scholar" />
          </TabsContent>
        </Tabs>

        {/* Islamic Footer */}
        <div className="text-center py-6 border-t border-emerald-200">
          <div className="flex items-center justify-center gap-2 text-emerald-700 mb-2">
            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
              <Award className="h-4 w-4" />
            </div>
            <p className="text-sm font-medium">
              May your scholarly efforts be blessed and your knowledge benefit the Ummah
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            "And say: My Lord, increase me in knowledge" - Quran 20:114
          </p>
        </div>
      </div>
    </div>
  );
}