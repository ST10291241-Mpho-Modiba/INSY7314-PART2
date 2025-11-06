import { z } from 'zod';

// Base validation schemas
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .max(254, 'Email must be less than 255 characters');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 129 characters')
  .refine(
    (password) => /[a-z]/.test(password),
    'Password must contain at least one lowercase letter'
  )
  .refine(
    (password) => /[A-Z]/.test(password),
    'Password must contain at least one uppercase letter'
  )
  .refine(
    (password) => /\d/.test(password),
    'Password must contain at least one number'
  )
  .refine(
    (password) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    'Password must contain at least one special character'
  );

export const phoneSchema = z
  .string()
  .regex(
    /^\+?[1-9]\d{1,14}$/,
    'Please enter a valid phone number (e.g., +1234567890)'
  );

export const nameSchema = z
  .string()
  .min(1, 'This field is required')
  .max(50, 'Name must be less than 51 characters')
  .regex(
    /^[a-zA-Z\s'-]+$/,
    'Name can only contain letters, spaces, hyphens, and apostrophes'
  );

// Banking-specific validation schemas
export const accountNumberSchema = z
  .string()
  .regex(
    /^\d{8,17}$/,
    'Account number must be between 8 and 17 digits'
  );

export const routingNumberSchema = z
  .string()
  .regex(
    /^\d{9}$/,
    'Routing number must be exactly 9 digits'
  );

export const amountSchema = z
  .number()
  .positive('Amount must be greater than 0')
  .max(999999.99, 'Amount must be less than $1,000,000')
  .refine(
    (amount) => /^(\d+\.?\d{0,2})$/.test(amount.toString()),
    'Amount can have at most 2 decimal places'
  );

export const currencySchema = z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD']);

// Payment validation schemas
export const paymentRecipientSchema = z.object({
  name: nameSchema,
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  accountNumber: accountNumberSchema.optional(),
  routingNumber: routingNumberSchema.optional()
}).refine(
  (data) => data.email || data.phone || (data.accountNumber && data.routingNumber),
  'Must provide either email, phone, or bank account details'
);

export const paymentAmountSchema = z.object({
  amount: amountSchema,
  currency: currencySchema
});

export const paymentDescriptionSchema = z
  .string()
  .max(255, 'Description must be less than 256 characters')
  .optional();

// User profile validation schemas
export const userProfileSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  phone: phoneSchema.optional(),
  dateOfBirth: z.string().optional(),
  address: z.object({
    street: z.string().min(1, 'Street address is required').max(100),
    city: z.string().min(1, 'City is required').max(50),
    state: z.string().min(2, 'State is required').max(2),
    zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code'),
    country: z.string().min(2, 'Country is required').max(2)
  }).optional()
});

// Security validation schemas
export const securityQuestionSchema = z.object({
  question: z.string().min(10, 'Question must be at least 10 characters').max(200),
  answer: z.string().min(3, 'Answer must be at least 3 characters').max(50)
});

export const twoFactorCodeSchema = z
  .string()
  .regex(/^\d{6}$/, 'Code must be exactly 6 digits');

// Transaction validation schemas
export const transactionFilterSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),
  category: z.string().optional(),
  status: z.enum(['pending', 'completed', 'failed', 'cancelled']).optional()
});

// Form validation utilities
export const validationUtils = {
  // Validate email format
  isValidEmail: (email: string): boolean => {
    return emailSchema.safeParse(email).success;
  },

  // Validate password strength
  getPasswordStrength: (password: string): { score: number; feedback: string[] } => {
    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('At least 8 characters');
    }

    // Character type checks
    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Lowercase letter');
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Uppercase letter');
    }

    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('Number');
    }

    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Special character');
    }

    // Bonus for length
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;

    return { score: Math.min(score, 6), feedback };
  },

  // Validate phone number format
  isValidPhone: (phone: string): boolean => {
    return phoneSchema.safeParse(phone).success;
  },

  // Validate account number
  isValidAccountNumber: (accountNumber: string): boolean => {
    return accountNumberSchema.safeParse(accountNumber).success;
  },

  // Validate routing number
  isValidRoutingNumber: (routingNumber: string): boolean => {
    return routingNumberSchema.safeParse(routingNumber).success;
  },

  // Validate amount
  isValidAmount: (amount: number): boolean => {
    return amountSchema.safeParse(amount).success;
  },

  // Format currency
  formatCurrency: (amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  },

  // Parse currency input
  parseCurrency: (value: string): number => {
    // Remove currency symbols and commas
    const cleanValue = value.replace(/[$,]/g, '');
    return parseFloat(cleanValue) || 0;
  },

  // Validate date range
  isValidDateRange: (startDate: string, endDate: string): boolean => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return start <= end;
  },

  // Calculate age from date of birth
  calculateAge: (dateOfBirth: string): number => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  },

  // Validate age requirement
  meetsAgeRequirement: (dateOfBirth: string, minimumAge: number = 18): boolean => {
    return validationUtils.calculateAge(dateOfBirth) >= minimumAge;
  }
};

// Error message utilities
export const errorMessages = {
  // Generic error messages
  required: 'This field is required',
  invalid: 'Please enter a valid value',
  tooShort: (min: number) => `Must be at least ${min} characters`,
  tooLong: (max: number) => `Must be less than ${max} characters`,
  
  // Specific error messages
  email: 'Please enter a valid email address',
  password: 'Password does not meet requirements',
  phone: 'Please enter a valid phone number',
  amount: 'Please enter a valid amount',
  accountNumber: 'Please enter a valid account number',
  routingNumber: 'Please enter a valid routing number',
  date: 'Please enter a valid date',
  dateRange: 'End date must be after start date',
  
  // Security error messages
  weakPassword: 'Password is too weak. Please use a stronger password',
  commonPassword: 'This password is too common. Please choose a different one',
  
  // Payment error messages
  insufficientFunds: 'Insufficient funds for this transaction',
  invalidRecipient: 'Please enter valid recipient information',
  dailyLimit: 'Daily transaction limit exceeded',
  monthlyLimit: 'Monthly transaction limit exceeded'
};

// Validation helper functions
export const validationHelpers = {
  // Sanitize input
  sanitizeInput: (input: string): string => {
    return input.trim().replace(/[<>]/g, '');
  },

  // Validate file upload
  validateFileUpload: (
    file: File,
    allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/gif'],
    maxSize: number = 5 * 1024 * 1024 // 5MB
  ): { valid: boolean; error?: string } => {
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'File type not allowed' };
    }
    
    if (file.size > maxSize) {
      return { valid: false, error: 'File size too large' };
    }
    
    return { valid: true };
  },

  // Validate URL
  isValidUrl: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  // Validate JSON
  isValidJson: (json: string): boolean => {
    try {
      JSON.parse(json);
      return true;
    } catch {
      return false;
    }
  },

  // Generate validation error message
  getValidationError: (error: any): string => {
    if (error?.message) {
      return error.message;
    }
    
    if (error?.issues?.length > 0) {
      return error.issues[0].message;
    }
    
    return errorMessages.invalid;
  }
};

// Export all validation utilities
export default {
  emailSchema,
  passwordSchema,
  phoneSchema,
  nameSchema,
  accountNumberSchema,
  routingNumberSchema,
  amountSchema,
  currencySchema,
  paymentRecipientSchema,
  paymentAmountSchema,
  paymentDescriptionSchema,
  userProfileSchema,
  securityQuestionSchema,
  twoFactorCodeSchema,
  transactionFilterSchema,
  validationUtils,
  errorMessages,
  validationHelpers
};