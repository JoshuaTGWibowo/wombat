/**
 * Accessibility service for convex slicing components
 * Provides ARIA labels, keyboard navigation, and screen reader support
 */

export interface AccessibilityConfig {
  announceChanges: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
}

export interface AriaLabels {
  slicingMode: string;
  physicsParams: string;
  sliceViewer: string;
  meniscus3D: string;
  exportDialog: string;
  errorBoundary: string;
}

const defaultAriaLabels: AriaLabels = {
  slicingMode: 'Slicing mode: Convex (physics-based meniscus modeling).',
  physicsParams: 'Physics parameters panel. Configure advanced meniscus modeling settings including surface tension, density, and contact angle.',
  sliceViewer: 'Slice viewer. Navigate through generated slices using arrow keys or playback controls. Use spacebar to play/pause.',
  meniscus3D: '3D meniscus visualization. Interactive 3D model showing the meniscus profile based on physics parameters. Use mouse or touch to rotate and zoom.',
  exportDialog: 'Export dialog. Configure export settings including format, quality, and metadata options.',
  errorBoundary: 'Error boundary. Displays error information and recovery options when slicing components encounter issues.',
};

export class AccessibilityService {
  private config: AccessibilityConfig;
  private labels: AriaLabels;
  private announcementQueue: string[] = [];
  private isAnnouncing = false;

  constructor(config: Partial<AccessibilityConfig> = {}, labels: Partial<AriaLabels> = {}) {
    this.config = {
      announceChanges: true,
      highContrast: false,
      reducedMotion: false,
      screenReader: false,
      keyboardNavigation: true,
      ...config,
    };
    this.labels = { ...defaultAriaLabels, ...labels };
    this.detectCapabilities();
  }

  /**
   * Detect user capabilities and preferences
   */
  private detectCapabilities(): void {
    // Detect reduced motion preference
    this.config.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Detect high contrast preference
    this.config.highContrast = window.matchMedia('(prefers-contrast: high)').matches;
    
    // Detect screen reader (basic detection)
    this.config.screenReader = this.detectScreenReader();
    
    // Listen for preference changes
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      this.config.reducedMotion = e.matches;
    });
    
    window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
      this.config.highContrast = e.matches;
    });
  }

  /**
   * Basic screen reader detection
   */
  private detectScreenReader(): boolean {
    // Check for common screen reader indicators
    const hasScreenReader = (
      'speechSynthesis' in window ||
      'speechRecognition' in window ||
      navigator.userAgent.includes('NVDA') ||
      navigator.userAgent.includes('JAWS') ||
      navigator.userAgent.includes('VoiceOver')
    );
    
    return hasScreenReader;
  }

  /**
   * Announce changes to screen readers
   */
  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.config.announceChanges || !this.config.screenReader) return;

    this.announcementQueue.push(message);
    this.processAnnouncementQueue(priority);
  }

  /**
   * Process announcement queue
   */
  private async processAnnouncementQueue(priority: 'polite' | 'assertive'): Promise<void> {
    if (this.isAnnouncing || this.announcementQueue.length === 0) return;

    this.isAnnouncing = true;
    const message = this.announcementQueue.shift()!;

    // Create live region for announcements
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.style.position = 'absolute';
    liveRegion.style.left = '-10000px';
    liveRegion.style.width = '1px';
    liveRegion.style.height = '1px';
    liveRegion.style.overflow = 'hidden';
    
    document.body.appendChild(liveRegion);
    liveRegion.textContent = message;

    // Clean up after announcement
    setTimeout(() => {
      document.body.removeChild(liveRegion);
      this.isAnnouncing = false;
      this.processAnnouncementQueue(priority);
    }, 1000);
  }

  /**
   * Get ARIA labels for components
   */
  getAriaLabels(): AriaLabels {
    return this.labels;
  }

  /**
   * Get accessibility configuration
   */
  getConfig(): AccessibilityConfig {
    return this.config;
  }

  /**
   * Update accessibility configuration
   */
  updateConfig(updates: Partial<AccessibilityConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Update ARIA labels
   */
  updateLabels(updates: Partial<AriaLabels>): void {
    this.labels = { ...this.labels, ...updates };
  }

  /**
   * Generate keyboard navigation instructions
   */
  getKeyboardInstructions(component: keyof AriaLabels): string {
    const instructions: Record<keyof AriaLabels, string> = {
      slicingMode: 'Use Tab to navigate between mode options. Press Enter or Space to select. Use arrow keys to switch between modes.',
      physicsParams: 'Use Tab to navigate between parameter fields. Use arrow keys to adjust slider values. Press Enter to confirm changes.',
      sliceViewer: 'Use arrow keys to navigate between slices. Press Space to play/pause. Use Page Up/Down for faster navigation. Press Escape to exit fullscreen.',
      meniscus3D: 'Use mouse to rotate (click and drag) and zoom (scroll wheel). Use keyboard arrow keys for rotation. Press R to reset view.',
      exportDialog: 'Use Tab to navigate between options. Use arrow keys to change format and quality settings. Press Enter to confirm export.',
      errorBoundary: 'Use Tab to navigate between error details and recovery options. Press Enter to retry or Escape to dismiss.',
    };

    return instructions[component] || '';
  }

  /**
   * Generate focus management instructions
   */
  getFocusInstructions(component: string): string {
    const instructions: Record<string, string> = {
      'slicing-mode-selector': 'Focus is on the mode selector. Convex mode is selected and is the only available mode.',
      'physics-params-form': 'Focus is on the physics parameters form. Use Tab to navigate between fields.',
      'slice-viewer': 'Focus is on the slice viewer. Use arrow keys to navigate slices, Space to play/pause.',
      'meniscus-3d': 'Focus is on the 3D meniscus visualization. Use mouse to interact or keyboard for basic controls.',
      'export-dialog': 'Focus is on the export dialog. Use Tab to navigate options, Enter to confirm.',
    };

    return instructions[component] || '';
  }

  /**
   * Check if motion should be reduced
   */
  shouldReduceMotion(): boolean {
    return this.config.reducedMotion;
  }

  /**
   * Check if high contrast is preferred
   */
  shouldUseHighContrast(): boolean {
    return this.config.highContrast;
  }

  /**
   * Get color contrast recommendations
   */
  getContrastRecommendations(): Record<string, string> {
    return {
      primary: this.config.highContrast ? '#FFFFFF' : '#8B5CF6',
      secondary: this.config.highContrast ? '#000000' : '#00d4ff',
      background: this.config.highContrast ? '#000000' : '#121212',
      surface: this.config.highContrast ? '#FFFFFF' : '#171717',
      text: this.config.highContrast ? '#FFFFFF' : '#E5E7EB',
      error: this.config.highContrast ? '#FF0000' : '#ff453a',
      warning: this.config.highContrast ? '#FFFF00' : '#ffd60a',
      success: this.config.highContrast ? '#00FF00' : '#30d158',
    };
  }

  /**
   * Generate accessibility report
   */
  generateAccessibilityReport(): {
    score: number;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check for common accessibility issues
    if (!this.config.screenReader) {
      recommendations.push('Consider testing with a screen reader for better accessibility');
    }

    if (!this.config.keyboardNavigation) {
      issues.push('Keyboard navigation is disabled');
    }

    if (this.config.reducedMotion) {
      recommendations.push('Animations are reduced for users with motion sensitivity');
    }

    if (this.config.highContrast) {
      recommendations.push('High contrast mode is enabled for better visibility');
    }

    // Calculate accessibility score
    const score = Math.max(0, 100 - (issues.length * 20));

    return {
      score,
      issues,
      recommendations,
    };
  }
}

// Global accessibility service instance
export const accessibilityService = new AccessibilityService();
