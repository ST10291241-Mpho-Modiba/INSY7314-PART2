// Global type definitions for the banking application

export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  preferences: UserPreferences;
  securitySettings: SecuritySettings;
  lastLogin?: Date;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  currency: string;
  notifications: NotificationPreferences;
  accessibility: AccessibilitySettings;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  transactionAlerts: boolean;
  securityAlerts: boolean;
  marketingEmails: boolean;
}

export interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  screenReaderSupport: boolean;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  passwordExpiry: Date;
  loginAttempts: number;
  accountLockedUntil?: Date;
  trustedDevices: TrustedDevice[];
}

export interface TrustedDevice {
  id: string;
  deviceName: string;
  deviceType: string;
  lastUsed: Date;
  isTrusted: boolean;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  recipient: string;
  recipientAccount?: string;
  type: TransactionType;
  status: TransactionStatus;
  referenceNumber: string;
  description?: string;
  metadata?: Record<string, any>;
  feeAmount: number;
  exchangeRate?: number;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type TransactionType = 
  | 'payment'
  | 'transfer'
  | 'deposit'
  | 'withdrawal'
  | 'refund'
  | 'fee';

export type TransactionStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'refunded';

export interface PaymentDraft {
  id: string;
  amount: number;
  currency: string;
  recipient: string;
  recipientAccount?: string;
  description?: string;
  scheduledFor?: Date;
  isRecurring: boolean;
  recurrenceRule?: RecurrenceRule;
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  endDate?: Date;
  maxOccurrences?: number;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  priority: 'low' | 'normal' | 'high' | 'critical';
  data?: Record<string, any>;
  expiresAt?: Date;
  createdAt: Date;
}

export type NotificationType = 
  | 'transaction_success'
  | 'transaction_failed'
  | 'security_alert'
  | 'system_maintenance'
  | 'account_update'
  | 'payment_reminder'
  | 'login_alert';

export interface Session {
  id: string;
  userId: string;
  token: string;
  deviceInfo: DeviceInfo;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
  lastActivity: Date;
  isActive: boolean;
  createdAt: Date;
}

export interface DeviceInfo {
  deviceName: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  os: string;
  browser: string;
  isMobile: boolean;
}

export interface ErrorLog {
  id: string;
  userId?: string;
  errorType: string;
  errorMessage: string;
  stackTrace?: string;
  requestUrl?: string;
  requestMethod?: string;
  requestData?: Record<string, any>;
  userAgent?: string;
  ipAddress?: string;
  sessionId?: string;
  resolved: boolean;
  createdAt: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
  timestamp: Date;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  field?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PaymentFilters {
  status?: TransactionStatus[];
  type?: TransactionType[];
  dateFrom?: Date;
  dateTo?: Date;
  amountMin?: number;
  amountMax?: number;
  currency?: string[];
  search?: string;
}

export interface OfflineState {
  isOnline: boolean;
  queuedActions: QueuedAction[];
  lastSync: Date | null;
  syncStatus: 'idle' | 'syncing' | 'error' | 'success';
}

export interface QueuedAction {
  id: string;
  type: string;
  data: any;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
}

export interface SecurityIndicator {
  type: 'ssl' | 'encryption' | 'authentication' | 'verification';
  status: 'secure' | 'warning' | 'insecure';
  message: string;
  details?: string;
}

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  message?: string;
  validator?: (value: any) => boolean | string;
}

export interface FormField {
  name: string;
  label: string;
  type: string;
  placeholder?: string;
  required: boolean;
  validation?: ValidationRule[];
  options?: { value: string; label: string }[];
  disabled?: boolean;
  autoComplete?: string;
}

export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
    };
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}