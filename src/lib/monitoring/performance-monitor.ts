import { createClient } from '@supabase/supabase-js';

// Performance monitoring configuration
interface PerformanceConfig {
  enableMetrics: boolean;
  enableTracing: boolean;
  sampleRate: number; // 0.0 to 1.0
  slowQueryThreshold: number; // milliseconds
  slowApiThreshold: number; // milliseconds
  memoryThreshold: number; // MB
  errorThreshold: number; // error rate percentage
}

interface PerformanceMetric {
  id?: string;
  metric_name: string;
  metric_value: number;
  metric_unit: string;
  user_agent?: string;
  user_id?: string;
  session_id?: string;
  page_url?: string;
  api_endpoint?: string;
  method?: string;
  status_code?: number;
  timestamp: Date;
  additional_data?: Record<string, any>;
}

interface ErrorReport {
  id?: string;
  error_type: string;
  error_message: string;
  stack_trace?: string;
  user_id?: string;
  session_id?: string;
  page_url?: string;
  api_endpoint?: string;
  user_agent?: string;
  timestamp: Date;
  additional_context?: Record<string, any>;
}

export class PerformanceMonitor {
  private supabase;
  private config: PerformanceConfig;
  private metricsBuffer: PerformanceMetric[] = [];
  private errorsBuffer: ErrorReport[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  constructor(config?: Partial<PerformanceConfig>) {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    this.config = {
      enableMetrics: true,
      enableTracing: true,
      sampleRate: 0.1, // 10% sampling
      slowQueryThreshold: 1000, // 1 second
      slowApiThreshold: 500, // 500ms
      memoryThreshold: 100, // 100MB
      errorThreshold: 5, // 5% error rate
      ...config
    };

    if (typeof window !== 'undefined') {
      this.initializeBrowserMonitoring();
    }

    this.startPeriodicFlush();
  }

  // Core Web Vitals monitoring
  measureWebVitals(): void {
    if (typeof window === 'undefined') return;

    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        
        this.recordMetric({
          metric_name: 'lcp',
          metric_value: lastEntry.startTime,
          metric_unit: 'ms',
          page_url: window.location.href,
          timestamp: new Date(),
          additional_data: { element: lastEntry.element?.tagName }
        });
      });

      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (error) {
        console.warn('LCP observer not supported');
      }

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.recordMetric({
            metric_name: 'fid',
            metric_value: entry.processingStart - entry.startTime,
            metric_unit: 'ms',
            page_url: window.location.href,
            timestamp: new Date(),
            additional_data: { eventType: entry.name }
          });
        });
      });

      try {
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (error) {
        console.warn('FID observer not supported');
      }

      // Cumulative Layout Shift (CLS)
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        const entries = list.getEntries();
        
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });

        this.recordMetric({
          metric_name: 'cls',
          metric_value: clsValue,
          metric_unit: 'score',
          page_url: window.location.href,
          timestamp: new Date()
        });
      });

      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (error) {
        console.warn('CLS observer not supported');
      }
    }

    // Time to First Byte (TTFB)
    window.addEventListener('load', () => {
      const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigationTiming) {
        this.recordMetric({
          metric_name: 'ttfb',
          metric_value: navigationTiming.responseStart - navigationTiming.requestStart,
          metric_unit: 'ms',
          page_url: window.location.href,
          timestamp: new Date()
        });

        this.recordMetric({
          metric_name: 'page_load_time',
          metric_value: navigationTiming.loadEventEnd - navigationTiming.fetchStart,
          metric_unit: 'ms',
          page_url: window.location.href,
          timestamp: new Date()
        });
      }
    });
  }

  // API Performance monitoring
  monitorApiCall<T>(
    apiCall: () => Promise<T>,
    endpoint: string,
    method: string = 'GET'
  ): Promise<T> {
    const startTime = performance.now();
    const sessionId = this.getSessionId();

    return apiCall()
      .then((result) => {
        const duration = performance.now() - startTime;
        
        this.recordMetric({
          metric_name: 'api_response_time',
          metric_value: duration,
          metric_unit: 'ms',
          api_endpoint: endpoint,
          method,
          status_code: 200,
          session_id: sessionId,
          timestamp: new Date()
        });

        if (duration > this.config.slowApiThreshold) {
          this.recordMetric({
            metric_name: 'slow_api_call',
            metric_value: duration,
            metric_unit: 'ms',
            api_endpoint: endpoint,
            method,
            timestamp: new Date(),
            additional_data: { threshold: this.config.slowApiThreshold }
          });
        }

        return result;
      })
      .catch((error) => {
        const duration = performance.now() - startTime;
        
        this.recordError({
          error_type: 'api_error',
          error_message: error.message,
          stack_trace: error.stack,
          api_endpoint: endpoint,
          session_id: sessionId,
          timestamp: new Date(),
          additional_context: {
            method,
            duration,
            endpoint
          }
        });

        throw error;
      });
  }

  // Database query performance monitoring
  async monitorDatabaseQuery<T>(
    query: () => Promise<T>,
    queryName: string,
    queryType: 'select' | 'insert' | 'update' | 'delete' = 'select'
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await query();
      const duration = performance.now() - startTime;
      
      this.recordMetric({
        metric_name: 'db_query_time',
        metric_value: duration,
        metric_unit: 'ms',
        timestamp: new Date(),
        additional_data: {
          query_name: queryName,
          query_type: queryType
        }
      });

      if (duration > this.config.slowQueryThreshold) {
        this.recordMetric({
          metric_name: 'slow_db_query',
          metric_value: duration,
          metric_unit: 'ms',
          timestamp: new Date(),
          additional_data: {
            query_name: queryName,
            query_type: queryType,
            threshold: this.config.slowQueryThreshold
          }
        });
      }

      return result;
    } catch (error: any) {
      const duration = performance.now() - startTime;
      
      this.recordError({
        error_type: 'database_error',
        error_message: error.message,
        stack_trace: error.stack,
        timestamp: new Date(),
        additional_context: {
          query_name: queryName,
          query_type: queryType,
          duration
        }
      });

      throw error;
    }
  }

  // Memory usage monitoring
  monitorMemoryUsage(): void {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in (window.performance as any)) {
      const memory = (window.performance as any).memory;
      
      this.recordMetric({
        metric_name: 'memory_used',
        metric_value: memory.usedJSHeapSize / 1024 / 1024,
        metric_unit: 'MB',
        timestamp: new Date(),
        additional_data: {
          total_heap_size: memory.totalJSHeapSize / 1024 / 1024,
          heap_size_limit: memory.jsHeapSizeLimit / 1024 / 1024
        }
      });

      if (memory.usedJSHeapSize / 1024 / 1024 > this.config.memoryThreshold) {
        this.recordMetric({
          metric_name: 'high_memory_usage',
          metric_value: memory.usedJSHeapSize / 1024 / 1024,
          metric_unit: 'MB',
          timestamp: new Date(),
          additional_data: {
            threshold: this.config.memoryThreshold,
            total_heap: memory.totalJSHeapSize / 1024 / 1024
          }
        });
      }
    }

    // Monitor Node.js memory usage (server-side)
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memUsage = process.memoryUsage();
      
      this.recordMetric({
        metric_name: 'server_memory_rss',
        metric_value: memUsage.rss / 1024 / 1024,
        metric_unit: 'MB',
        timestamp: new Date(),
        additional_data: {
          heap_used: memUsage.heapUsed / 1024 / 1024,
          heap_total: memUsage.heapTotal / 1024 / 1024,
          external: memUsage.external / 1024 / 1024
        }
      });
    }
  }

  // User interaction tracking
  trackUserInteraction(action: string, details?: Record<string, any>): void {
    this.recordMetric({
      metric_name: 'user_interaction',
      metric_value: 1,
      metric_unit: 'count',
      page_url: typeof window !== 'undefined' ? window.location.href : undefined,
      session_id: this.getSessionId(),
      timestamp: new Date(),
      additional_data: {
        action,
        ...details
      }
    });
  }

  // Error tracking
  trackError(error: Error, context?: Record<string, any>): void {
    this.recordError({
      error_type: error.name || 'Unknown',
      error_message: error.message,
      stack_trace: error.stack,
      page_url: typeof window !== 'undefined' ? window.location.href : undefined,
      session_id: this.getSessionId(),
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      timestamp: new Date(),
      additional_context: context
    });
  }

  // Performance budget validation
  validatePerformanceBudget(metrics: Record<string, number>): {
    passed: boolean;
    violations: string[];
  } {
    const violations: string[] = [];
    const budgets = {
      lcp: 2500, // ms
      fid: 100,  // ms
      cls: 0.1,  // score
      ttfb: 600, // ms
      page_load_time: 3000 // ms
    };

    Object.entries(budgets).forEach(([metric, budget]) => {
      if (metrics[metric] && metrics[metric] > budget) {
        violations.push(`${metric}: ${metrics[metric]}${metric === 'cls' ? '' : 'ms'} exceeds budget of ${budget}${metric === 'cls' ? '' : 'ms'}`);
      }
    });

    return {
      passed: violations.length === 0,
      violations
    };
  }

  // Initialize browser-specific monitoring
  private initializeBrowserMonitoring(): void {
    // Measure web vitals
    this.measureWebVitals();

    // Monitor unhandled errors
    window.addEventListener('error', (event) => {
      this.trackError(event.error, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // Monitor unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.recordError({
        error_type: 'unhandled_promise_rejection',
        error_message: String(event.reason),
        timestamp: new Date(),
        page_url: window.location.href,
        additional_context: {
          reason: event.reason
        }
      });
    });

    // Monitor page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.recordMetric({
        metric_name: 'page_visibility',
        metric_value: document.hidden ? 0 : 1,
        metric_unit: 'boolean',
        page_url: window.location.href,
        timestamp: new Date()
      });
    });

    // Periodic memory monitoring
    setInterval(() => {
      this.monitorMemoryUsage();
    }, 60000); // Every minute
  }

  // Record performance metric
  private recordMetric(metric: PerformanceMetric): void {
    if (!this.config.enableMetrics || Math.random() > this.config.sampleRate) {
      return;
    }

    // Add session and user context if available
    metric.session_id = metric.session_id || this.getSessionId();
    metric.user_id = metric.user_id || this.getUserId();
    metric.user_agent = metric.user_agent || this.getUserAgent();

    this.metricsBuffer.push(metric);

    // Flush immediately for critical metrics
    const criticalMetrics = ['slow_api_call', 'slow_db_query', 'high_memory_usage'];
    if (criticalMetrics.includes(metric.metric_name)) {
      this.flushMetrics();
    }
  }

  // Record error
  private recordError(error: ErrorReport): void {
    error.session_id = error.session_id || this.getSessionId();
    error.user_id = error.user_id || this.getUserId();
    error.user_agent = error.user_agent || this.getUserAgent();

    this.errorsBuffer.push(error);
    
    // Flush errors immediately
    this.flushErrors();
  }

  // Flush metrics to database
  private async flushMetrics(): Promise<void> {
    if (this.metricsBuffer.length === 0) return;

    const metricsToFlush = [...this.metricsBuffer];
    this.metricsBuffer = [];

    try {
      const { error } = await this.supabase
        .from('performance_metrics')
        .insert(metricsToFlush);

      if (error) {
        console.error('Failed to flush performance metrics:', error);
        // Re-add to buffer for retry
        this.metricsBuffer.push(...metricsToFlush);
      }
    } catch (error) {
      console.error('Error flushing metrics:', error);
      this.metricsBuffer.push(...metricsToFlush);
    }
  }

  // Flush errors to database
  private async flushErrors(): Promise<void> {
    if (this.errorsBuffer.length === 0) return;

    const errorsToFlush = [...this.errorsBuffer];
    this.errorsBuffer = [];

    try {
      const { error } = await this.supabase
        .from('error_reports')
        .insert(errorsToFlush);

      if (error) {
        console.error('Failed to flush error reports:', error);
        this.errorsBuffer.push(...errorsToFlush);
      }
    } catch (error) {
      console.error('Error flushing errors:', error);
      this.errorsBuffer.push(...errorsToFlush);
    }
  }

  // Start periodic buffer flushing
  private startPeriodicFlush(): void {
    this.flushInterval = setInterval(() => {
      this.flushMetrics();
      this.flushErrors();
    }, 30000); // Flush every 30 seconds
  }

  // Helper methods
  private getSessionId(): string {
    if (typeof window !== 'undefined') {
      let sessionId = sessionStorage.getItem('session_id');
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('session_id', sessionId);
      }
      return sessionId;
    }
    return `server_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getUserId(): string | undefined {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('user_id') || undefined;
    }
    return undefined;
  }

  private getUserAgent(): string | undefined {
    return typeof navigator !== 'undefined' ? navigator.userAgent : undefined;
  }

  // Cleanup
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    
    // Final flush
    this.flushMetrics();
    this.flushErrors();
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();