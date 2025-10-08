// Animation utilities for Framer Motion
import { useReducedMotion } from 'framer-motion';

// Check if user prefers reduced motion
export const useMotionPreference = () => {
  const shouldReduceMotion = useReducedMotion();
  return { shouldReduceMotion };
};

// Base animation variants
export const fadeInUp = {
  initial: { 
    opacity: 0, 
    y: 20 
  },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: {
      duration: 0.2,
      ease: 'easeIn'
    }
  }
};

export const fadeInDown = {
  initial: { 
    opacity: 0, 
    y: -20 
  },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: {
      duration: 0.2,
      ease: 'easeIn'
    }
  }
};

export const fadeInLeft = {
  initial: { 
    opacity: 0, 
    x: -20 
  },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  },
  exit: { 
    opacity: 0, 
    x: -20,
    transition: {
      duration: 0.2,
      ease: 'easeIn'
    }
  }
};

export const fadeInRight = {
  initial: { 
    opacity: 0, 
    x: 20 
  },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  },
  exit: { 
    opacity: 0, 
    x: 20,
    transition: {
      duration: 0.2,
      ease: 'easeIn'
    }
  }
};

export const scaleIn = {
  initial: { 
    opacity: 0, 
    scale: 0.9 
  },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.9,
    transition: {
      duration: 0.2,
      ease: 'easeIn'
    }
  }
};

export const slideInFromBottom = {
  initial: { 
    opacity: 0, 
    y: '100%' 
  },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut'
    }
  },
  exit: { 
    opacity: 0, 
    y: '100%',
    transition: {
      duration: 0.3,
      ease: 'easeIn'
    }
  }
};

export const slideInFromTop = {
  initial: { 
    opacity: 0, 
    y: '-100%' 
  },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut'
    }
  },
  exit: { 
    opacity: 0, 
    y: '-100%',
    transition: {
      duration: 0.3,
      ease: 'easeIn'
    }
  }
};

export const slideInFromRight = {
  initial: { 
    opacity: 0, 
    x: '100%' 
  },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut'
    }
  },
  exit: { 
    opacity: 0, 
    x: '100%',
    transition: {
      duration: 0.3,
      ease: 'easeIn'
    }
  }
};

// Modal animations
export const modalBackdrop = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: {
      duration: 0.2
    }
  },
  exit: { 
    opacity: 0,
    transition: {
      duration: 0.2
    }
  }
};

export const modalContent = {
  initial: { 
    opacity: 0, 
    scale: 0.95,
    y: 20
  },
  animate: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    y: 20,
    transition: {
      duration: 0.2,
      ease: 'easeIn'
    }
  }
};

// Mobile modal animations
export const mobileModalContent = {
  initial: { 
    opacity: 0, 
    y: '100%'
  },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut'
    }
  },
  exit: { 
    opacity: 0, 
    y: '100%',
    transition: {
      duration: 0.3,
      ease: 'easeIn'
    }
  }
};

// Notification animations
export const notificationSlideIn = {
  initial: { 
    opacity: 0, 
    x: '100%',
    scale: 0.9
  },
  animate: { 
    opacity: 1, 
    x: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: 'easeOut'
    }
  },
  exit: { 
    opacity: 0, 
    x: '100%',
    scale: 0.9,
    transition: {
      duration: 0.3,
      ease: 'easeIn'
    }
  }
};

// Stagger animations for lists
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const staggerItem = {
  initial: { 
    opacity: 0, 
    y: 20 
  },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  }
};

// Loading animations
export const pulseAnimation = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [0.7, 1, 0.7],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
};

export const spinAnimation = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear'
    }
  }
};

// Hover animations
export const hoverScale = {
  whileHover: { 
    scale: 1.02,
    transition: {
      duration: 0.2,
      ease: 'easeOut'
    }
  },
  whileTap: { 
    scale: 0.98,
    transition: {
      duration: 0.1,
      ease: 'easeOut'
    }
  }
};

export const hoverLift = {
  whileHover: { 
    y: -2,
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
    transition: {
      duration: 0.2,
      ease: 'easeOut'
    }
  }
};

export const hoverGlow = {
  whileHover: { 
    boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)',
    transition: {
      duration: 0.2,
      ease: 'easeOut'
    }
  }
};

// Page transition animations
export const pageTransition = {
  initial: { 
    opacity: 0,
    x: 20
  },
  animate: { 
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut'
    }
  },
  exit: { 
    opacity: 0,
    x: -20,
    transition: {
      duration: 0.3,
      ease: 'easeIn'
    }
  }
};

// Tab transition animations
export const tabContent = {
  initial: { 
    opacity: 0,
    y: 10
  },
  animate: { 
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  },
  exit: { 
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.2,
      ease: 'easeIn'
    }
  }
};

// Banking-specific animations
export const balanceReveal = {
  initial: { 
    opacity: 0,
    scale: 0.8,
    filter: 'blur(4px)'
  },
  animate: { 
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.5,
      ease: 'easeOut'
    }
  }
};

export const transactionSlideIn = {
  initial: { 
    opacity: 0,
    x: -20,
    scale: 0.95
  },
  animate: { 
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: 'easeOut'
    }
  }
};

export const cardFlip = {
  initial: { 
    rotateY: 0 
  },
  animate: { 
    rotateY: 180,
    transition: {
      duration: 0.6,
      ease: 'easeInOut'
    }
  }
};

// Progress animations
export const progressFill = {
  initial: { 
    width: 0 
  },
  animate: { 
    width: '100%',
    transition: {
      duration: 1,
      ease: 'easeOut'
    }
  }
};

// Utility function to create responsive animations
export const createResponsiveAnimation = (mobileVariant, desktopVariant) => {
  return {
    initial: mobileVariant.initial,
    animate: mobileVariant.animate,
    exit: mobileVariant.exit,
    desktop: desktopVariant
  };
};

// Utility function to disable animations for reduced motion
export const getAnimationVariant = (variant, shouldReduceMotion = false) => {
  if (shouldReduceMotion) {
    return {
      initial: variant.animate || {},
      animate: variant.animate || {},
      exit: variant.animate || {}
    };
  }
  return variant;
};

// Spring configurations
export const springConfigs = {
  gentle: {
    type: 'spring',
    stiffness: 120,
    damping: 14
  },
  wobbly: {
    type: 'spring',
    stiffness: 180,
    damping: 12
  },
  stiff: {
    type: 'spring',
    stiffness: 210,
    damping: 20
  },
  slow: {
    type: 'spring',
    stiffness: 60,
    damping: 15
  }
};

export default {
  fadeInUp,
  fadeInDown,
  fadeInLeft,
  fadeInRight,
  scaleIn,
  slideInFromBottom,
  slideInFromTop,
  slideInFromRight,
  modalBackdrop,
  modalContent,
  mobileModalContent,
  notificationSlideIn,
  staggerContainer,
  staggerItem,
  pulseAnimation,
  spinAnimation,
  hoverScale,
  hoverLift,
  hoverGlow,
  pageTransition,
  tabContent,
  balanceReveal,
  transactionSlideIn,
  cardFlip,
  progressFill,
  createResponsiveAnimation,
  getAnimationVariant,
  springConfigs
};