import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { performanceMonitor } from '@/lib/monitoring/performance-monitor';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { metrics, errors, type } = body;

    const supabase = createRouteHandlerClient({ 
      cookies,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
    });

    // Handle different types of performance data
    switch (type) {
      case 'metrics':
        if (metrics && metrics.length > 0) {
          const { error } = await supabase
            .from('performance_metrics')
            .insert(metrics);

          if (error) {
            throw error;
          }
        }
        break;

      case 'errors':
        if (errors && errors.length > 0) {
          const { error } = await supabase
            .from('error_reports')
            .insert(errors);

          if (error) {
            throw error;
          }
        }
        break;

      case 'web-vitals':
        // Handle Core Web Vitals specifically
        const webVitalsMetrics = Object.entries(body.data || {}).map(([name, value]) => ({
          metric_name: name,
          metric_value: value as number,
          metric_unit: name === 'cls' ? 'score' : 'ms',
          page_url: body.url,
          user_agent: body.userAgent,
          session_id: body.sessionId,
          timestamp: new Date().toISOString()
        }));

        if (webVitalsMetrics.length > 0) {
          const { error } = await supabase
            .from('performance_metrics')
            .insert(webVitalsMetrics);

          if (error) {
            throw error;
          }
        }
        break;

      case 'api-timing':
        // Handle API response time tracking
        const apiData = {
          endpoint: body.endpoint,
          method: body.method || 'GET',
          response_time_ms: body.responseTime,
          status_code: body.statusCode || 200,
          user_id: body.userId,
          session_id: body.sessionId,
          timestamp: new Date().toISOString()
        };

        const { error: apiError } = await supabase
          .from('api_response_times')
          .insert([apiData]);

        if (apiError) {
          throw apiError;
        }
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid monitoring data type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: 'Performance data recorded successfully'
    });

  } catch (error) {
    console.error('Performance monitoring error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record performance data' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ 
      cookies,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
    });

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'summary';
    const timeRange = searchParams.get('timeRange') || '24h';
    
    // Calculate date range
    const now = new Date();
    const hoursBack = {
      '1h': 1,
      '6h': 6,
      '24h': 24,
      '7d': 168,
      '30d': 720
    }[timeRange] || 24;

    const startTime = new Date(now.getTime() - hoursBack * 60 * 60 * 1000);

    switch (type) {
      case 'summary':
        // Get performance summary
        const { data: summary, error: summaryError } = await supabase
          .rpc('get_performance_summary', {
            start_time: startTime.toISOString(),
            end_time: now.toISOString()
          });

        if (summaryError) {
          throw summaryError;
        }

        return NextResponse.json({
          success: true,
          data: {
            summary,
            timeRange,
            generatedAt: now.toISOString()
          }
        });

      case 'budgets':
        // Check performance budgets
        const { data: budgets, error: budgetsError } = await supabase
          .rpc('check_performance_budgets');

        if (budgetsError) {
          throw budgetsError;
        }

        return NextResponse.json({
          success: true,
          data: {
            violations: budgets,
            checkedAt: now.toISOString()
          }
        });

      case 'health':
        // Get recent health snapshots
        const { data: healthData, error: healthError } = await supabase
          .from('system_health_snapshots')
          .select('*')
          .gte('snapshot_time', startTime.toISOString())
          .order('snapshot_time', { ascending: false })
          .limit(100);

        if (healthError) {
          throw healthError;
        }

        return NextResponse.json({
          success: true,
          data: {
            snapshots: healthData,
            timeRange,
            count: healthData?.length || 0
          }
        });

      case 'errors':
        // Get recent error reports
        const { data: errorData, error: errorError } = await supabase
          .from('error_reports')
          .select('*')
          .gte('timestamp', startTime.toISOString())
          .order('timestamp', { ascending: false })
          .limit(100);

        if (errorError) {
          throw errorError;
        }

        // Group errors by type
        const errorsByType = errorData?.reduce((acc: any, error: any) => {
          acc[error.error_type] = (acc[error.error_type] || 0) + 1;
          return acc;
        }, {}) || {};

        return NextResponse.json({
          success: true,
          data: {
            errors: errorData,
            errorsByType,
            totalErrors: errorData?.length || 0,
            timeRange
          }
        });

      case 'web-vitals':
        // Get Core Web Vitals metrics
        const webVitalsMetrics = ['lcp', 'fid', 'cls', 'ttfb'];
        const { data: webVitalsData, error: webVitalsError } = await supabase
          .from('performance_metrics')
          .select('metric_name, metric_value, timestamp')
          .in('metric_name', webVitalsMetrics)
          .gte('timestamp', startTime.toISOString())
          .order('timestamp', { ascending: false });

        if (webVitalsError) {
          throw webVitalsError;
        }

        // Process web vitals data
        const webVitalsSummary = webVitalsMetrics.reduce((acc: any, metric) => {
          const metricData = webVitalsData?.filter(d => d.metric_name === metric) || [];
          acc[metric] = {
            average: metricData.reduce((sum, d) => sum + d.metric_value, 0) / (metricData.length || 1),
            count: metricData.length,
            latest: metricData[0]?.metric_value || null
          };
          return acc;
        }, {});

        return NextResponse.json({
          success: true,
          data: {
            webVitals: webVitalsSummary,
            rawData: webVitalsData,
            timeRange
          }
        });

      case 'api-performance':
        // Get API performance data
        const { data: apiData, error: apiError } = await supabase
          .from('api_response_times')
          .select('endpoint, method, response_time_ms, status_code, timestamp')
          .gte('timestamp', startTime.toISOString())
          .order('timestamp', { ascending: false })
          .limit(1000);

        if (apiError) {
          throw apiError;
        }

        // Group by endpoint
        const apiSummary = apiData?.reduce((acc: any, item: any) => {
          const key = `${item.method} ${item.endpoint}`;
          if (!acc[key]) {
            acc[key] = {
              endpoint: item.endpoint,
              method: item.method,
              count: 0,
              totalTime: 0,
              avgTime: 0,
              minTime: Infinity,
              maxTime: 0,
              errorCount: 0
            };
          }
          
          acc[key].count++;
          acc[key].totalTime += item.response_time_ms;
          acc[key].avgTime = acc[key].totalTime / acc[key].count;
          acc[key].minTime = Math.min(acc[key].minTime, item.response_time_ms);
          acc[key].maxTime = Math.max(acc[key].maxTime, item.response_time_ms);
          
          if (item.status_code >= 400) {
            acc[key].errorCount++;
          }
          
          return acc;
        }, {}) || {};

        return NextResponse.json({
          success: true,
          data: {
            apiSummary: Object.values(apiSummary),
            totalRequests: apiData?.length || 0,
            timeRange
          }
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid monitoring data type' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Performance monitoring fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch performance data' },
      { status: 500 }
    );
  }
}