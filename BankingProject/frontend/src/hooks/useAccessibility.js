import { useEffect, useRef, useCallback } from 'react';

// Hook for managing focus and accessibility
export const useAccessibility = () => {
  const focusableElementsSelector = 
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

  // Focus management
  const focusElement = useCallback((element) => {
    if (element && typeof element.focus === 'function') {
      element.focus();
    }
  }, []);

  const focusFirstElement = useCallback((container) => {
    if (!container) return;
    
    const focusableElements = container.querySelectorAll(focusableElementsSelector);
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }, [focusableElementsSelector]);

  const focusLastElement = useCallback((container) => {
    if (!container) return;
    
    const focusableElements = container.querySelectorAll(focusableElementsSelector);
    if (focusableElements.length > 0) {
      focusableElements[focusableElements.length - 1].focus();
    }
  }, [focusableElementsSelector]);

  // Trap focus within a container (useful for modals)
  const trapFocus = useCallback((container) => {
    if (!container) return () => {};

    const focusableElements = container.querySelectorAll(focusableElementsSelector);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    
    // Focus first element initially
    if (firstElement) {
      firstElement.focus();
    }

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, [focusableElementsSelector]);

  // Announce to screen readers
  const announce = useCallback((message, priority = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.setAttribute('class', 'sr-only');
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, []);

  // Check if user prefers reduced motion
  const prefersReducedMotion = useCallback(() => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Check if user is using keyboard navigation
  const isUsingKeyboard = useCallback(() => {
    return document.body.classList.contains('using-keyboard');
  }, []);

  return {
    focusElement,
    focusFirstElement,
    focusLastElement,
    trapFocus,
    announce,
    prefersReducedMotion,
    isUsingKeyboard
  };
};

// Hook for keyboard navigation
export const useKeyboardNavigation = (onEscape, onEnter, dependencies = []) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'Escape':
          if (onEscape) {
            e.preventDefault();
            onEscape();
          }
          break;
        case 'Enter':
          if (onEnter && e.target.tagName !== 'BUTTON' && e.target.tagName !== 'A') {
            e.preventDefault();
            onEnter();
          }
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, dependencies);
};

// Hook for focus restoration
export const useFocusRestore = () => {
  const previousFocusRef = useRef(null);

  const saveFocus = useCallback(() => {
    previousFocusRef.current = document.activeElement;
  }, []);

  const restoreFocus = useCallback(() => {
    if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
      previousFocusRef.current.focus();
    }
  }, []);

  return { saveFocus, restoreFocus };
};

// Hook for managing ARIA attributes
export const useAriaAttributes = () => {
  const setAriaLabel = useCallback((element, label) => {
    if (element) {
      element.setAttribute('aria-label', label);
    }
  }, []);

  const setAriaDescribedBy = useCallback((element, id) => {
    if (element) {
      element.setAttribute('aria-describedby', id);
    }
  }, []);

  const setAriaExpanded = useCallback((element, expanded) => {
    if (element) {
      element.setAttribute('aria-expanded', expanded.toString());
    }
  }, []);

  const setAriaHidden = useCallback((element, hidden) => {
    if (element) {
      element.setAttribute('aria-hidden', hidden.toString());
    }
  }, []);

  const setAriaLive = useCallback((element, live) => {
    if (element) {
      element.setAttribute('aria-live', live);
    }
  }, []);

  return {
    setAriaLabel,
    setAriaDescribedBy,
    setAriaExpanded,
    setAriaHidden,
    setAriaLive
  };
};

// Hook for skip links
export const useSkipLinks = () => {
  const createSkipLink = useCallback((targetId, text = 'Skip to main content') => {
    const skipLink = document.createElement('a');
    skipLink.href = `#${targetId}`;
    skipLink.textContent = text;
    skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded z-50';
    
    skipLink.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.getElementById(targetId);
      if (target) {
        target.focus();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });

    return skipLink;
  }, []);

  const addSkipLinks = useCallback((links) => {
    const container = document.createElement('div');
    container.className = 'skip-links';
    
    links.forEach(({ targetId, text }) => {
      const skipLink = createSkipLink(targetId, text);
      container.appendChild(skipLink);
    });

    document.body.insertBefore(container, document.body.firstChild);
    
    return () => {
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    };
  }, [createSkipLink]);

  return { createSkipLink, addSkipLinks };
};

// Hook for managing focus visible
export const useFocusVisible = () => {
  useEffect(() => {
    let hadKeyboardEvent = true;
    let keyboardThrottleTimeout = 0;

    const pointerEvent = () => {
      hadKeyboardEvent = false;
    };

    const keyboardEvent = (e) => {
      if (e.metaKey || e.altKey || e.ctrlKey) {
        return;
      }
      hadKeyboardEvent = true;
    };

    const focusEvent = (e) => {
      if (hadKeyboardEvent || e.target.matches(':focus-visible')) {
        document.body.classList.add('using-keyboard');
      } else {
        document.body.classList.remove('using-keyboard');
      }
    };

    const blurEvent = () => {
      clearTimeout(keyboardThrottleTimeout);
      keyboardThrottleTimeout = setTimeout(() => {
        document.body.classList.remove('using-keyboard');
      }, 100);
    };

    document.addEventListener('keydown', keyboardEvent, true);
    document.addEventListener('mousedown', pointerEvent, true);
    document.addEventListener('pointerdown', pointerEvent, true);
    document.addEventListener('touchstart', pointerEvent, true);
    document.addEventListener('focus', focusEvent, true);
    document.addEventListener('blur', blurEvent, true);

    return () => {
      document.removeEventListener('keydown', keyboardEvent, true);
      document.removeEventListener('mousedown', pointerEvent, true);
      document.removeEventListener('pointerdown', pointerEvent, true);
      document.removeEventListener('touchstart', pointerEvent, true);
      document.removeEventListener('focus', focusEvent, true);
      document.removeEventListener('blur', blurEvent, true);
      clearTimeout(keyboardThrottleTimeout);
    };
  }, []);
};

// Hook for screen reader announcements
export const useScreenReader = () => {
  const announceRef = useRef(null);

  useEffect(() => {
    // Create announcement container
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.id = 'screen-reader-announcer';
    document.body.appendChild(announcer);
    announceRef.current = announcer;

    return () => {
      if (announcer.parentNode) {
        announcer.parentNode.removeChild(announcer);
      }
    };
  }, []);

  const announce = useCallback((message, priority = 'polite') => {
    if (announceRef.current) {
      announceRef.current.setAttribute('aria-live', priority);
      announceRef.current.textContent = message;
      
      // Clear after announcement
      setTimeout(() => {
        if (announceRef.current) {
          announceRef.current.textContent = '';
        }
      }, 1000);
    }
  }, []);

  const announceError = useCallback((message) => {
    announce(`Error: ${message}`, 'assertive');
  }, [announce]);

  const announceSuccess = useCallback((message) => {
    announce(`Success: ${message}`, 'polite');
  }, [announce]);

  const announceNavigation = useCallback((pageName) => {
    announce(`Navigated to ${pageName}`, 'polite');
  }, [announce]);

  return {
    announce,
    announceError,
    announceSuccess,
    announceNavigation
  };
};

export default {
  useAccessibility,
  useKeyboardNavigation,
  useFocusRestore,
  useAriaAttributes,
  useSkipLinks,
  useFocusVisible,
  useScreenReader
};