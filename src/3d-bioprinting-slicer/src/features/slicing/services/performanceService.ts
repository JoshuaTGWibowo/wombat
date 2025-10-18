/**
 * Performance monitoring and testing service for convex slicing
 * Provides metrics, optimization suggestions, and performance testing
 */

export interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  cacheHitRate: number;
  apiResponseTime: number;
  frameRate: number;
  bundleSize: number;
  loadTime: number;
}

export interface PerformanceThresholds {
  maxRenderTime: number; // ms
  maxMemoryUsage: number; // MB
  minCacheHitRate: number; // percentage
  maxApiResponseTime: number; // ms
  minFrameRate: number; // fps
  maxBundleSize: number; // KB
  maxLoadTime: number; // ms
}

export interface PerformanceReport {
  score: number;
  metrics: PerformanceMetrics;
  issues: string[];
  recommendations: string[];
  optimizations: string[];
}

const defaultThresholds: PerformanceThresholds = {
  maxRenderTime: 100,
  maxMemoryUsage: 100,
  minCacheHitRate: 80,
  maxApiResponseTime: 2000,
  minFrameRate: 30,
  maxBundleSize: 500,
  maxLoadTime: 3000,
};

export class PerformanceService {
  private metrics: Partial<PerformanceMetrics> = {};
  private thresholds: PerformanceThresholds;
  private observers: Map<string, PerformanceObserver> = new Map();
  private isMonitoring = false;

  constructor(thresholds: Partial<PerformanceThresholds> = {}) {
    this.thresholds = { ...defaultThresholds, ...thresholds };
  }

  /**
   * Start performance monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.setupPerformanceObservers();
    this.startMemoryMonitoring();
    this.startFrameRateMonitoring();
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }

  /**
   * Setup performance observers
   */
  private setupPerformanceObservers(): void {
    // Navigation timing
    if ('PerformanceObserver' in window) {
      const navigationObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'navigation') {
            this.metrics.loadTime = entry.duration;
          }
        });
      });
      navigationObserver.observe({ entryTypes: ['navigation'] });
      this.observers.set('navigation', navigationObserver);
    }

    // Resource timing
    if ('PerformanceObserver' in window) {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'resource') {
            this.metrics.apiResponseTime = entry.duration;
          }
        });
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.set('resource', resourceObserver);
    }
  }

  /**
   * Start memory monitoring
   */
  private startMemoryMonitoring(): void {
    const perf = performance as Performance & { memory?: { usedJSHeapSize: number } };
    if (!perf.memory) return;

    const monitorMemory = () => {
      if (this.isMonitoring && perf.memory) {
        this.metrics.memoryUsage = perf.memory.usedJSHeapSize / (1024 * 1024);
        setTimeout(monitorMemory, 1000);
      }
    };

    monitorMemory();
  }

  /**
   * Start frame rate monitoring
   */
  private startFrameRateMonitoring(): void {
    let lastTime = performance.now();
    let frameCount = 0;
    let fps = 0;

    const measureFrameRate = (currentTime: number) => {
      frameCount++;
      
      if (currentTime - lastTime >= 1000) {
        fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        this.metrics.frameRate = fps;
        frameCount = 0;
        lastTime = currentTime;
      }

      if (this.isMonitoring) {
        requestAnimationFrame(measureFrameRate);
      }
    };

    requestAnimationFrame(measureFrameRate);
  }

  /**
   * Measure render time for a component
   */
  measureRenderTime<T>(componentName: string, renderFn: () => T): T {
    const startTime = performance.now();
    const result = renderFn();
    const endTime = performance.now();
    
    const renderTime = endTime - startTime;
    this.metrics.renderTime = renderTime;
    
    if (renderTime > this.thresholds.maxRenderTime) {
      console.warn(`Slow render detected for ${componentName}: ${renderTime}ms`);
    }
    
    return result;
  }

  /**
   * Measure API call performance
   */
  async measureApiCall<T>(apiName: string, apiCall: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await apiCall();
      const endTime = performance.now();
      
      const responseTime = endTime - startTime;
      this.metrics.apiResponseTime = responseTime;
      
      if (responseTime > this.thresholds.maxApiResponseTime) {
        console.warn(`Slow API call detected for ${apiName}: ${responseTime}ms`);
      }
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      console.error(`API call failed for ${apiName} after ${responseTime}ms:`, error);
      throw error;
    }
  }

  /**
   * Update cache hit rate
   */
  updateCacheHitRate(hitRate: number): void {
    this.metrics.cacheHitRate = hitRate;
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return {
      renderTime: this.metrics.renderTime || 0,
      memoryUsage: this.metrics.memoryUsage || 0,
      cacheHitRate: this.metrics.cacheHitRate || 0,
      apiResponseTime: this.metrics.apiResponseTime || 0,
      frameRate: this.metrics.frameRate || 0,
      bundleSize: this.getBundleSize(),
      loadTime: this.metrics.loadTime || 0,
    };
  }

  /**
   * Get bundle size (approximate)
   */
  private getBundleSize(): number {
    // This is a simplified implementation
    // In a real app, you would get this from webpack stats or similar
    const scripts = document.querySelectorAll('script[src]');
    let totalSize = 0;
    
    scripts.forEach(script => {
      const src = script.getAttribute('src');
      if (src && src.includes('chunk')) {
        // Approximate size based on common chunk sizes
        totalSize += 100; // KB
      }
    });
    
    return totalSize;
  }

  /**
   * Generate performance report
   */
  generateReport(): PerformanceReport {
    const metrics = this.getMetrics();
    const issues: string[] = [];
    const recommendations: string[] = [];
    const optimizations: string[] = [];

    // Check render time
    if (metrics.renderTime > this.thresholds.maxRenderTime) {
      issues.push(`Slow render time: ${metrics.renderTime}ms (threshold: ${this.thresholds.maxRenderTime}ms)`);
      recommendations.push('Consider using React.memo() for expensive components');
      optimizations.push('Implement virtual scrolling for large lists');
    }

    // Check memory usage
    if (metrics.memoryUsage > this.thresholds.maxMemoryUsage) {
      issues.push(`High memory usage: ${metrics.memoryUsage.toFixed(1)}MB (threshold: ${this.thresholds.maxMemoryUsage}MB)`);
      recommendations.push('Implement memory cleanup and garbage collection');
      optimizations.push('Use object pooling for frequently created objects');
    }

    // Check cache hit rate
    if (metrics.cacheHitRate < this.thresholds.minCacheHitRate) {
      issues.push(`Low cache hit rate: ${metrics.cacheHitRate}% (threshold: ${this.thresholds.minCacheHitRate}%)`);
      recommendations.push('Optimize cache strategy and increase cache size');
      optimizations.push('Implement predictive caching based on user behavior');
    }

    // Check API response time
    if (metrics.apiResponseTime > this.thresholds.maxApiResponseTime) {
      issues.push(`Slow API response: ${metrics.apiResponseTime}ms (threshold: ${this.thresholds.maxApiResponseTime}ms)`);
      recommendations.push('Implement API response caching and request batching');
      optimizations.push('Use CDN for static assets and implement compression');
    }

    // Check frame rate
    if (metrics.frameRate < this.thresholds.minFrameRate) {
      issues.push(`Low frame rate: ${metrics.frameRate}fps (threshold: ${this.thresholds.minFrameRate}fps)`);
      recommendations.push('Optimize animations and reduce DOM manipulations');
      optimizations.push('Use CSS transforms instead of changing layout properties');
    }

    // Check bundle size
    if (metrics.bundleSize > this.thresholds.maxBundleSize) {
      issues.push(`Large bundle size: ${metrics.bundleSize}KB (threshold: ${this.thresholds.maxBundleSize}KB)`);
      recommendations.push('Implement code splitting and lazy loading');
      optimizations.push('Remove unused dependencies and optimize imports');
    }

    // Check load time
    if (metrics.loadTime > this.thresholds.maxLoadTime) {
      issues.push(`Slow load time: ${metrics.loadTime}ms (threshold: ${this.thresholds.maxLoadTime}ms)`);
      recommendations.push('Optimize initial bundle and implement preloading');
      optimizations.push('Use service workers for caching and offline support');
    }

    // Calculate performance score
    const score = Math.max(0, 100 - (issues.length * 15));

    return {
      score,
      metrics,
      issues,
      recommendations,
      optimizations,
    };
  }

  /**
   * Run performance tests
   */
  async runPerformanceTests(): Promise<{
    passed: boolean;
    results: Record<string, { passed: boolean; value: number; threshold: number }>;
  }> {
    const metrics = this.getMetrics();
    const results: Record<string, { passed: boolean; value: number; threshold: number }> = {};

    // Test render time
    results.renderTime = {
      passed: metrics.renderTime <= this.thresholds.maxRenderTime,
      value: metrics.renderTime,
      threshold: this.thresholds.maxRenderTime,
    };

    // Test memory usage
    results.memoryUsage = {
      passed: metrics.memoryUsage <= this.thresholds.maxMemoryUsage,
      value: metrics.memoryUsage,
      threshold: this.thresholds.maxMemoryUsage,
    };

    // Test cache hit rate
    results.cacheHitRate = {
      passed: metrics.cacheHitRate >= this.thresholds.minCacheHitRate,
      value: metrics.cacheHitRate,
      threshold: this.thresholds.minCacheHitRate,
    };

    // Test API response time
    results.apiResponseTime = {
      passed: metrics.apiResponseTime <= this.thresholds.maxApiResponseTime,
      value: metrics.apiResponseTime,
      threshold: this.thresholds.maxApiResponseTime,
    };

    // Test frame rate
    results.frameRate = {
      passed: metrics.frameRate >= this.thresholds.minFrameRate,
      value: metrics.frameRate,
      threshold: this.thresholds.minFrameRate,
    };

    // Test bundle size
    results.bundleSize = {
      passed: metrics.bundleSize <= this.thresholds.maxBundleSize,
      value: metrics.bundleSize,
      threshold: this.thresholds.maxBundleSize,
    };

    // Test load time
    results.loadTime = {
      passed: metrics.loadTime <= this.thresholds.maxLoadTime,
      value: metrics.loadTime,
      threshold: this.thresholds.maxLoadTime,
    };

    const passed = Object.values(results).every(result => result.passed);

    return { passed, results };
  }

  /**
   * Get optimization suggestions
   */
  getOptimizationSuggestions(): string[] {
    const suggestions: string[] = [];
    const metrics = this.getMetrics();

    if (metrics.renderTime > 50) {
      suggestions.push('Consider using React.memo() for expensive components');
      suggestions.push('Implement virtual scrolling for large datasets');
      suggestions.push('Use useMemo() for expensive calculations');
    }

    if (metrics.memoryUsage > 50) {
      suggestions.push('Implement proper cleanup in useEffect hooks');
      suggestions.push('Use object pooling for frequently created objects');
      suggestions.push('Consider lazy loading for heavy components');
    }

    if (metrics.frameRate < 60) {
      suggestions.push('Use CSS transforms instead of changing layout properties');
      suggestions.push('Implement requestAnimationFrame for smooth animations');
      suggestions.push('Reduce the number of DOM manipulations');
    }

    if (metrics.apiResponseTime > 1000) {
      suggestions.push('Implement API response caching');
      suggestions.push('Use request batching to reduce API calls');
      suggestions.push('Consider implementing offline support');
    }

    return suggestions;
  }
}

// Global performance service instance
export const performanceService = new PerformanceService();
