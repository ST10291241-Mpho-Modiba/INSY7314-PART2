/**
 * Content Security Policy (CSP) utilities
 * Provides functions for setting up and managing CSP headers
 */

export interface CSPConfig {
  defaultSrc?: string[];
  scriptSrc?: string[];
  styleSrc?: string[];
  imgSrc?: string[];
  connectSrc?: string[];
  fontSrc?: string[];
  objectSrc?: string[];
  mediaSrc?: string[];
  frameSrc?: string[];
  baseUri?: string[];
  formAction?: string[];
  frameAncestors?: string[];
  upgradeInsecureRequests?: boolean;
}

export class CSPManager {
  private static instance: CSPManager;
  private config: CSPConfig;
  
  private constructor() {
    this.config = this.getDefaultConfig();
  }
  
  public static getInstance(): CSPManager {
    if (!CSPManager.instance) {
      CSPManager.instance = new CSPManager();
    }
    return CSPManager.instance;
  }
  
  private getDefaultConfig(): CSPConfig {
    return {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Required for React development
        "'unsafe-eval'", // Required for some libraries
        'https://cdnjs.cloudflare.com',
        'https://unpkg.com',
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Required for Tailwind CSS
        'https://fonts.googleapis.com',
        'https://cdnjs.cloudflare.com',
      ],
      imgSrc: [
        "'self'",
        'data:',
        'https:',
        'http:',
      ],
      connectSrc: [
        "'self'",
        // Local development endpoints
        'http://localhost:5000',
        'http://localhost:3000',
        'http://localhost:3001',
        'ws://localhost:3000',
        'ws://localhost:3001',
        // Production / external APIs
        'https://api.trae-api-sg.mchost.guru',
        'wss://*.supabase.co',
        'https://*.supabase.co',
      ],
      fontSrc: [
        "'self'",
        'https://fonts.gstatic.com',
        'data:',
      ],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      // In dev over http, do not auto-upgrade requests
      upgradeInsecureRequests: (typeof window !== 'undefined' && window.location.protocol === 'https:'),
    };
  }
  
  public generateCSPHeader(): string {
    const directives: string[] = [];
    
    Object.entries(this.config).forEach(([key, value]) => {
      if (key === 'upgradeInsecureRequests') {
        if (value) {
          directives.push('upgrade-insecure-requests');
        }
      } else if (Array.isArray(value)) {
        const directiveName = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        directives.push(`${directiveName} ${value.join(' ')}`);
      }
    });
    
    return directives.join('; ');
  }
  
  public updateConfig(newConfig: Partial<CSPConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.applyCSP();
  }
  
  public applyCSP(): void {
    const cspHeader = this.generateCSPHeader();
    
    // Remove existing CSP meta tag if it exists
    const existingMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (existingMeta) {
      existingMeta.remove();
    }
    
    // Add new CSP meta tag
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = cspHeader;
    document.head.appendChild(meta);
    
    console.log('CSP Applied:', cspHeader);
  }
  
  public addTrustedDomain(domain: string): void {
    const domains = [
      'scriptSrc',
      'styleSrc',
      'imgSrc',
      'connectSrc',
      'fontSrc',
      'mediaSrc',
      'frameSrc',
    ] as const;
    
    domains.forEach(directive => {
      if (!this.config[directive]?.includes(domain)) {
        this.config[directive] = [...(this.config[directive] || []), domain];
      }
    });
    
    this.applyCSP();
  }
  
  public removeTrustedDomain(domain: string): void {
    Object.keys(this.config).forEach(key => {
      const directive = key as keyof CSPConfig;
      const currentValue = this.config[directive];
      if (Array.isArray(currentValue)) {
        (this.config as any)[directive] = currentValue.filter((d: string) => d !== domain);
      }
    });
    
    this.applyCSP();
  }
}

// XSS Protection utilities
export class XSSProtection {
  private static readonly DANGEROUS_TAGS = [
    'script',
    'iframe',
    'object',
    'embed',
    'form',
    'input',
    'textarea',
    'button',
  ];
  
  private static readonly DANGEROUS_ATTRIBUTES = [
    'onload',
    'onunload',
    'onclick',
    'ondblclick',
    'onmousedown',
    'onmouseup',
    'onmouseover',
    'onmousemove',
    'onmouseout',
    'onfocus',
    'onblur',
    'onkeypress',
    'onkeydown',
    'onkeyup',
    'onsubmit',
    'onreset',
    'onselect',
    'onchange',
    'href',
    'src',
    'style',
  ];
  
  public static sanitizeHTML(html: string): string {
    // Create a temporary DOM element to parse HTML
    const div = document.createElement('div');
    div.innerHTML = html;
    
    // Remove dangerous tags
    this.DANGEROUS_TAGS.forEach(tag => {
      const elements = div.getElementsByTagName(tag);
      Array.from(elements).forEach(element => {
        element.remove();
      });
    });
    
    // Remove dangerous attributes from all elements
    this.removeDangerousAttributes(div);
    
    return div.innerHTML;
  }
  
  private static removeDangerousAttributes(element: Element): void {
    const elements = element.getElementsByTagName('*');
    Array.from(elements).forEach(el => {
      this.DANGEROUS_ATTRIBUTES.forEach(attr => {
        if (el.hasAttribute(attr)) {
          el.removeAttribute(attr);
        }
      });
      
      // Remove javascript: protocol from href and src
      ['href', 'src'].forEach(attr => {
        if (el.hasAttribute(attr)) {
          const value = el.getAttribute(attr);
          if (value && value.toLowerCase().startsWith('javascript:')) {
            el.removeAttribute(attr);
          }
        }
      });
    });
  }
  
  public static sanitizeInput(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }
    
    // Escape HTML entities
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
  
  public static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && !this.containsXSS(email);
  }
  
  public static validateURL(url: string): boolean {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol) && 
             !this.containsXSS(url);
    } catch {
      return false;
    }
  }
  
  public static containsXSS(input: string): boolean {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /data:text\/html/gi,
      /vbscript:/gi,
      /onload\s*=/gi,
      /onerror\s*=/gi,
    ];
    
    return xssPatterns.some(pattern => pattern.test(input));
  }
  
  public static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/\.+/g, '.')
      .toLowerCase()
      .trim();
  }
}

// Secure Token Storage
export class SecureTokenStorage {
  private static readonly TOKEN_KEY = 'auth_token';
  private static readonly REFRESH_KEY = 'refresh_token';
  private static readonly EXPIRY_KEY = 'token_expiry';
  private static readonly ENCRYPTION_KEY = 'token_encryption_key';
  
  private static instance: SecureTokenStorage;
  private encryptionKey: string;
  
  private constructor() {
    this.encryptionKey = this.generateEncryptionKey();
  }
  
  public static getInstance(): SecureTokenStorage {
    if (!SecureTokenStorage.instance) {
      SecureTokenStorage.instance = new SecureTokenStorage();
    }
    return SecureTokenStorage.instance;
  }
  
  private generateEncryptionKey(): string {
    let key = localStorage.getItem(SecureTokenStorage.ENCRYPTION_KEY);
    if (!key) {
      key = this.generateRandomKey();
      localStorage.setItem(SecureTokenStorage.ENCRYPTION_KEY, key);
    }
    return key;
  }
  
  private generateRandomKey(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  
  private encrypt(data: string): string {
    // Simple XOR encryption (in production, use proper encryption)
    let encrypted = '';
    for (let i = 0; i < data.length; i++) {
      encrypted += String.fromCharCode(
        data.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length)
      );
    }
    return btoa(encrypted);
  }
  
  private decrypt(encrypted: string): string {
    try {
      const decoded = atob(encrypted);
      let decrypted = '';
      for (let i = 0; i < decoded.length; i++) {
        decrypted += String.fromCharCode(
          decoded.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length)
        );
      }
      return decrypted;
    } catch {
      return '';
    }
  }
  
  public setToken(token: string, expiresIn?: number): void {
    try {
      const encrypted = this.encrypt(token);
      localStorage.setItem(SecureTokenStorage.TOKEN_KEY, encrypted);
      
      if (expiresIn) {
        const expiry = Date.now() + expiresIn * 1000;
        localStorage.setItem(SecureTokenStorage.EXPIRY_KEY, expiry.toString());
      }
      
      // Add to session storage as backup
      sessionStorage.setItem(SecureTokenStorage.TOKEN_KEY + '_backup', encrypted);
    } catch (error) {
      console.error('Failed to store token securely:', error);
      // Fallback to regular storage
      localStorage.setItem(SecureTokenStorage.TOKEN_KEY, token);
    }
  }
  
  public getToken(): string | null {
    try {
      const encrypted = localStorage.getItem(SecureTokenStorage.TOKEN_KEY);
      if (!encrypted) return null;
      
      // Check expiry
      const expiry = localStorage.getItem(SecureTokenStorage.EXPIRY_KEY);
      if (expiry && Date.now() > parseInt(expiry)) {
        this.removeToken();
        return null;
      }
      
      return this.decrypt(encrypted);
    } catch (error) {
      console.error('Failed to retrieve token:', error);
      
      // Try backup from session storage
      const backup = sessionStorage.getItem(SecureTokenStorage.TOKEN_KEY + '_backup');
      if (backup) {
        try {
          return this.decrypt(backup);
        } catch {
          return null;
        }
      }
      
      return null;
    }
  }
  
  public removeToken(): void {
    try {
      localStorage.removeItem(SecureTokenStorage.TOKEN_KEY);
      localStorage.removeItem(SecureTokenStorage.EXPIRY_KEY);
      sessionStorage.removeItem(SecureTokenStorage.TOKEN_KEY + '_backup');
    } catch (error) {
      console.error('Failed to remove token:', error);
    }
  }
  
  public setRefreshToken(token: string): void {
    try {
      const encrypted = this.encrypt(token);
      localStorage.setItem(SecureTokenStorage.REFRESH_KEY, encrypted);
      
      // Add to session storage as backup
      sessionStorage.setItem(SecureTokenStorage.REFRESH_KEY + '_backup', encrypted);
    } catch (error) {
      console.error('Failed to store refresh token securely:', error);
      localStorage.setItem(SecureTokenStorage.REFRESH_KEY, token);
    }
  }
  
  public getRefreshToken(): string | null {
    try {
      const encrypted = localStorage.getItem(SecureTokenStorage.REFRESH_KEY);
      if (!encrypted) return null;
      
      return this.decrypt(encrypted);
    } catch (error) {
      console.error('Failed to retrieve refresh token:', error);
      
      // Try backup from session storage
      const backup = sessionStorage.getItem(SecureTokenStorage.REFRESH_KEY + '_backup');
      if (backup) {
        try {
          return this.decrypt(backup);
        } catch {
          return null;
        }
      }
      
      return null;
    }
  }
  
  public removeRefreshToken(): void {
    try {
      localStorage.removeItem(SecureTokenStorage.REFRESH_KEY);
      sessionStorage.removeItem(SecureTokenStorage.REFRESH_KEY + '_backup');
    } catch (error) {
      console.error('Failed to remove refresh token:', error);
    }
  }
  
  public clearAllTokens(): void {
    this.removeToken();
    this.removeRefreshToken();
    localStorage.removeItem(SecureTokenStorage.ENCRYPTION_KEY);
    sessionStorage.clear();
  }
  
  public isTokenExpired(): boolean {
    const expiry = localStorage.getItem(SecureTokenStorage.EXPIRY_KEY);
    if (!expiry) return false;
    
    return Date.now() > parseInt(expiry);
  }
  
  public getTimeUntilExpiry(): number {
    const expiry = localStorage.getItem(SecureTokenStorage.EXPIRY_KEY);
    if (!expiry) return -1;
    
    const timeLeft = parseInt(expiry) - Date.now();
    return Math.max(0, timeLeft);
  }
}

// Security utilities export
export const securityUtils = {
  csp: CSPManager.getInstance(),
  xss: XSSProtection,
  tokenStorage: SecureTokenStorage.getInstance(),
};

export default securityUtils;