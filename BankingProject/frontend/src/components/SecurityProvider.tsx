import React, { createContext, useContext, useEffect, useState } from 'react';
import { securityMiddleware, rateLimiter } from '../utils/securityMiddleware';
import { securityUtils } from '../utils/security';
import { toast } from 'sonner';

interface SecurityContextType {
  isSecure: boolean;
  securityLevel: 'basic' | 'enhanced' | 'maximum';
  csrfToken: string | null;
  rateLimitStatus: Map<string, { remaining: number; resetTime: number }>;
  generateCSRFToken: () => Promise<string>;
  validateRequest: (key: string) => boolean;
  getSecurityHeaders: () => Record<string, string>;
  checkRateLimit: (key: string) => boolean;
  sanitizeInput: (input: string) => string;
  validateFileUpload: (file: File) => boolean;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};

interface SecurityProviderProps {
  children: React.ReactNode;
  securityLevel?: 'basic' | 'enhanced' | 'maximum';
  enableRateLimiting?: boolean;
  enableCSRF?: boolean;
  enableXSSProtection?: boolean;
}

export const SecurityProvider: React.FC<SecurityProviderProps> = ({
  children,
  securityLevel = 'enhanced',
  enableRateLimiting = true,
  enableCSRF = true,
  enableXSSProtection = true,
}) => {
  const [isSecure, setIsSecure] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [rateLimitStatus, setRateLimitStatus] = useState<Map<string, { remaining: number; resetTime: number }>>(new Map());

  useEffect(() => {
    initializeSecurity();
    
    return () => {
      cleanupSecurity();
    };
  }, []);

  const initializeSecurity = async () => {
    try {
      // Apply CSP based on security level
      applyCSPByLevel(securityLevel);
      
      // Generate CSRF token if enabled
      if (enableCSRF) {
        const token = await securityMiddleware.generateCSRFToken();
        setCsrfToken(token);
      }
      
      // Set up rate limiting
      if (enableRateLimiting) {
        setupRateLimiting();
      }
      
      // Validate current session
      await validateCurrentSession();
      
      setIsSecure(true);
      console.log('Security initialized with level:', securityLevel);
    } catch (error) {
      console.error('Security initialization failed:', error);
      setIsSecure(false);
      toast.error('Security features could not be initialized');
    }
  };

  const applyCSPByLevel = (level: string) => {
    const csp = securityUtils.csp;
    
    switch (level) {
      case 'maximum':
        // Strict CSP for maximum security
        csp.updateConfig({
          scriptSrc: ["'self'"],
          styleSrc: ["'self'"],
          imgSrc: ["'self'", 'data:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        });
        break;
      
      case 'enhanced':
        // Balanced CSP for enhanced security
        csp.updateConfig({
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", 'https://api.trae-api-sg.mchost.guru'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        });
        break;
      
      case 'basic':
      default:
        // Default CSP configuration
        break;
    }
  };

  const setupRateLimiting = () => {
    // Update rate limit status periodically
    const interval = setInterval(() => {
      const status = new Map<string, { remaining: number; resetTime: number }>();
      
      ['login', 'api', 'payment'].forEach(key => {
        const remaining = rateLimiter.getRemainingRequests(key);
        const resetTime = rateLimiter.getTimeUntilReset(key);
        status.set(key, { remaining, resetTime });
      });
      
      setRateLimitStatus(status);
    }, 1000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  };

  const validateCurrentSession = async () => {
    try {
      const token = securityUtils.tokenStorage.getToken();
      if (token) {
        // Validate token format and expiration
        const isExpired = securityUtils.tokenStorage.isTokenExpired();
        if (isExpired) {
          securityUtils.tokenStorage.removeToken();
          toast.warning('Session expired. Please log in again.');
        }
      }
    } catch (error) {
      console.error('Session validation error:', error);
    }
  };

  const generateCSRFToken = async (): Promise<string> => {
    const token = await securityMiddleware.generateCSRFToken();
    setCsrfToken(token);
    return token;
  };

  const validateRequest = (key: string): boolean => {
    // Check rate limiting
    if (enableRateLimiting && rateLimiter.isRateLimited(key)) {
      const resetTime = rateLimiter.getTimeUntilReset(key);
      toast.error(`Rate limit exceeded. Try again in ${Math.ceil(resetTime / 1000)} seconds.`);
      return false;
    }
    
    return true;
  };

  const checkRateLimit = (key: string): boolean => {
    return !rateLimiter.isRateLimited(key);
  };

  const sanitizeInput = (input: string): string => {
    if (enableXSSProtection) {
      return securityUtils.xss.sanitizeInput(input);
    }
    return input;
  };

  const validateFileUpload = (file: File): boolean => {
    return securityMiddleware.validateFileUpload(file);
  };

  const getSecurityHeaders = (): Record<string, string> => {
    const headers = securityMiddleware.getSecurityHeaders();
    return Object.fromEntries(
      Object.entries(headers).filter(([, value]) => value !== '')
    );
  };

  const cleanupSecurity = () => {
    // Clear sensitive data
    setCsrfToken(null);
    setRateLimitStatus(new Map());
    
    // Clear tokens if session is invalid
    try {
      const token = securityUtils.tokenStorage.getToken();
      if (token && securityUtils.tokenStorage.isTokenExpired()) {
        securityUtils.tokenStorage.clearAllTokens();
      }
    } catch (error) {
      console.error('Security cleanup error:', error);
    }
  };

  const value: SecurityContextType = {
    isSecure,
    securityLevel,
    csrfToken,
    rateLimitStatus,
    generateCSRFToken,
    validateRequest,
    getSecurityHeaders,
    checkRateLimit,
    sanitizeInput,
    validateFileUpload,
  };

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
};

// Security HOC for components
export const withSecurity = <P extends object>(
  Component: React.ComponentType<P>,
  options: {
    requireAuth?: boolean;
    rateLimitKey?: string;
    securityLevel?: 'basic' | 'enhanced' | 'maximum';
  } = {}
) => {
  return (props: P) => {
    const { isSecure, validateRequest, securityLevel: currentLevel } = useSecurity();
    
    useEffect(() => {
      if (!isSecure) {
        console.warn('Component rendered without security context');
        return;
      }
      
      // Validate rate limiting if specified
      if (options.rateLimitKey && !validateRequest(options.rateLimitKey)) {
        return;
      }
      
      // Check security level
      if (options.securityLevel && currentLevel !== options.securityLevel) {
        console.warn(`Component requires ${options.securityLevel} security level, current: ${currentLevel}`);
      }
    }, [isSecure, validateRequest, currentLevel, options.rateLimitKey, options.securityLevel]);
    
    if (!isSecure) {
      return (
        <div className="security-error">
          <p>Security features are not available. Please refresh the page.</p>
        </div>
      );
    }
    
    return <Component {...props} />;
  };
};

export default SecurityProvider;