import { useState, useEffect } from 'react';

// Breakpoints following Tailwind CSS conventions
const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
};

export const useResponsive = () => {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });

  const [currentBreakpoint, setCurrentBreakpoint] = useState('sm');

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setScreenSize({ width, height });

      // Determine current breakpoint
      if (width >= breakpoints['2xl']) {
        setCurrentBreakpoint('2xl');
      } else if (width >= breakpoints.xl) {
        setCurrentBreakpoint('xl');
      } else if (width >= breakpoints.lg) {
        setCurrentBreakpoint('lg');
      } else if (width >= breakpoints.md) {
        setCurrentBreakpoint('md');
      } else {
        setCurrentBreakpoint('sm');
      }
    };

    // Set initial values
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Helper functions
  const isMobile = screenSize.width < breakpoints.md;
  const isTablet = screenSize.width >= breakpoints.md && screenSize.width < breakpoints.lg;
  const isDesktop = screenSize.width >= breakpoints.lg;
  const isLargeScreen = screenSize.width >= breakpoints.xl;

  const isBreakpoint = (breakpoint) => {
    return screenSize.width >= breakpoints[breakpoint];
  };

  const isBreakpointOnly = (breakpoint) => {
    const breakpointKeys = Object.keys(breakpoints);
    const currentIndex = breakpointKeys.indexOf(breakpoint);
    
    if (currentIndex === -1) return false;
    
    const minWidth = breakpoints[breakpoint];
    const maxWidth = currentIndex < breakpointKeys.length - 1 
      ? breakpoints[breakpointKeys[currentIndex + 1]] - 1 
      : Infinity;
    
    return screenSize.width >= minWidth && screenSize.width <= maxWidth;
  };

  const getResponsiveValue = (values) => {
    // values should be an object like { sm: 1, md: 2, lg: 3, xl: 4 }
    const sortedBreakpoints = Object.keys(breakpoints).sort(
      (a, b) => breakpoints[a] - breakpoints[b]
    );

    let result = values.sm || values.default;

    for (const bp of sortedBreakpoints) {
      if (screenSize.width >= breakpoints[bp] && values[bp] !== undefined) {
        result = values[bp];
      }
    }

    return result;
  };

  const getGridCols = () => {
    return getResponsiveValue({
      sm: 1,
      md: 2,
      lg: 3,
      xl: 4,
      '2xl': 5
    });
  };

  const getContainerPadding = () => {
    return getResponsiveValue({
      sm: 'px-4',
      md: 'px-6',
      lg: 'px-8',
      xl: 'px-12',
      '2xl': 'px-16'
    });
  };

  const getTextSize = (base = 'base') => {
    const sizeMap = {
      xs: { sm: 'text-xs', md: 'text-sm', lg: 'text-base' },
      sm: { sm: 'text-sm', md: 'text-base', lg: 'text-lg' },
      base: { sm: 'text-base', md: 'text-lg', lg: 'text-xl' },
      lg: { sm: 'text-lg', md: 'text-xl', lg: 'text-2xl' },
      xl: { sm: 'text-xl', md: 'text-2xl', lg: 'text-3xl' },
      '2xl': { sm: 'text-2xl', md: 'text-3xl', lg: 'text-4xl' }
    };

    return getResponsiveValue(sizeMap[base] || sizeMap.base);
  };

  return {
    screenSize,
    currentBreakpoint,
    isMobile,
    isTablet,
    isDesktop,
    isLargeScreen,
    isBreakpoint,
    isBreakpointOnly,
    getResponsiveValue,
    getGridCols,
    getContainerPadding,
    getTextSize,
    breakpoints
  };
};

// Hook for responsive component rendering
export const useResponsiveComponent = () => {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  const renderResponsive = ({ mobile, tablet, desktop }) => {
    if (isMobile && mobile) return mobile;
    if (isTablet && tablet) return tablet;
    if (isDesktop && desktop) return desktop;
    return mobile || tablet || desktop;
  };

  return { renderResponsive, isMobile, isTablet, isDesktop };
};

// Hook for responsive navigation
export const useResponsiveNavigation = () => {
  const { isMobile } = useResponsive();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Close mobile menu when screen size changes to desktop
  useEffect(() => {
    if (!isMobile) {
      setIsMobileMenuOpen(false);
    }
  }, [isMobile]);

  return {
    isMobile,
    isMobileMenuOpen,
    toggleMobileMenu,
    closeMobileMenu
  };
};

// Hook for responsive modal behavior
export const useResponsiveModal = () => {
  const { isMobile, screenSize } = useResponsive();

  const getModalSize = (size = 'md') => {
    if (isMobile) {
      return 'w-full h-full max-w-none max-h-none rounded-none';
    }

    const sizeMap = {
      sm: 'max-w-md',
      md: 'max-w-lg',
      lg: 'max-w-2xl',
      xl: 'max-w-4xl',
      '2xl': 'max-w-6xl',
      full: 'max-w-full'
    };

    return `${sizeMap[size]} max-h-[90vh] rounded-lg`;
  };

  const getModalPosition = () => {
    if (isMobile) {
      return 'items-end justify-center';
    }
    return 'items-center justify-center';
  };

  const shouldUseFullScreen = () => {
    return isMobile || screenSize.height < 600;
  };

  return {
    getModalSize,
    getModalPosition,
    shouldUseFullScreen,
    isMobile
  };
};

// Hook for responsive table behavior
export const useResponsiveTable = () => {
  const { isMobile, isTablet } = useResponsive();

  const shouldUseCardLayout = () => {
    return isMobile;
  };

  const shouldHideColumns = () => {
    return isMobile || isTablet;
  };

  const getVisibleColumns = (allColumns) => {
    if (isMobile) {
      // Show only essential columns on mobile
      return allColumns.filter(col => col.essential);
    }
    if (isTablet) {
      // Show essential and important columns on tablet
      return allColumns.filter(col => col.essential || col.important);
    }
    // Show all columns on desktop
    return allColumns;
  };

  return {
    shouldUseCardLayout,
    shouldHideColumns,
    getVisibleColumns,
    isMobile,
    isTablet
  };
};

export default useResponsive;