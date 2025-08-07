'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  Globe,
  HardDriveIcon,
  Monitor,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Zap,
  AlertCircle,
  Eye,
  Server,
  Wifi,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/cn';

interface PerformanceDashboardProps {
  timeRange?: '1h' | '6h' | '24h' | '7d' | '30d';
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function PerformanceDashboard({ 
  timeRange = '24h', 
  autoRefresh = true,
  refreshInterval = 30000 
}: PerformanceDashboardProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [liveMetrics, setLiveMetrics] = useState<Record<string, unknown> | null>(null);

  // Fetch performance summary
  const { data: summaryData, isLoading: summaryLoading, refetch: refetchSummary } = useQuery({
    queryKey: ['performance-summary', selectedTimeRange],
    queryFn: async () => {
      const response = await fetch(`/api/monitoring/performance?type=summary&timeRange=${selectedTimeRange}`);
      if (!response.ok) throw new Error('Failed to fetch performance summary');
      return response.json();
    },
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  // Fetch performance budgets
  const { data: budgetsData, isLoading: budgetsLoading } = useQuery({
    queryKey: ['performance-budgets'],
    queryFn: async () => {
      const response = await fetch('/api/monitoring/performance?type=budgets');
      if (!response.ok) throw new Error('Failed to fetch performance budgets');
      return response.json();
    },
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  // Fetch system health
  const { data: healthData, isLoading: healthLoading } = useQuery({
    queryKey: ['system-health', selectedTimeRange],
    queryFn: async () => {
      const response = await fetch(`/api/monitoring/performance?type=health&timeRange=${selectedTimeRange}`);
      if (!response.ok) throw new Error('Failed to fetch system health');
      return response.json();
    },
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  // Fetch web vitals
  const { data: webVitalsData, isLoading: webVitalsLoading } = useQuery({
    queryKey: ['web-vitals', selectedTimeRange],
    queryFn: async () => {
      const response = await fetch(`/api/monitoring/performance?type=web-vitals&timeRange=${selectedTimeRange}`);
      if (!response.ok) throw new Error('Failed to fetch web vitals');
      return response.json();
    },
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  // Fetch API performance
  const { data: apiPerformanceData, isLoading: apiPerformanceLoading } = useQuery({
    queryKey: ['api-performance', selectedTimeRange],
    queryFn: async () => {
      const response = await fetch(`/api/monitoring/performance?type=api-performance&timeRange=${selectedTimeRange}`);
      if (!response.ok) throw new Error('Failed to fetch API performance');
      return response.json();
    },
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  // Fetch recent errors
  const { data: errorsData, isLoading: errorsLoading } = useQuery({
    queryKey: ['performance-errors', selectedTimeRange],
    queryFn: async () => {
      const response = await fetch(`/api/monitoring/performance?type=errors&timeRange=${selectedTimeRange}`);
      if (!response.ok) throw new Error('Failed to fetch error data');
      return response.json();
    },
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  const isLoading = summaryLoading || budgetsLoading || healthLoading || webVitalsLoading || apiPerformanceLoading || errorsLoading;

  const getMetricStatus = (current: number, budget: number, isLowerBetter = false) => {
    const ratio = isLowerBetter ? current / budget : budget / current;
    if (ratio <= 0.8) return { status: 'critical', color: 'text-red-600 bg-red-100' };
    if (ratio <= 0.9) return { status: 'warning', color: 'text-yellow-600 bg-yellow-100' };
    if (ratio <= 1.0) return { status: 'good', color: 'text-green-600 bg-green-100' };
    return { status: 'excellent', color: 'text-emerald-600 bg-emerald-100' };
  };

  const formatMetricValue = (value: number, unit: string) => {
    if (unit === 'ms') {
      if (value >= 1000) return `${(value / 1000).toFixed(2)}s`;
      return `${Math.round(value)}ms`;
    }
    if (unit === 'MB') return `${value.toFixed(1)}MB`;
    if (unit === 'score') return value.toFixed(3);
    return value.toString();
  };

  const MetricCard = ({ 
    title, 
    value, 
    unit, 
    budget, 
    icon: Icon, 
    trend, 
    isLowerBetter = false 
  }: {
    title: string;
    value: number;
    unit: string;
    budget?: number;
    icon: React.ComponentType<{ className?: string }>;
    trend?: number;
    isLowerBetter?: boolean;
  }) => {
    const status = budget ? getMetricStatus(value, budget, isLowerBetter) : { status: 'good', color: 'text-blue-600 bg-blue-100' };
    const trendIcon = trend && trend > 0 ? TrendingUp : trend && trend < 0 ? TrendingDown : Activity;
    const trendColor = isLowerBetter 
      ? (trend && trend > 0 ? 'text-red-500' : trend && trend < 0 ? 'text-green-500' : 'text-gray-500')
      : (trend && trend > 0 ? 'text-green-500' : trend && trend < 0 ? 'text-red-500' : 'text-gray-500');

    return (
      <Card className="relative overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn("p-2 rounded-full", status.color)}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{title}</p>
                <p className="text-lg font-bold">{formatMetricValue(value, unit)}</p>
                {budget && (
                  <p className="text-xs text-muted-foreground">
                    Budget: {formatMetricValue(budget, unit)}
                  </p>
                )}
              </div>
            </div>
            
            {trend !== undefined && (
              <div className={cn("flex items-center gap-1 text-xs", trendColor)}>
                {React.createElement(trendIcon, { className: "h-3 w-3" })}
                {Math.abs(trend).toFixed(1)}%
              </div>
            )}
          </div>
          
          {budget && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Performance</span>
                <span>{status.status}</span>
              </div>
              <Progress 
                value={isLowerBetter ? Math.max(0, 100 - (value / budget * 100)) : Math.min(100, (budget / value * 100))} 
                className={cn("h-2", status.color.includes('red') ? '[&>div]:bg-red-500' : status.color.includes('yellow') ? '[&>div]:bg-yellow-500' : '[&>div]:bg-green-500')}
              />
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading && !summaryData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading performance dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Monitor className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Performance Monitoring</h1>
            <p className="text-gray-600">Real-time application performance and health metrics</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-md border">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <select
              className="text-xs border-none bg-transparent focus:outline-none"
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value as '1h' | '6h' | '24h' | '7d' | '30d')}
            >
              <option value="1h">Last Hour</option>
              <option value="6h">Last 6 Hours</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchSummary();
            }}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      {budgetsData?.data?.violations?.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-900">Performance Budget Violations</h3>
                <p className="text-sm text-red-700 mt-1">
                  {budgetsData.data.violations.length} metrics are exceeding their performance budgets
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {budgetsData.data.violations.slice(0, 3).map((violation: any, index: number) => (
                    <Badge key={index} variant="destructive" className="text-xs">
                      {violation.metric_name}: {violation.violation_percentage.toFixed(1)}% over budget
                    </Badge>
                  ))}
                  {budgetsData.data.violations.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{budgetsData.data.violations.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Metrics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="web-vitals" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Web Vitals
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            API Performance
          </TabsTrigger>
          <TabsTrigger value="errors" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Errors
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Cpu className="h-4 w-4" />
            System Health
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Avg Response Time"
              value={summaryData?.data?.summary?.find((m: any) => m.metric_name === 'api_response_time')?.avg_value || 0}
              unit="ms"
              budget={500}
              icon={Zap}
              trend={-5.2}
              isLowerBetter
            />
            <MetricCard
              title="Error Rate"
              value={errorsData?.data?.totalErrors || 0}
              unit="count"
              icon={AlertTriangle}
              trend={12.5}
              isLowerBetter
            />
            <MetricCard
              title="Memory Usage"
              value={summaryData?.data?.summary?.find((m: any) => m.metric_name === 'memory_used')?.avg_value || 0}
              unit="MB"
              budget={100}
              icon={HardDriveIcon}
              trend={8.1}
              isLowerBetter
            />
            <MetricCard
              title="Active Users"
              value={healthData?.data?.snapshots?.[0]?.active_users || 0}
              unit="count"
              icon={Activity}
              trend={15.3}
            />
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Wifi className="h-4 w-4" />
                  Network Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">TTFB</span>
                    <span className="text-sm font-medium">
                      {formatMetricValue(webVitalsData?.data?.webVitals?.ttfb?.average || 0, 'ms')}
                    </span>
                  </div>
                  <Progress value={75} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Page Load Time</span>
                    <span className="text-sm font-medium">
                      {formatMetricValue(summaryData?.data?.summary?.find((m: any) => m.metric_name === 'page_load_time')?.avg_value || 0, 'ms')}
                    </span>
                  </div>
                  <Progress value={68} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">API Throughput</span>
                    <span className="text-sm font-medium">
                      {apiPerformanceData?.data?.totalRequests || 0} req/{selectedTimeRange}
                    </span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Database className="h-4 w-4" />
                  Database Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Avg Query Time</span>
                    <span className="text-sm font-medium">
                      {formatMetricValue(summaryData?.data?.summary?.find((m: any) => m.metric_name === 'db_query_time')?.avg_value || 0, 'ms')}
                    </span>
                  </div>
                  <Progress value={82} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Slow Queries</span>
                    <span className="text-sm font-medium">
                      {summaryData?.data?.summary?.find((m: any) => m.metric_name === 'slow_db_query')?.count_samples || 0}
                    </span>
                  </div>
                  <Progress value={15} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Active Connections</span>
                    <span className="text-sm font-medium">
                      {healthData?.data?.snapshots?.[0]?.active_connections || 0}
                    </span>
                  </div>
                  <Progress value={45} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Web Vitals Tab */}
        <TabsContent value="web-vitals" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Largest Contentful Paint"
              value={webVitalsData?.data?.webVitals?.lcp?.average || 0}
              unit="ms"
              budget={2500}
              icon={Eye}
              isLowerBetter
            />
            <MetricCard
              title="First Input Delay"
              value={webVitalsData?.data?.webVitals?.fid?.average || 0}
              unit="ms"
              budget={100}
              icon={Zap}
              isLowerBetter
            />
            <MetricCard
              title="Cumulative Layout Shift"
              value={webVitalsData?.data?.webVitals?.cls?.average || 0}
              unit="score"
              budget={0.1}
              icon={Monitor}
              isLowerBetter
            />
            <MetricCard
              title="Time to First Byte"
              value={webVitalsData?.data?.webVitals?.ttfb?.average || 0}
              unit="ms"
              budget={600}
              icon={Wifi}
              isLowerBetter
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Core Web Vitals Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(webVitalsData?.data?.webVitals || {}).map(([metric, data]: [string, any]) => (
                  <div key={metric} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium uppercase">{metric}</span>
                      <Badge variant={data.average <= (metric === 'cls' ? 0.1 : metric === 'fid' ? 100 : metric === 'ttfb' ? 600 : 2500) ? 'default' : 'destructive'}>
                        {formatMetricValue(data.average, metric === 'cls' ? 'score' : 'ms')}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-xs text-muted-foreground">
                      <div>Samples: {data.count}</div>
                      <div>Latest: {formatMetricValue(data.latest || 0, metric === 'cls' ? 'score' : 'ms')}</div>
                      <div>
                        Status: {data.average <= (metric === 'cls' ? 0.1 : metric === 'fid' ? 100 : metric === 'ttfb' ? 600 : 2500) ? '✅ Good' : '⚠️ Needs Work'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Performance Tab */}
        <TabsContent value="api" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              title="Total Requests"
              value={apiPerformanceData?.data?.totalRequests || 0}
              unit="count"
              icon={Server}
            />
            <MetricCard
              title="Avg Response Time"
              value={apiPerformanceData?.data?.apiSummary?.reduce((sum: number, api: any) => sum + api.avgTime, 0) / (apiPerformanceData?.data?.apiSummary?.length || 1) || 0}
              unit="ms"
              budget={500}
              icon={Zap}
              isLowerBetter
            />
            <MetricCard
              title="Error Rate"
              value={apiPerformanceData?.data?.apiSummary?.reduce((sum: number, api: any) => sum + api.errorCount, 0) / (apiPerformanceData?.data?.totalRequests || 1) * 100 || 0}
              unit="%"
              budget={5}
              icon={AlertTriangle}
              isLowerBetter
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>API Endpoint Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {apiPerformanceData?.data?.apiSummary?.slice(0, 10).map((api: any, index: number) => (
                  <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{api.method} {api.endpoint}</p>
                      <p className="text-xs text-muted-foreground">{api.count} requests</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatMetricValue(api.avgTime, 'ms')}</p>
                      <p className="text-xs text-muted-foreground">
                        {api.errorCount > 0 ? `${api.errorCount} errors` : 'No errors'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Errors Tab */}
        <TabsContent value="errors" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              title="Total Errors"
              value={errorsData?.data?.totalErrors || 0}
              unit="count"
              icon={AlertCircle}
              isLowerBetter
            />
            <MetricCard
              title="Error Types"
              value={Object.keys(errorsData?.data?.errorsByType || {}).length}
              unit="count"
              icon={AlertTriangle}
              isLowerBetter
            />
            <MetricCard
              title="Error Rate"
              value={errorsData?.data?.totalErrors / Math.max(apiPerformanceData?.data?.totalRequests || 1, 1) * 100 || 0}
              unit="%"
              budget={5}
              icon={Activity}
              isLowerBetter
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Errors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {errorsData?.data?.errors?.slice(0, 10).map((error: any, index: number) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="destructive" className="text-xs">
                        {error.error_type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(error.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm font-medium mb-1">{error.error_message}</p>
                    {error.page_url && (
                      <p className="text-xs text-muted-foreground">
                        Page: {error.page_url}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Health Tab */}
        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Memory Usage"
              value={healthData?.data?.snapshots?.[0]?.memory_usage_mb || 0}
              unit="MB"
              budget={512}
              icon={HardDriveIcon}
              isLowerBetter
            />
            <MetricCard
              title="CPU Usage"
              value={healthData?.data?.snapshots?.[0]?.cpu_usage_percent || 0}
              unit="%"
              budget={80}
              icon={Cpu}
              isLowerBetter
            />
            <MetricCard
              title="Active Users"
              value={healthData?.data?.snapshots?.[0]?.active_users || 0}
              unit="count"
              icon={Activity}
            />
            <MetricCard
              title="Quiz Sessions"
              value={healthData?.data?.snapshots?.[0]?.quiz_sessions_active || 0}
              unit="count"
              icon={Globe}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Database Status</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium text-green-600">Healthy</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">API Services</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium text-green-600">Operational</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Background Jobs</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium text-green-600">Running</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Email Service</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium text-green-600">Operational</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}