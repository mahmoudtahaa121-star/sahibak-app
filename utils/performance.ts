/**
 * Performance Monitoring Utility
 * Tracks and logs performance metrics for the application
 */

type PerformanceMetric = {
  name: string;
  duration: number;
  timestamp: number;
  type: 'render' | 'api' | 'navigation' | 'custom';
  metadata?: Record<string, unknown>;
};

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private timers: Map<string, number> = new Map();
  private isEnabled: boolean = __DEV__; // Only enabled in development

  /**
   * Start measuring a performance metric
   */
  startTimer(name: string): void {
    if (!this.isEnabled) return;
    this.timers.set(name, performance.now());
  }

  /**
   * Stop measuring and record a performance metric
   */
  endTimer(name: string, type: PerformanceMetric['type'] = 'custom', metadata?: Record<string, unknown>): void {
    if (!this.isEnabled) return;
    
    const startTime = this.timers.get(name);
    if (!startTime) {
      console.warn(`Performance timer "${name}" was not started`);
      return;
    }

    const duration = performance.now() - startTime;
    this.recordMetric(name, duration, type, metadata);
    this.timers.delete(name);
  }

  /**
   * Record a performance metric directly
   */
  recordMetric(name: string, duration: number, type: PerformanceMetric['type'] = 'custom', metadata?: Record<string, unknown>): void {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: Date.now(),
      type,
      metadata,
    };

    this.metrics.push(metric);
    this.logMetric(metric);

    // Alert on slow performance
    this.checkPerformanceThreshold(metric);
  }

  /**
   * Log a performance metric to console
   */
  private logMetric(metric: PerformanceMetric): void {
    const emoji = this.getMetricEmoji(metric.type);
    console.log(
      `${emoji} [Performance] ${metric.type.toUpperCase()}: ${metric.name} - ${metric.duration.toFixed(2)}ms`,
      metric.metadata || ''
    );
  }

  /**
   * Check if metric exceeds performance threshold
   */
  private checkPerformanceThreshold(metric: PerformanceMetric): void {
    const thresholds = {
      render: 16, // 60fps = 16ms per frame
      api: 1000, // 1 second
      navigation: 500, // 500ms
      custom: 100, // 100ms
    };

    const threshold = thresholds[metric.type];
    if (metric.duration > threshold) {
      console.warn(
        `⚠️ [Performance Warning] ${metric.name} exceeded threshold: ${metric.duration.toFixed(2)}ms > ${threshold}ms`
      );
    }
  }

  /**
   * Get emoji for metric type
   */
  private getMetricEmoji(type: PerformanceMetric['type']): string {
    const emojis = {
      render: '🎨',
      api: '🌐',
      navigation: '🧭',
      custom: '⚡',
    };
    return emojis[type];
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics by type
   */
  getMetricsByType(type: PerformanceMetric['type']): PerformanceMetric[] {
    return this.metrics.filter(metric => metric.type === type);
  }

  /**
   * Get metrics by name
   */
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter(metric => metric.name === name);
  }

  /**
   * Get average duration for a metric name
   */
  getAverageDuration(name: string): number {
    const metrics = this.getMetricsByName(name);
    if (metrics.length === 0) return 0;
    
    const total = metrics.reduce((sum, metric) => sum + metric.duration, 0);
    return total / metrics.length;
  }

  /**
   * Get performance summary
   */
  getSummary(): {
    totalMetrics: number;
    averageRenderTime: number;
    averageApiTime: number;
    averageNavigationTime: number;
    slowMetrics: PerformanceMetric[];
  } {
    const renderMetrics = this.getMetricsByType('render');
    const apiMetrics = this.getMetricsByType('api');
    const navigationMetrics = this.getMetricsByType('navigation');
    
    const averageRenderTime = renderMetrics.length > 0
      ? renderMetrics.reduce((sum, m) => sum + m.duration, 0) / renderMetrics.length
      : 0;
    
    const averageApiTime = apiMetrics.length > 0
      ? apiMetrics.reduce((sum, m) => sum + m.duration, 0) / apiMetrics.length
      : 0;
    
    const averageNavigationTime = navigationMetrics.length > 0
      ? navigationMetrics.reduce((sum, m) => sum + m.duration, 0) / navigationMetrics.length
      : 0;

    // Slow metrics (exceeding thresholds)
    const slowMetrics = this.metrics.filter(metric => {
      const thresholds = {
        render: 16,
        api: 1000,
        navigation: 500,
        custom: 100,
      };
      return metric.duration > thresholds[metric.type];
    });

    return {
      totalMetrics: this.metrics.length,
      averageRenderTime,
      averageApiTime,
      averageNavigationTime,
      slowMetrics,
    };
  }

  /**
   * Clear all recorded metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    this.timers.clear();
  }

  /**
   * Enable/disable performance monitoring
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Print performance summary to console
   */
  printSummary(): void {
    if (!this.isEnabled) return;
    
    const summary = this.getSummary();
    console.log('📊 Performance Summary:', {
      totalMetrics: summary.totalMetrics,
      averageRenderTime: `${summary.averageRenderTime.toFixed(2)}ms`,
      averageApiTime: `${summary.averageApiTime.toFixed(2)}ms`,
      averageNavigationTime: `${summary.averageNavigationTime.toFixed(2)}ms`,
      slowMetricsCount: summary.slowMetrics.length,
    });

    if (summary.slowMetrics.length > 0) {
      console.warn('⚠️ Slow Metrics:', summary.slowMetrics.map(m => ({
        name: m.name,
        duration: `${m.duration.toFixed(2)}ms`,
        type: m.type,
      })));
    }
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Convenience functions
export const startPerf = (name: string) => performanceMonitor.startTimer(name);
export const endPerf = (name: string, type?: PerformanceMetric['type'], metadata?: Record<string, unknown>) => 
  performanceMonitor.endTimer(name, type, metadata);
export const recordPerf = (name: string, duration: number, type?: PerformanceMetric['type'], metadata?: Record<string, unknown>) => 
  performanceMonitor.recordMetric(name, duration, type, metadata);
export const getPerfSummary = () => performanceMonitor.getSummary();
export const printPerfSummary = () => performanceMonitor.printSummary();
export const clearPerfMetrics = () => performanceMonitor.clearMetrics();
