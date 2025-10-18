import type { ConvexSlicingMetadata } from '../slice/slicingSlice';

export interface CacheEntry {
  id: string;
  data: any;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
  type: 'image' | 'metadata' | 'computed';
}

export interface CacheConfig {
  maxSize: number; // MB
  maxEntries: number;
  ttl: number; // Time to live in milliseconds
  cleanupInterval: number; // Cleanup interval in milliseconds
}

const defaultConfig: CacheConfig = {
  maxSize: 100, // 100MB
  maxEntries: 1000,
  ttl: 30 * 60 * 1000, // 30 minutes
  cleanupInterval: 5 * 60 * 1000, // 5 minutes
};

export class SliceCache {
  private cache = new Map<string, CacheEntry>();
  private config: CacheConfig;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private currentSize = 0;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.startCleanupTimer();
  }

  /**
   * Store data in cache
   */
  set(key: string, data: any, type: CacheEntry['type'] = 'computed'): void {
    const size = this.calculateSize(data);
    
    // Check if we need to make space
    if (this.currentSize + size > this.config.maxSize * 1024 * 1024) {
      this.evictLRU();
    }

    // Check if we're at max entries
    if (this.cache.size >= this.config.maxEntries) {
      this.evictOldest();
    }

    const entry: CacheEntry = {
      id: key,
      data,
      timestamp: Date.now(),
      accessCount: 0,
      lastAccessed: Date.now(),
      size,
      type,
    };

    this.cache.set(key, entry);
    this.currentSize += size;
  }

  /**
   * Retrieve data from cache
   */
  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.config.ttl) {
      this.delete(key);
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    return entry.data;
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    return entry !== undefined && Date.now() - entry.timestamp <= this.config.ttl;
  }

  /**
   * Delete entry from cache
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (entry) {
      this.currentSize -= entry.size;
      this.cache.delete(key);
      return true;
    }
    return false;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.currentSize = 0;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const entries = Array.from(this.cache.values());
    return {
      size: this.cache.size,
      totalSize: this.currentSize,
      maxSize: this.config.maxSize * 1024 * 1024,
      hitRate: this.calculateHitRate(),
      entriesByType: {
        image: entries.filter(e => e.type === 'image').length,
        metadata: entries.filter(e => e.type === 'metadata').length,
        computed: entries.filter(e => e.type === 'computed').length,
      },
      oldestEntry: Math.min(...entries.map(e => e.timestamp)),
      newestEntry: Math.max(...entries.map(e => e.timestamp)),
    };
  }

  /**
   * Preload slice images
   */
  async preloadSlices(sliceUrls: string[], onProgress?: (progress: number) => void): Promise<void> {
    const total = sliceUrls.length;
    let loaded = 0;

    for (const [index, url] of sliceUrls.entries()) {
      if (this.has(`slice_${index}`)) {
        loaded++;
        onProgress?.(loaded / total);
        continue;
      }

      try {
        const response = await fetch(url);
        const blob = await response.blob();
        this.set(`slice_${index}`, blob, 'image');
        loaded++;
        onProgress?.(loaded / total);
      } catch (error) {
        console.warn(`Failed to preload slice ${index}:`, error);
      }
    }
  }

  /**
   * Cache meniscus computation results
   */
  cacheMeniscusData(physicsParams: any, metadata: ConvexSlicingMetadata, result: any): void {
    const key = `meniscus_${this.hashParams(physicsParams)}`;
    this.set(key, {
      physicsParams,
      metadata,
      result,
      computedAt: Date.now(),
    }, 'computed');
  }

  /**
   * Get cached meniscus data
   */
  getMeniscusData(physicsParams: any): any | null {
    const key = `meniscus_${this.hashParams(physicsParams)}`;
    return this.get(key);
  }

  /**
   * Cache slice metadata
   */
  cacheSliceMetadata(metadata: ConvexSlicingMetadata): void {
    this.set('slice_metadata', metadata, 'metadata');
  }

  /**
   * Get cached slice metadata
   */
  getSliceMetadata(): ConvexSlicingMetadata | null {
    return this.get('slice_metadata');
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Stop cleanup timer
   */
  stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.config.ttl) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.delete(key));
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let lruKey: string | null = null;
    let lruTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < lruTime) {
        lruTime = entry.lastAccessed;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.delete(lruKey);
    }
  }

  /**
   * Evict oldest entry
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
    }
  }

  /**
   * Calculate size of data in bytes
   */
  private calculateSize(data: any): number {
    if (data instanceof Blob) {
      return data.size;
    }
    
    if (typeof data === 'string') {
      return new Blob([data]).size;
    }
    
    if (typeof data === 'object') {
      return new Blob([JSON.stringify(data)]).size;
    }
    
    return 0;
  }

  /**
   * Calculate cache hit rate
   */
  private calculateHitRate(): number {
    const entries = Array.from(this.cache.values());
    const totalAccesses = entries.reduce((sum, entry) => sum + entry.accessCount, 0);
    return totalAccesses > 0 ? totalAccesses / entries.length : 0;
  }

  /**
   * Hash physics parameters for cache key
   */
  private hashParams(params: any): string {
    return btoa(JSON.stringify(params)).replace(/[^a-zA-Z0-9]/g, '');
  }

  /**
   * Destroy cache and cleanup
   */
  destroy(): void {
    this.stopCleanupTimer();
    this.clear();
  }
}

// Global cache instance
export const sliceCache = new SliceCache();
