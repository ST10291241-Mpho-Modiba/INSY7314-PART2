import { Variants } from 'framer-motion';

// Base animation variants
export const fadeInUp: Variants = {
  initial: {
    opacity: 0,
    y: 20
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut'
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
      ease: 'easeIn'
    }
  }
};

export const scaleIn: Variants = {
  initial: {
    opacity: 0,
    scale: 0.9
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
      type: 'spring',
      stiffness: 200
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

export const slideInRight: Variants = {
  initial: {
    opacity: 0,
    x: 100
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut'
    }
  },
  exit: {
    opacity: 0,
    x: 100,
    transition: {
      duration: 0.3,
      ease: 'easeIn'
    }
  }
};

export const slideInLeft: Variants = {
  initial: {
    opacity: 0,
    x: -100
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut'
    }
  },
  exit: {
    opacity: 0,
    x: -100,
    transition: {
      duration: 0.3,
      ease: 'easeIn'
    }
  }
};

// Modal animations
export const modalBackdrop: Variants = {
  initial: {
    opacity: 0
  },
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

export const modalContent: Variants = {
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
      ease: 'easeOut',
      type: 'spring',
      stiffness: 300,
      damping: 30
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

export const mobileModalContent: Variants = {
  initial: {
    opacity: 0,
    y: '100%'
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
      type: 'spring',
      stiffness: 300,
      damping: 30
    }
  },
  exit: {
    opacity: 0,
    y: '100%',
    transition: {
      duration: 0.2,
      ease: 'easeIn'
    }
  }
};

// Tab content animations
export const tabContent: Variants = {
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

// Stagger animations
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

export const staggerItem: Variants = {
  initial: {
    opacity: 0,
    y: 20
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut'
    }
  }
};

// Transaction-specific animations
export const transactionSlideIn: Variants = {
  initial: {
    opacity: 0,
    x: -20
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
    x: 20,
    transition: {
      duration: 0.3,
      ease: 'easeIn'
    }
  }
};

// Hover animations
export const hoverLift: Variants = {
  initial: { y: 0 },
  hover: {
    y: -2,
    transition: {
      duration: 0.2,
      ease: 'easeOut'
    }
  },
  tap: {
    y: 0,
    transition: {
      duration: 0.1
    }
  }
};

export const hoverScale: Variants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.05,
    transition: {
      duration: 0.2,
      ease: 'easeOut'
    }
  },
  tap: {
    scale: 0.95,
    transition: {
      duration: 0.1
    }
  }
};

// Balance reveal animation
export const balanceReveal: Variants = {
  initial: {
    opacity: 0,
    scale: 0.8
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
      type: 'spring',
      stiffness: 150
    }
  }
};

// Form field animations
export const formField: Variants = {
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
  error: {
    x: [0, -10, 10, -10, 10, 0],
    transition: {
      duration: 0.5,
      ease: 'easeInOut'
    }
  }
};

// Loading animations
export const loadingPulse: Variants = {
  animate: {
    opacity: [0.4, 0.8, 0.4],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
};

export const loadingShimmer: Variants = {
  animate: {
    backgroundPosition: ['-200px 0', '200px 0'],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'linear'
    }
  }
};

// Notification animations
export const notificationSlideIn: Variants = {
  initial: {
    opacity: 0,
    y: -20,
    scale: 0.9
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
      type: 'spring',
      stiffness: 200
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.9,
    transition: {
      duration: 0.3,
      ease: 'easeIn'
    }
  }
};

// Progress bar animations
export const progressBar: Variants = {
  initial: {
    width: 0
  },
  animate: {
    width: '100%',
    transition: {
      duration: 2,
      ease: 'easeOut'
    }
  }
};

// Password strength meter animations
export const passwordStrength: Variants = {
  initial: {
    width: 0,
    opacity: 0
  },
  animate: (strength: number) => ({
    width: `${strength}%`,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: 'easeOut'
    }
  })
};

// Multi-step form animations
export const stepTransition: Variants = {
  initial: {
    opacity: 0,
    x: 100
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
    x: -100,
    transition: {
      duration: 0.3,
      ease: 'easeIn'
    }
  }
};

// Error animations
export const errorShake: Variants = {
  initial: {
    x: 0
  },
  error: {
    x: [-10, 10, -10, 10, -10, 0],
    transition: {
      duration: 0.5,
      ease: 'easeInOut'
    }
  }
};

// Success animations
export const successBounce: Variants = {
  initial: {
    scale: 0
  },
  animate: {
    scale: [0, 1.2, 0.9, 1],
    transition: {
      duration: 0.6,
      ease: 'easeOut',
      type: 'spring',
      stiffness: 200
    }
  }
};

// Card animations
export const cardFlip: Variants = {
  initial: {
    rotateY: 0
  },
  flip: {
    rotateY: 180,
    transition: {
      duration: 0.6,
      ease: 'easeInOut'
    }
  }
};

// Icon animations
export const iconSpin: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear'
    }
  }
};

export const iconPulse: Variants = {
  animate: {
    scale: [1, 1.2, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
};

// Utility function to get animation variant based on accessibility preferences
export const getAnimationVariant = (variant: Variants, shouldReduceMotion: boolean): Variants => {
  if (shouldReduceMotion) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 }
    };
  }
  return variant;
};

// Utility function to create custom spring animations
export const createSpringAnimation = (config: {
  stiffness?: number;
  damping?: number;
  mass?: number;
  initial?: number;
  target?: number;
}) => {
  const { stiffness = 100, damping = 10, mass = 1, initial = 0, target = 1 } = config;
  
  return {
    initial: { scale: initial },
    animate: {
      scale: target,
      transition: {
        type: 'spring',
        stiffness,
        damping,
        mass
      }
    }
  };
};

// Utility function to create staggered animations
export const createStaggerAnimation = (itemCount: number, delay: number = 0.1) => {
  return {
    container: {
      initial: {},
      animate: {
        transition: {
          staggerChildren: delay,
          delayChildren: 0.2
        }
      }
    },
    item: {
      initial: { opacity: 0, y: 20 },
      animate: {
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.5,
          ease: 'easeOut'
        }
      }
    }
  };
};

// Export all animations
export default {
  fadeInUp,
  scaleIn,
  slideInRight,
  slideInLeft,
  modalBackdrop,
  modalContent,
  mobileModalContent,
  tabContent,
  staggerContainer,
  staggerItem,
  transactionSlideIn,
  hoverLift,
  hoverScale,
  balanceReveal,
  formField,
  loadingPulse,
  loadingShimmer,
  notificationSlideIn,
  progressBar,
  passwordStrength,
  stepTransition,
  errorShake,
  successBounce,
  cardFlip,
  iconSpin,
  iconPulse,
  getAnimationVariant,
  createSpringAnimation,
  createStaggerAnimation
};