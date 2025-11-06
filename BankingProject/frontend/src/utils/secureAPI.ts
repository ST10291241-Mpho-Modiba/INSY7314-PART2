import { securityMiddleware } from './securityMiddleware';
import { securityUtils } from './security';
import { toast } from 'sonner';

/**
 * Secure API client with built-in security features
 * Provides secure communication with backend services
 */

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface APIError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

export class SecureAPIClient {
  private static instance: SecureAPIClient;
  private baseURL: string;
  private timeout: number;
  private retryAttempts: number;
  private circuitBreaker: Map<string, { failures: number; lastFailure: number; isOpen: boolean }>;
  
  private constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'https://api.trae-api-sg.mchost.guru';
    this.timeout = 30000; // 30 seconds
    this.retryAttempts = 3;
    this.circuitBreaker = new Map();
    
    this.initializeInterceptors();
  }
  
  public static getInstance(): SecureAPIClient {
    if (!SecureAPIClient.instance) {
      SecureAPIClient.instance = new SecureAPIClient();
    }
    return SecureAPIClient.instance;
  }
  
  private initializeInterceptors(): void {
    // Set up request interceptors for security
    this.setupRequestInterceptors();
    this.setupResponseInterceptors();
  }
  
  private setupRequestInterceptors(): void {
    // Request interceptor will be applied in secureFetch method
  }
  
  private setupResponseInterceptors(): void {
    // Response validation will be handled in processResponse method
  }
  
  private async secureRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<APIResponse<T>> {
    try {
      // Check circuit breaker
      if (this.isCircuitBreakerOpen(endpoint)) {
        throw new Error('Service temporarily unavailable');
      }
      
      // Build secure URL
      const url = this.buildSecureURL(endpoint);
      
      // Sanitize request data
      const sanitizedOptions = this.sanitizeRequestOptions(options);
      
      // Make secure request
      const response = await securityMiddleware.secureFetch(url, sanitizedOptions);
      
      // Process response
      const result = await this.processResponse<T>(response);
      
      // Reset circuit breaker on success
      this.resetCircuitBreaker(endpoint);
      
      return result;
    } catch (error) {
      // Handle errors and retry if necessary
      return this.handleRequestError(error, endpoint, options, retryCount);
    }
  }
  
  private buildSecureURL(endpoint: string): string {
    // Ensure HTTPS
    const url = new URL(endpoint, this.baseURL);
    if (url.protocol !== 'https:') {
      url.protocol = 'https:';
    }
    
    return url.toString();
  }
  
  private sanitizeRequestOptions(options: RequestInit): RequestInit {
    const sanitized = { ...options };
    
    // Sanitize request body
    if (sanitized.body && typeof sanitized.body === 'string') {
      try {
        const data = JSON.parse(sanitized.body);
        const sanitizedData = securityUtils.xss.sanitizeInput(JSON.stringify(data));
        sanitized.body = sanitizedData;
      } catch {
        // If not JSON, sanitize as string
        sanitized.body = securityUtils.xss.sanitizeInput(sanitized.body);
      }
    }
    
    // Sanitize URL parameters
    if (sanitized.body instanceof URLSearchParams) {
      const sanitizedParams = new URLSearchParams();
      for (const [key, value] of sanitized.body.entries()) {
        sanitizedParams.append(
          securityUtils.xss.sanitizeInput(key),
          securityUtils.xss.sanitizeInput(value)
        );
      }
      sanitized.body = sanitizedParams;
    }
    
    // Set timeout
    sanitized.signal = AbortSignal.timeout(this.timeout);
    
    return sanitized;
  }
  
  private async processResponse<T>(response: Response): Promise<APIResponse<T>> {
    // Validate response
    this.validateResponse(response);
    
    // Parse response data
    let data: T;
    try {
      const responseText = await response.text();
      
      // Sanitize response data
      const sanitizedText = securityUtils.xss.sanitizeInput(responseText);
      
      // Parse JSON
      data = JSON.parse(sanitizedText);
    } catch (error) {
      throw new Error('Invalid response format');
    }
    
    // Build API response
    return {
      success: response.ok,
      data,
      timestamp: new Date().toISOString(),
    };
  }
  
  private validateResponse(response: Response): void {
    // Check response headers
    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.includes('application/json')) {
      console.warn('Unexpected content type:', contentType);
    }
    
    // Validate status code
    if (response.status >= 500) {
      throw new Error('Server error');
    }
    
    if (response.status === 429) {
      throw new Error('Rate limit exceeded');
    }
  }
  
  private handleRequestError(
    error: any,
    endpoint: string,
    options: RequestInit,
    retryCount: number
  ): Promise<APIResponse<any>> {
    // Record failure for circuit breaker
    this.recordFailure(endpoint);
    
    // Handle specific error types
    if (error.name === 'AbortError') {
      return Promise.reject({
        success: false,
        error: 'Request timeout',
        timestamp: new Date().toISOString(),
      });
    }
    
    if (error.message === 'Rate limit exceeded') {
      return Promise.reject({
        success: false,
        error: 'Too many requests. Please try again later.',
        timestamp: new Date().toISOString(),
      });
    }
    
    // Retry if possible
    if (retryCount < this.retryAttempts && this.shouldRetry(error)) {
      return this.delayRetry().then(() =>
        this.secureRequest(endpoint, options, retryCount + 1)
      );
    }
    
    // Return error response
    return Promise.reject({
      success: false,
      error: error.message || 'Request failed',
      timestamp: new Date().toISOString(),
    });
  }
  
  private shouldRetry(error: any): boolean {
    // Retry on network errors and 5xx status codes
    return error.message === 'Network error' || 
           error.message === 'Server error' ||
           error.name === 'TypeError';
  }
  
  private delayRetry(): Promise<void> {
    // Exponential backoff
    const delay = Math.pow(2, Math.random() * 2) * 1000;
    return new Promise(resolve => setTimeout(resolve, delay));
  }
  
  private isCircuitBreakerOpen(endpoint: string): boolean {
    const state = this.circuitBreaker.get(endpoint);
    if (!state || !state.isOpen) {
      return false;
    }
    
    // Check if circuit should be reset
    const timeSinceLastFailure = Date.now() - state.lastFailure;
    if (timeSinceLastFailure > 60000) { // 1 minute
      this.resetCircuitBreaker(endpoint);
      return false;
    }
    
    return true;
  }
  
  private recordFailure(endpoint: string): void {
    const state = this.circuitBreaker.get(endpoint) || {
      failures: 0,
      lastFailure: 0,
      isOpen: false,
    };
    
    state.failures++;
    state.lastFailure = Date.now();
    
    // Open circuit if too many failures
    if (state.failures >= 5) {
      state.isOpen = true;
      toast.error('Service temporarily unavailable. Please try again later.');
    }
    
    this.circuitBreaker.set(endpoint, state);
  }
  
  private resetCircuitBreaker(endpoint: string): void {
    this.circuitBreaker.delete(endpoint);
  }
  
  // Public API methods
  public async get<T>(endpoint: string, params?: Record<string, any>): Promise<APIResponse<T>> {
    const url = new URL(endpoint, this.baseURL);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }
    
    return this.secureRequest<T>(url.pathname + url.search, {
      method: 'GET',
    });
  }
  
  public async post<T>(endpoint: string, data?: any): Promise<APIResponse<T>> {
    return this.secureRequest<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
  
  public async put<T>(endpoint: string, data?: any): Promise<APIResponse<T>> {
    return this.secureRequest<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
  
  public async delete<T>(endpoint: string): Promise<APIResponse<T>> {
    return this.secureRequest<T>(endpoint, {
      method: 'DELETE',
    });
  }
  
  public async upload<T>(endpoint: string, file: File, additionalData?: any): Promise<APIResponse<T>> {
    // Validate file
    if (!securityMiddleware.validateFileUpload(file)) {
      throw new Error('Invalid file upload');
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }
    
    return this.secureRequest<T>(endpoint, {
      method: 'POST',
      body: formData,
    });
  }
  
  public setBaseURL(url: string): void {
    this.baseURL = url;
  }
  
  public setTimeout(timeout: number): void {
    this.timeout = timeout;
  }
  
  public setRetryAttempts(attempts: number): void {
    this.retryAttempts = attempts;
  }
}

// Export singleton instance
export const secureAPI = SecureAPIClient.getInstance();

// Hook for using secure API client
export const useSecureAPI = () => {
  return secureAPI;
};

export default secureAPI;