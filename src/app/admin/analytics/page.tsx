'use client';

import { AdvancedAnalyticsDashboard } from '@/components/analytics/advanced-analytics-dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, BarChart3, Users, Activity } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analytics & Insights</h1>
              <p className="text-gray-600">Comprehensive platform analytics and performance metrics</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border">
            <Shield className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-medium text-gray-700">Admin Access</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-white border border-emerald-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Platform Health</p>
                  <p className="text-2xl font-bold text-emerald-600">99.7%</p>
                </div>
                <div className="p-3 bg-emerald-100 rounded-full">
                  <Activity className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Users</p>
                  <p className="text-2xl font-bold text-blue-600">8,943</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Learning Accuracy</p>
                  <p className="text-2xl font-bold text-purple-600">78.5%</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Analytics Dashboard */}
        <AdvancedAnalyticsDashboard timeRange="30d" userRole="admin" />

        {/* Footer */}
        <div className="text-center py-6 border-t border-gray-200">
          <p className="text-sm text-muted-foreground">
            Analytics data updated in real-time • Last refresh: {new Date().toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}