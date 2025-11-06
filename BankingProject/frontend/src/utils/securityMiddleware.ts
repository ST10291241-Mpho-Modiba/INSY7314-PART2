import { securityUtils } from './security';

/**
 * Security middleware for API requests
 * Adds security headers and handles token management
 */

export interface SecurityHeaders {
  'X-Content-Type-Options'?: string;
  'X-Frame-Options'?: string;
  'X-XSS-Protection'?: string;
  'Strict-Transport-Security'?: string;
  'Referrer-Policy'?: string;
  'Permissions-Policy'?: string;
  'X-CSRF-Token'?: string;
  'Authorization'?: string;
}

export class SecurityMiddleware {
  private static instance: SecurityMiddleware;
  private csrfToken: string | null = null;
  private requestQueue: Map<string, () => Promise<Response>> = new Map();
  
  private constructor() {
    this.initializeSecurityHeaders();
  }
  
  public static getInstance(): SecurityMiddleware {
    if (!SecurityMiddleware.instance) {
      SecurityMiddleware.instance = new SecurityMiddleware();
    }
    return SecurityMiddleware.instance;
  }
  
  private initializeSecurityHeaders(): void {
    // Apply CSP headers
    securityUtils.csp.applyCSP();
    
    // Set up security event listeners
    this.setupSecurityListeners();
  }
  
  private setupSecurityListeners(): void {
    // Listen for security violations
    document.addEventListener('securitypolicyviolation', (e) => {
      console.error('CSP Violation:', e);
      this.handleSecurityViolation(e);
    });
    
    // Listen for potential XSS attempts
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });
  }
  
  private handleSecurityViolation(event: SecurityPolicyViolationEvent): void {
    // Log security violations
    console.error('Security Policy Violation:', {
      documentURI: event.documentURI,
      blockedURI: event.blockedURI,
      violatedDirective: event.violatedDirective,
      originalPolicy: event.originalPolicy,
    });
    
    // Could send to security monitoring service
    this.logSecurityEvent('csp_violation', {
      documentURI: event.documentURI,
      blockedURI: event.blockedURI,
      violatedDirective: event.violatedDirective,
      timestamp: new Date().toISOString(),
    });
  }
  
  private logSecurityEvent(eventType: string, data: any): void {
    // In a real application, this would send to a security monitoring service
    console.warn('Security Event:', eventType, data);
  }
  
  public getSecurityHeaders(): SecurityHeaders {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=()',
      'X-CSRF-Token': this.csrfToken || '',
    };
  }
  
  public async generateCSRFToken(): Promise<string> {
    // Generate a cryptographically secure random token
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    this.csrfToken = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    
    // Store in session storage for persistence
    sessionStorage.setItem('csrf_token', this.csrfToken);
    
    return this.csrfToken;
  }
  
  public validateCSRFToken(token: string): boolean {
    return token === this.csrfToken;
  }
  
  public async secureFetch(url: string, options: RequestInit = {}): Promise<Response> {
    // Get authentication token
    const token = securityUtils.tokenStorage.getToken();
    
    // Prepare headers
    const headers = new Headers(options.headers);
    
    // Add security headers
    const securityHeaders = this.getSecurityHeaders();
    Object.entries(securityHeaders).forEach(([key, value]) => {
      if (value) {
        headers.set(key, value);
      }
    });
    
    // Add authorization header if token exists
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    
    // Add content type for JSON requests
    if (options.body && typeof options.body === 'string') {
      headers.set('Content-Type', 'application/json');
    }
    
    // Sanitize URL
    const sanitizedUrl = securityUtils.xss.sanitizeInput(url);
    
    try {
      const response = await fetch(sanitizedUrl, {
        ...options,
        headers,
        credentials: 'include', // Include cookies
      });
      
      // Handle token refresh if needed
      if (response.status === 401) {
        return this.handleTokenRefresh(url, options);
      }
      
      // Validate response
      this.validateResponse(response);
      
      return response;
    } catch (error) {
      this.handleFetchError(error);
      throw error;
    }
  }
  
  private async handleTokenRefresh(url: string, options: RequestInit): Promise<Response> {
    const refreshToken = securityUtils.tokenStorage.getRefreshToken();
    
    if (!refreshToken) {
      // No refresh token available, redirect to login
      this.redirectToLogin();
      throw new Error('No refresh token available');
    }
    
    try {
      // Attempt to refresh the token
      const refreshResponse = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getSecurityHeaders(),
        },
        body: JSON.stringify({ refreshToken }),
        credentials: 'include',
      });
      
      if (!refreshResponse.ok) {
        throw new Error('Token refresh failed');
      }
      
      const { token, expiresIn } = await refreshResponse.json();
      
      // Store new token
      securityUtils.tokenStorage.setToken(token, expiresIn);
      
      // Retry original request
      const headers = new Headers(options.headers);
      headers.set('Authorization', `Bearer ${token}`);
      
      return fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });
    } catch (error) {
      // Refresh failed, redirect to login
      this.redirectToLogin();
      throw new Error('Token refresh failed');
    }
  }
  
  private validateResponse(response: Response): void {
    // Check for security headers in response
    const securityHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection',
      'strict-transport-security',
    ];
    
    securityHeaders.forEach(header => {
      if (!response.headers.has(header)) {
        console.warn(`Missing security header: ${header}`);
      }
    });
    
    // Validate content type
    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.includes('application/json') && 
        !contentType.includes('text/html') && 
        !contentType.includes('text/plain')) {
      console.warn('Unexpected content type:', contentType);
    }
  }
  
  private handleFetchError(error: any): void {
    console.error('Secure fetch error:', error);
    
    // Log security events
    this.logSecurityEvent('fetch_error', {
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
  
  private redirectToLogin(): void {
    // Clear all tokens
    securityUtils.tokenStorage.clearAllTokens();
    
    // Redirect to login page
    window.location.href = '/login?session_expired=true';
  }
  
  public sanitizeRequestData(data: any): any {
    if (typeof data === 'string') {
      return securityUtils.xss.sanitizeInput(data);
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeRequestData(item));
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized: any = {};
      Object.entries(data).forEach(([key, value]) => {
        const sanitizedKey = securityUtils.xss.sanitizeInput(key);
        sanitized[sanitizedKey] = this.sanitizeRequestData(value);
      });
      return sanitized;
    }
    
    return data;
  }
  
  public validateFileUpload(file: File): boolean {
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      console.warn('File too large:', file.size);
      return false;
    }
    
    // Check file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'text/plain',
    ];
    
    if (!allowedTypes.includes(file.type)) {
      console.warn('Invalid file type:', file.type);
      return false;
    }
    
    // Sanitize filename
    const sanitizedName = securityUtils.xss.sanitizeFilename(file.name);
    if (sanitizedName !== file.name) {
      console.warn('Filename sanitized:', file.name, '->', sanitizedName);
    }
    
    return true;
  }
  
  private cleanup(): void {
    // Clear sensitive data
    this.csrfToken = null;
    this.requestQueue.clear();
    sessionStorage.removeItem('csrf_token');
  }
}

// Rate limiting utility
export class RateLimiter {
  private static instance: RateLimiter;
  private requests: Map<string, number[]> = new Map();
  private limits: Map<string, { max: number; window: number }> = new Map();
  
  private constructor() {
    this.setupDefaultLimits();
  }
  
  public static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }
  
  private setupDefaultLimits(): void {
    // Default rate limits
    this.limits.set('login', { max: 5, window: 15 * 60 * 1000 }); // 5 attempts per 15 minutes
    this.limits.set('api', { max: 100, window: 60 * 1000 }); // 100 requests per minute
    this.limits.set('payment', { max: 10, window: 60 * 1000 }); // 10 payment attempts per minute
  }
  
  public isRateLimited(key: string): boolean {
    const limit = this.limits.get(key);
    if (!limit) return false;
    
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(timestamp => 
      now - timestamp < limit.window
    );
    
    // Check if limit exceeded
    if (validRequests.length >= limit.max) {
      return true;
    }
    
    // Add current request
    validRequests.push(now);
    this.requests.set(key, validRequests);
    
    return false;
  }
  
  public getRemainingRequests(key: string): number {
    const limit = this.limits.get(key);
    if (!limit) return -1;
    
    const requests = this.requests.get(key) || [];
    return Math.max(0, limit.max - requests.length);
  }
  
  public getTimeUntilReset(key: string): number {
    const limit = this.limits.get(key);
    if (!limit) return 0;
    
    const requests = this.requests.get(key) || [];
    if (requests.length === 0) return 0;
    
    const oldestRequest = Math.min(...requests);
    return Math.max(0, limit.window - (Date.now() - oldestRequest));
  }
}

// Export security middleware instance
export const securityMiddleware = SecurityMiddleware.getInstance();
export const rateLimiter = RateLimiter.getInstance();

export default securityMiddleware;