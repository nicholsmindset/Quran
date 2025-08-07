'use client';

import { useEffect, useRef } from 'react';
import { performanceMonitor } from '@/lib/monitoring/performance-monitor';

interface UsePerformanceMonitoringOptions {
  enabled?: boolean;
  trackWebVitals?: boolean;
  trackUserInteractions?: boolean;
  trackErrors?: boolean;
  sampleRate?: number; // 0.0 to 1.0
}

export function usePerformanceMonitoring(options: UsePerformanceMonitoringOptions = {}) {
  const {
    enabled = true,
    trackWebVitals = true,
    trackUserInteractions = true,
    trackErrors = true,
    sampleRate = 0.1
  } = options;

  const isInitialized = useRef(false);

  useEffect(() => {
    if (!enabled || isInitialized.current || typeof window === 'undefined') {
      return;
    }

    isInitialized.current = true;

    // Initialize performance monitoring
    if (trackWebVitals) {
      performanceMonitor.measureWebVitals();
    }

    // Track page navigation
    const handleRouteChange = () => {
      performanceMonitor.trackUserInteraction('page_navigation', {
        url: window.location.href,
        timestamp: new Date().toISOString()
      });
    };

    // Track click interactions
    const handleClick = (event: MouseEvent) => {
      if (!trackUserInteractions || Math.random() > sampleRate) return;

      const target = event.target as HTMLElement;
      const tagName = target.tagName.toLowerCase();
      const elementClass = target.className;
      const elementId = target.id;
      
      performanceMonitor.trackUserInteraction('click', {
        tagName,
        className: elementClass,
        id: elementId,
        x: event.clientX,
        y: event.clientY
      });
    };

    // Track form submissions
    const handleSubmit = (event: SubmitEvent) => {
      if (!trackUserInteractions || Math.random() > sampleRate) return;

      const form = event.target as HTMLFormElement;
      performanceMonitor.trackUserInteraction('form_submit', {
        formId: form.id,
        formClass: form.className,
        action: form.action
      });
    };

    // Track scroll depth
    let maxScrollDepth = 0;
    const handleScroll = () => {
      if (!trackUserInteractions || Math.random() > sampleRate * 10) return; // Lower sample rate for scroll

      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const docHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
      );
      const winHeight = window.innerHeight;
      const scrollPercent = Math.round((scrollTop / (docHeight - winHeight)) * 100);

      if (scrollPercent > maxScrollDepth) {
        maxScrollDepth = scrollPercent;
        performanceMonitor.trackUserInteraction('scroll_depth', {
          depth: scrollPercent,
          maxDepth: maxScrollDepth
        });
      }
    };

    // Track visibility changes
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      performanceMonitor.trackUserInteraction('visibility_change', {
        visible: isVisible,
        timestamp: new Date().toISOString()
      });
    };

    // Add event listeners
    if (typeof window !== 'undefined') {
      // Navigation tracking (for SPA)
      window.addEventListener('popstate', handleRouteChange);
      
      if (trackUserInteractions) {
        document.addEventListener('click', handleClick, { passive: true });
        document.addEventListener('submit', handleSubmit);
        window.addEventListener('scroll', handleScroll, { passive: true });
        document.addEventListener('visibilitychange', handleVisibilityChange);
      }
    }

    // Cleanup function
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('popstate', handleRouteChange);
        
        if (trackUserInteractions) {
          document.removeEventListener('click', handleClick);
          document.removeEventListener('submit', handleSubmit);
          window.removeEventListener('scroll', handleScroll);
          document.removeEventListener('visibilitychange', handleVisibilityChange);
        }
      }
      
      // Clean up performance monitor
      performanceMonitor.destroy();
    };
  }, [enabled, trackWebVitals, trackUserInteractions, trackErrors, sampleRate]);

  // Return methods for manual tracking
  return {
    trackUserInteraction: performanceMonitor.trackUserInteraction.bind(performanceMonitor),
    trackError: performanceMonitor.trackError.bind(performanceMonitor),
    monitorApiCall: performanceMonitor.monitorApiCall.bind(performanceMonitor),
    monitorDatabaseQuery: performanceMonitor.monitorDatabaseQuery.bind(performanceMonitor),
    validatePerformanceBudget: performanceMonitor.validatePerformanceBudget.bind(performanceMonitor),
    
    // Helper method to track quiz interactions specifically
    trackQuizInteraction: (action: string, questionId?: string, details?: Record<string, any>) => {
      performanceMonitor.trackUserInteraction('quiz_interaction', {
        action,
        questionId,
        ...details
      });
    },

    // Helper method to track learning progress
    trackLearningEvent: (event: string, data: Record<string, any>) => {
      performanceMonitor.trackUserInteraction('learning_event', {
        event,
        ...data
      });
    }
  };
}