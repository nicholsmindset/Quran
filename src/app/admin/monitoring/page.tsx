'use client';

import { PerformanceDashboard } from '@/components/monitoring/performance-dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Monitor, 
  Shield, 
  Activity,
  AlertTriangle,
  CheckCircle2,
  Settings,
  Zap
} from 'lucide-react';

export default function MonitoringPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Monitor className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">System Monitoring</h1>
              <p className="text-gray-600">Real-time performance monitoring and health metrics</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              <Shield className="h-3 w-3 mr-1" />
              Admin Access
            </Badge>
            <Badge variant="outline" className="border-green-200 text-green-600">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              All Systems Operational
            </Badge>
          </div>
        </div>

        {/* System Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white border border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">System Health</p>
                  <p className="text-2xl font-bold text-green-600">99.7%</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Response Time</p>
                  <p className="text-2xl font-bold text-blue-600">247ms</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Zap className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Users</p>
                  <p className="text-2xl font-bold text-purple-600">1,247</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Activity className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Alerts</p>
                  <p className="text-2xl font-bold text-yellow-600">2</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monitoring Tools Info */}
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Settings className="h-5 w-5" />
              Monitoring Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-green-800">Performance Metrics</h4>
                <ul className="text-xs text-green-700 space-y-1">
                  <li>• Core Web Vitals (LCP, FID, CLS, TTFB)</li>
                  <li>• API response times and throughput</li>
                  <li>• Database query performance</li>
                  <li>• Memory and resource usage</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-green-800">Error Tracking</h4>
                <ul className="text-xs text-green-700 space-y-1">
                  <li>• Real-time error reporting</li>
                  <li>• Error categorization and trends</li>
                  <li>• Stack trace analysis</li>
                  <li>• User impact assessment</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-green-800">System Health</h4>
                <ul className="text-xs text-green-700 space-y-1">
                  <li>• Service availability monitoring</li>
                  <li>• Resource utilization tracking</li>
                  <li>• Performance budget validation</li>
                  <li>• Automated alert generation</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-white bg-opacity-50 rounded-md">
              <div className="flex items-center justify-between">
                <p className="text-xs text-green-700">
                  <strong>Auto-Refresh:</strong> Dashboard updates every 30 seconds with real-time metrics
                </p>
                <Button variant="outline" size="sm" className="text-xs">
                  <Settings className="h-3 w-3 mr-1" />
                  Configure Alerts
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Performance Dashboard */}
        <PerformanceDashboard timeRange="24h" autoRefresh={true} refreshInterval={30000} />

        {/* Islamic Footer */}
        <div className="text-center py-6 border-t border-blue-200">
          <div className="flex items-center justify-center gap-2 text-blue-700 mb-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Monitor className="h-4 w-4" />
            </div>
            <p className="text-sm font-medium">
              Monitoring ensures reliable access to Qur'anic knowledge
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            "And We made from them leaders guiding by Our command when they were patient and were certain of Our signs" - Quran 32:24
          </p>
        </div>
      </div>
    </div>
  );
}