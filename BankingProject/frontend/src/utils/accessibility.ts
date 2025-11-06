// Accessibility utilities and helpers

// Announce content to screen readers
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite'): void => {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.style.position = 'absolute';
  announcement.style.left = '-10000px';
  announcement.style.width = '1px';
  announcement.style.height = '1px';
  announcement.style.overflow = 'hidden';
  
  document.body.appendChild(announcement);
  
  // Add message with slight delay to ensure screen reader picks it up
  setTimeout(() => {
    announcement.textContent = message;
  }, 100);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

// Focus management utilities
export const focusManagement = {
  // Focus an element with optional delay
  focusElement: (element: HTMLElement | null, delay: number = 0): void => {
    if (!element) return;
    
    if (delay > 0) {
      setTimeout(() => {
        element.focus();
      }, delay);
    } else {
      element.focus();
    }
  },

  // Focus first focusable element in a container
  focusFirstFocusable: (container: HTMLElement): void => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length > 0) {
      (focusableElements[0] as HTMLElement).focus();
    }
  },

  // Focus last focusable element in a container
  focusLastFocusable: (container: HTMLElement): void => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length > 0) {
      (focusableElements[focusableElements.length - 1] as HTMLElement).focus();
    }
  },

  // Trap focus within a container
  trapFocus: (container: HTMLElement): (() => void) => {
    const focusableElements = Array.from(
      container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ) as HTMLElement[];

    if (focusableElements.length === 0) return () => {};

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    
    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  },

  // Restore focus to a previously focused element
  restoreFocus: (previousFocus: HTMLElement | null): void => {
    if (previousFocus && typeof previousFocus.focus === 'function') {
      previousFocus.focus();
    }
  }
};

// Keyboard navigation utilities
export const keyboardNavigation = {
  // Handle arrow key navigation in lists
  handleArrowKeys: (
    event: KeyboardEvent,
    currentIndex: number,
    itemCount: number,
    onNavigate: (newIndex: number) => void,
    isHorizontal: boolean = false
  ): void => {
    const key = event.key;
    let newIndex = currentIndex;

    if (isHorizontal) {
      switch (key) {
        case 'ArrowLeft':
          newIndex = currentIndex > 0 ? currentIndex - 1 : itemCount - 1;
          break;
        case 'ArrowRight':
          newIndex = currentIndex < itemCount - 1 ? currentIndex + 1 : 0;
          break;
        default:
          return;
      }
    } else {
      switch (key) {
        case 'ArrowUp':
          newIndex = currentIndex > 0 ? currentIndex - 1 : itemCount - 1;
          break;
        case 'ArrowDown':
          newIndex = currentIndex < itemCount - 1 ? currentIndex + 1 : 0;
          break;
        default:
          return;
      }
    }

    if (newIndex !== currentIndex) {
      event.preventDefault();
      onNavigate(newIndex);
    }
  },

  // Handle Enter/Space key activation
  handleActivation: (event: KeyboardEvent, onActivate: () => void): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onActivate();
    }
  },

  // Handle Escape key
  handleEscape: (event: KeyboardEvent, onEscape: () => void): void => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onEscape();
    }
  }
};

// ARIA utilities
export const ariaUtils = {
  // Generate unique IDs for ARIA attributes
  generateId: (prefix: string = 'id'): string => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  },

  // Create ARIA label for form fields
  createFieldLabel: (label: string, error?: string, required?: boolean): string => {
    let ariaLabel = label;
    if (required) ariaLabel += ' (required)';
    if (error) ariaLabel += `, Error: ${error}`;
    return ariaLabel;
  },

  // Create ARIA description for complex components
  createAriaDescription: (description: string, additionalInfo?: string): string => {
    return additionalInfo ? `${description}. ${additionalInfo}` : description;
  }
};

// Color contrast utilities
export const colorContrast = {
  // Calculate relative luminance
  getLuminance: (color: string): number => {
    // Convert hex to RGB
    const rgb = color.match(/\w\w/g)?.map(x => parseInt(x, 16)) || [0, 0, 0];
    
    // Calculate relative luminance
    const [r, g, b] = rgb.map(x => {
      const val = x / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  },

  // Calculate contrast ratio between two colors
  getContrastRatio: (color1: string, color2: string): number => {
    const lum1 = colorContrast.getLuminance(color1);
    const lum2 = colorContrast.getLuminance(color2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  },

  // Check if contrast meets WCAG standards
  meetsWCAG: (color1: string, color2: string, level: 'AA' | 'AAA' = 'AA'): boolean => {
    const ratio = colorContrast.getContrastRatio(color1, color2);
    return level === 'AA' ? ratio >= 4.5 : ratio >= 7;
  }
};

// Screen reader utilities
export const screenReader = {
  // Create visually hidden but screen reader accessible content
  createVisuallyHidden: (content: string): HTMLElement => {
    const element = document.createElement('span');
    element.style.position = 'absolute';
    element.style.width = '1px';
    element.style.height = '1px';
    element.style.padding = '0';
    element.style.margin = '-1px';
    element.style.overflow = 'hidden';
    element.style.clip = 'rect(0, 0, 0, 0)';
    element.style.whiteSpace = 'nowrap';
    element.style.border = '0';
    element.textContent = content;
    return element;
  },

  // Create loading announcement
  announceLoading: (message: string = 'Loading, please wait'): void => {
    announceToScreenReader(message, 'polite');
  },

  // Create success announcement
  announceSuccess: (message: string): void => {
    announceToScreenReader(message, 'assertive');
  },

  // Create error announcement
  announceError: (message: string): void => {
    announceToScreenReader(`Error: ${message}`, 'assertive');
  }
};

// Touch/swipe utilities
export const touchUtils = {
  // Handle swipe gestures
  handleSwipe: (
    element: HTMLElement,
    onSwipeLeft: () => void,
    onSwipeRight: () => void,
    threshold: number = 50
  ): (() => void) => {
    let startX: number;
    let startY: number;
    let startTime: number;

    const handleTouchStart = (event: TouchEvent) => {
      startX = event.touches[0].clientX;
      startY = event.touches[0].clientY;
      startTime = Date.now();
    };

    const handleTouchEnd = (event: TouchEvent) => {
      if (!startX || !startY || !startTime) return;

      const endX = event.changedTouches[0].clientX;
      const endY = event.changedTouches[0].clientY;
      const endTime = Date.now();

      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const deltaTime = endTime - startTime;

      // Check if it's a swipe (not too slow, mostly horizontal)
      if (deltaTime < 300 && Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
        if (deltaX > 0) {
          onSwipeRight();
        } else {
          onSwipeLeft();
        }
      }
    };

    element.addEventListener('touchstart', handleTouchStart);
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }
};

// Accessibility validation utilities
export const accessibilityValidation = {
  // Check if element has proper ARIA labels
  hasAriaLabel: (element: HTMLElement): boolean => {
    return !!(element.getAttribute('aria-label') || element.getAttribute('aria-labelledby'));
  },

  // Check if form field has proper labels
  hasFormLabel: (element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): boolean => {
    const id = element.id;
    if (!id) return false;
    
    // Check for associated label
    const label = document.querySelector(`label[for="${id}"]`);
    if (label) return true;
    
    // Check for aria-label or aria-labelledby
    return accessibilityValidation.hasAriaLabel(element);
  },

  // Check if image has alt text
  hasAltText: (element: HTMLImageElement): boolean => {
    return !!element.alt && element.alt.trim() !== '';
  },

  // Run basic accessibility audit on element
  auditElement: (element: HTMLElement): string[] => {
    const issues: string[] = [];
    
    // Check interactive elements
    if (element.tagName === 'BUTTON' || element.tagName === 'A') {
      if (!accessibilityValidation.hasAriaLabel(element) && !element.textContent?.trim()) {
        issues.push('Interactive element lacks accessible label');
      }
    }
    
    // Check form elements
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName)) {
      if (!accessibilityValidation.hasFormLabel(element as HTMLInputElement)) {
        issues.push('Form element lacks proper labeling');
      }
    }
    
    // Check images
    if (element.tagName === 'IMG') {
      if (!accessibilityValidation.hasAltText(element as HTMLImageElement)) {
        issues.push('Image lacks alt text');
      }
    }
    
    return issues;
  }
};

// Export all utilities
export default {
  announceToScreenReader,
  focusManagement,
  keyboardNavigation,
  ariaUtils,
  colorContrast,
  screenReader,
  touchUtils,
  accessibilityValidation
};