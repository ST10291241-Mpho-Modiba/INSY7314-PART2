import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  PhoneIcon,
  IdentificationIcon,
  CalendarIcon,
  MapPinIcon,
  ExclamationTriangleIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import api from '../api/axiosConfig';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { useToast } from '../contexts/ToastContext';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { Button, Input, Select } from './ui';
import { useServiceWorker } from '../hooks/useServiceWorker';
import PasswordStrengthMeter from './PasswordStrengthMeter';
import SecurityChecklist from './SecurityChecklist';

// Enhanced validation schema with additional security fields
const signupSchema = z.object({
  personalInfo: z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters').regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters').regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
    dateOfBirth: z.string().refine((date) => {
      const birthDate = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= 18;
    }, 'You must be at least 18 years old'),
    phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number'),
    identificationNumber: z.string().min(5, 'ID number must be at least 5 characters').regex(/^[a-zA-Z0-9]+$/, 'ID can only contain letters and numbers')
  }),
  
  accountDetails: z.object({
    username: z.string().min(3, 'Username must be at least 3 characters').max(20, 'Username cannot exceed 20 characters').regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    email: z.string().email('Please enter a valid email address').regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Please enter a valid email address'),
    country: z.string().min(1, 'Please select your country'),
    state: z.string().optional(),
    city: z.string().min(1, 'Please enter your city'),
    address: z.string().min(5, 'Please enter your full address')
  }),
  
  security: z.object({
    password: z.string()
      .min(12, 'Password must be at least 12 characters')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/\d/, 'Password must contain at least one number')
      .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Password must contain at least one special character'),
    confirmPassword: z.string(),
    securityQuestion: z.string().min(1, 'Please select a security question'),
    securityAnswer: z.string().min(3, 'Security answer must be at least 3 characters'),
    twoFactorEnabled: z.boolean().optional(),
    biometricEnabled: z.boolean().optional()
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  }),
  
  preferences: z.object({
    accountType: z.enum(['personal', 'business']),
    currency: z.enum(['USD', 'EUR', 'GBP', 'CAD']),
    notifications: z.object({
      email: z.boolean(),
      sms: z.boolean(),
      push: z.boolean()
    }),
    marketing: z.boolean().optional()
  }),
  
  agreements: z.object({
    termsOfService: z.boolean().refine((val) => val === true, {
      message: 'You must accept the Terms of Service'
    }),
    privacyPolicy: z.boolean().refine((val) => val === true, {
      message: 'You must accept the Privacy Policy'
    }),
    dataProcessing: z.boolean().refine((val) => val === true, {
      message: 'You must consent to data processing'
    })
  })
});

type SignupFormData = z.infer<typeof signupSchema>;

interface SecurityCheck {
  id: string;
  label: string;
  description: string;
  status: 'pending' | 'passed' | 'failed';
}

const Signup: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSecurityAnswer, setShowSecurityAnswer] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [securityChecks, setSecurityChecks] = useState<SecurityCheck[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineMode, setOfflineMode] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [countryList, setCountryList] = useState<Array<{code: string, name: string}>>([]);
  const [currencyList] = useState(['USD', 'EUR', 'GBP', 'CAD']);

  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useUI();
  const { showSuccess, showError, showInfo } = useToast();
  const { handleError } = useErrorHandler();
  const { serviceWorkerManager } = useServiceWorker();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    trigger,
    getValues,
    setValue,
    clearErrors
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: 'onChange',
    defaultValues: {
      personalInfo: {
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        phoneNumber: '',
        identificationNumber: ''
      },
      accountDetails: {
        username: '',
        email: '',
        country: '',
        state: '',
        city: '',
        address: ''
      },
      security: {
        password: '',
        confirmPassword: '',
        securityQuestion: '',
        securityAnswer: '',
        twoFactorEnabled: true,
        biometricEnabled: false
      },
      preferences: {
        accountType: 'personal',
        currency: 'USD',
        notifications: {
          email: true,
          sms: false,
          push: true
        },
        marketing: false
      },
      agreements: {
        termsOfService: false,
        privacyPolicy: false,
        dataProcessing: false
      }
    }
  });

  const watchedPassword = watch('security.password');
  const watchedEmail = watch('accountDetails.email');
  const watchedUsername = watch('accountDetails.username');
  const watchedCountry = watch('accountDetails.country');

  // Initialize component
  useEffect(() => {
    initializeComponent();
  }, []);

  // Online/offline status monitoring
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setOfflineMode(false);
      showInfo('Connection restored');
    };

    const handleOffline = () => {
      setIsOnline(false);
      setOfflineMode(true);
      showInfo('Working in offline mode');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showInfo]);

  // Check biometric support
  useEffect(() => {
    checkBiometricSupport();
  }, []);

  // Load country list
  useEffect(() => {
    loadCountryList();
  }, []);

  // Real-time email availability check
  useEffect(() => {
    const checkEmailAvailability = async () => {
      if (watchedEmail && !errors.accountDetails?.email) {
        setIsCheckingEmail(true);
        try {
          const response = await api.post('/api/auth/check-email', { email: watchedEmail });
          setEmailAvailable(response.data.available);
        } catch (error) {
          setEmailAvailable(null);
        } finally {
          setIsCheckingEmail(false);
        }
      } else {
        setEmailAvailable(null);
      }
    };

    const debounceTimer = setTimeout(checkEmailAvailability, 500);
    return () => clearTimeout(debounceTimer);
  }, [watchedEmail, errors.accountDetails?.email]);

  // Real-time username availability check
  useEffect(() => {
    const checkUsernameAvailability = async () => {
      if (watchedUsername && !errors.accountDetails?.username) {
        setIsCheckingUsername(true);
        try {
          const response = await api.post('/api/auth/check-username', { username: watchedUsername });
          setUsernameAvailable(response.data.available);
        } catch (error) {
          setUsernameAvailable(null);
        } finally {
          setIsCheckingUsername(false);
        }
      } else {
        setUsernameAvailable(null);
      }
    };

    const debounceTimer = setTimeout(checkUsernameAvailability, 500);
    return () => clearTimeout(debounceTimer);
  }, [watchedUsername, errors.accountDetails?.username]);

  // Update security checks when password changes
  useEffect(() => {
    if (watchedPassword) {
      updateSecurityChecks(watchedPassword);
    }
  }, [watchedPassword]);

  const initializeComponent = async () => {
    try {
      // Check if user is already logged in
      const token = localStorage.getItem('token');
      if (token) {
        navigate('/payments');
        return;
      }

      // Initialize security checks
      setSecurityChecks([
        { id: 'length', label: 'Minimum 12 characters', description: 'Longer passwords are more secure', status: 'pending' },
        { id: 'lowercase', label: 'Lowercase letter', description: 'Contains at least one lowercase letter', status: 'pending' },
        { id: 'uppercase', label: 'Uppercase letter', description: 'Contains at least one uppercase letter', status: 'pending' },
        { id: 'number', label: 'Number', description: 'Contains at least one number', status: 'pending' },
        { id: 'special', label: 'Special character', description: 'Contains at least one special character', status: 'pending' }
      ]);
    } catch (error) {
      console.error('Error initializing component:', error);
    }
  };

  const checkBiometricSupport = async () => {
    if ('credentials' in navigator && 'create' in navigator.credentials) {
      try {
        const available = await navigator.credentials.create({
          publicKey: {
            challenge: new Uint8Array(32),
            rp: { name: 'Banking App' },
            user: {
              id: new Uint8Array(16),
              name: 'test',
              displayName: 'Test User'
            },
            pubKeyCredParams: [{ alg: -7, type: 'public-key' }]
          }
        });
        setBiometricSupported(true);
      } catch (error) {
        setBiometricSupported(false);
      }
    }
  };

  const loadCountryList = async () => {
    try {
      // Mock country list - in real app, this would come from an API
      const countries = [
        { code: 'US', name: 'United States' },
        { code: 'CA', name: 'Canada' },
        { code: 'GB', name: 'United Kingdom' },
        { code: 'DE', name: 'Germany' },
        { code: 'FR', name: 'France' },
        { code: 'AU', name: 'Australia' },
        { code: 'JP', name: 'Japan' },
        { code: 'CN', name: 'China' }
      ];
      setCountryList(countries);
    } catch (error) {
      console.error('Error loading country list:', error);
    }
  };

  const updateSecurityChecks = (password: string) => {
    const checks: SecurityCheck[] = [
      { id: 'length', label: 'Minimum 12 characters', description: 'Longer passwords are more secure', status: password.length >= 12 ? 'passed' : 'failed' },
      { id: 'lowercase', label: 'Lowercase letter', description: 'Contains at least one lowercase letter', status: /[a-z]/.test(password) ? 'passed' : 'failed' },
      { id: 'uppercase', label: 'Uppercase letter', description: 'Contains at least one uppercase letter', status: /[A-Z]/.test(password) ? 'passed' : 'failed' },
      { id: 'number', label: 'Number', description: 'Contains at least one number', status: /\d/.test(password) ? 'passed' : 'failed' },
      { id: 'special', label: 'Special character', description: 'Contains at least one special character', status: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? 'passed' : 'failed' }
    ];
    setSecurityChecks(checks);
  };

  const nextStep = async () => {
    let fieldsToValidate: string[] = [];
    
    switch (currentStep) {
      case 1:
        fieldsToValidate = ['personalInfo'];
        break;
      case 2:
        fieldsToValidate = ['accountDetails'];
        break;
      case 3:
        fieldsToValidate = ['security'];
        break;
      case 4:
        fieldsToValidate = ['preferences'];
        break;
      default:
        return;
    }

    const isValid = await trigger(fieldsToValidate as any);
    
    if (isValid) {
      // Additional checks for step 2
      if (currentStep === 2) {
        if (emailAvailable === false) {
          showError('This email is already registered. Please use a different email.');
          return;
        }
        if (usernameAvailable === false) {
          showError('This username is already taken. Please choose a different username.');
          return;
        }
      }
      
      // Security validation for step 3
      if (currentStep === 3) {
        const failedChecks = securityChecks.filter(check => check.status === 'failed');
        if (failedChecks.length > 0) {
          showError('Please meet all password security requirements before proceeding.');
          return;
        }
      }
      
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const onSubmit = async (data: SignupFormData) => {
    if (!isOnline && !offlineMode) {
      showError('No internet connection. Please check your connection and try again.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare signup data
      const signupData = {
        ...data.personalInfo,
        ...data.accountDetails,
        password: data.security.password,
        securityQuestion: data.security.securityQuestion,
        securityAnswer: data.security.securityAnswer,
        twoFactorEnabled: data.security.twoFactorEnabled,
        biometricEnabled: data.security.biometricEnabled,
        preferences: data.preferences,
        offlineMode: offlineMode
      };

      // Store data for offline mode if needed
      if (offlineMode && serviceWorkerManager) {
        await serviceWorkerManager.cacheOfflineData('signup_pending', signupData, {
          expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
        });
        showInfo('Signup data saved for offline processing. Will sync when connection is restored.');
        return;
      }

      // Submit signup request
      const response = await api.post('/api/auth/signup', signupData);

      // Store token and update auth context
      const { token, user } = response.data;
      
      // Secure token storage
      if (window.crypto && window.crypto.subtle) {
        // Use secure storage if available
        sessionStorage.setItem('token', token);
      } else {
        localStorage.setItem('token', token);
      }

      await login(user, token);

      // Cache user data for offline access
      if (serviceWorkerManager) {
        await serviceWorkerManager.cacheOfflineData('user_profile', user, {
          expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
        });
      }

      showSuccess('Welcome! Your account has been created successfully.');
      
      // Navigate to appropriate page based on account type
      if (data.preferences.accountType === 'business') {
        navigate('/business-setup');
      } else {
        navigate('/dashboard');
      }

    } catch (error) {
      handleError(error, { context: 'signup', showToast: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 }
  };

  const renderProgressBar = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-white/80">Step {currentStep} of 5</span>
        <span className="text-sm text-white/80">{Math.round((currentStep / 5) * 100)}% Complete</span>
      </div>
      <div className="w-full bg-white/20 rounded-full h-2">
        <motion.div
          className="bg-gradient-to-r from-accent-500 to-success-500 h-2 rounded-full"
          initial={{ width: '20%' }}
          animate={{ width: `${(currentStep / 5) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );

  const renderStep1 = () => (
    <motion.div
      key="step1"
      variants={stepVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-white mb-2">Personal Information</h2>
        <p className="text-white/80 text-sm">Let's start with your basic details for identity verification</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="First Name"
          type="text"
          placeholder="Enter your first name"
          variant="glassmorphism"
          icon={<UserIcon />}
          error={errors.personalInfo?.firstName?.message}
          {...register('personalInfo.firstName')}
        />

        <Input
          label="Last Name"
          type="text"
          placeholder="Enter your last name"
          variant="glassmorphism"
          icon={<UserIcon />}
          error={errors.personalInfo?.lastName?.message}
          {...register('personalInfo.lastName')}
        />
      </div>

      <Input
        label="Date of Birth"
        type="date"
        variant="glassmorphism"
        icon={<CalendarIcon />}
        error={errors.personalInfo?.dateOfBirth?.message}
        {...register('personalInfo.dateOfBirth')}
      />

      <Input
        label="Phone Number"
        type="tel"
        placeholder="+1234567890"
        variant="glassmorphism"
        icon={<PhoneIcon />}
        error={errors.personalInfo?.phoneNumber?.message}
        {...register('personalInfo.phoneNumber')}
      />

      <Input
        label="Government ID Number"
        type="text"
        placeholder="Enter your ID number"
        variant="glassmorphism"
        icon={<IdentificationIcon />}
        error={errors.personalInfo?.identificationNumber?.message}
        {...register('personalInfo.identificationNumber')}
      />
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div
      key="step2"
      variants={stepVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-white mb-2">Account Details</h2>
        <p className="text-white/80 text-sm">Choose your login credentials and location</p>
      </div>

      <div className="relative">
        <Input
          label="Username"
          type="text"
          placeholder="Choose a unique username"
          variant="glassmorphism"
          icon={<UserIcon />}
          error={errors.accountDetails?.username?.message}
          {...register('accountDetails.username')}
        />
        {isCheckingUsername && (
          <div className="absolute right-3 top-9">
            <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></div>
          </div>
        )}
        {usernameAvailable === true && (
          <div className="flex items-center gap-1 mt-1 text-success-300 text-xs">
            <CheckCircleIcon className="h-3 w-3" />
            Username is available
          </div>
        )}
        {usernameAvailable === false && (
          <div className="flex items-center gap-1 mt-1 text-error-300 text-xs">
            <XCircleIcon className="h-3 w-3" />
            Username is already taken
          </div>
        )}
      </div>

      <div className="relative">
        <Input
          label="Email Address"
          type="email"
          placeholder="Enter your email address"
          variant="glassmorphism"
          icon={<EnvelopeIcon />}
          error={errors.accountDetails?.email?.message}
          {...register('accountDetails.email')}
        />
        {isCheckingEmail && (
          <div className="absolute right-3 top-9">
            <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></div>
          </div>
        )}
        {emailAvailable === true && (
          <div className="flex items-center gap-1 mt-1 text-success-300 text-xs">
            <CheckCircleIcon className="h-3 w-3" />
            Email is available
          </div>
        )}
        {emailAvailable === false && (
          <div className="flex items-center gap-1 mt-1 text-error-300 text-xs">
            <XCircleIcon className="h-3 w-3" />
            Email is already registered
          </div>
        )}
      </div>

      <Select
        label="Country"
        variant="glassmorphism"
        icon={<MapPinIcon />}
        error={errors.accountDetails?.country?.message}
        {...register('accountDetails.country')}
      >
        <option value="">Select your country</option>
        {countryList.map(country => (
          <option key={country.code} value={country.code}>{country.name}</option>
        ))}
      </Select>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="City"
          type="text"
          placeholder="Enter your city"
          variant="glassmorphism"
          error={errors.accountDetails?.city?.message}
          {...register('accountDetails.city')}
        />

        <Input
          label="State/Province"
          type="text"
          placeholder="Enter your state"
          variant="glassmorphism"
          error={errors.accountDetails?.state?.message}
          {...register('accountDetails.state')}
        />
      </div>

      <Input
        label="Street Address"
        type="text"
        placeholder="Enter your full address"
        variant="glassmorphism"
        icon={<MapPinIcon />}
        error={errors.accountDetails?.address?.message}
        {...register('accountDetails.address')}
      />
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div
      key="step3"
      variants={stepVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-white mb-2">Security Setup</h2>
        <p className="text-white/80 text-sm">Create a strong password and security questions</p>
      </div>

      <div className="relative">
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Create a strong password"
          variant="glassmorphism"
          icon={<LockClosedIcon />}
          error={errors.security?.password?.message}
          {...register('security.password')}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-9 text-white/60 hover:text-white"
        >
          {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
        </button>
        
        {watchedPassword && (
          <PasswordStrengthMeter password={watchedPassword} />
        )}
      </div>

      <div className="relative">
        <Input
          label="Confirm Password"
          type={showConfirmPassword ? 'text' : 'password'}
          placeholder="Confirm your password"
          variant="glassmorphism"
          icon={<LockClosedIcon />}
          error={errors.security?.confirmPassword?.message}
          {...register('security.confirmPassword')}
        />
        <button
          type="button"
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          className="absolute right-3 top-9 text-white/60 hover:text-white"
        >
          {showConfirmPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
        </button>
      </div>

      {watchedPassword && (
        <SecurityChecklist checks={securityChecks} />
      )}

      <Select
        label="Security Question"
        variant="glassmorphism"
        icon={<ShieldCheckIcon />}
        error={errors.security?.securityQuestion?.message}
        {...register('security.securityQuestion')}
      >
        <option value="">Select a security question</option>
        <option value="mother-maiden">What is your mother's maiden name?</option>
        <option value="first-pet">What was the name of your first pet?</option>
        <option value="birth-city">In what city were you born?</option>
        <option value="first-school">What was the name of your first school?</option>
        <option value="favorite-teacher">Who was your favorite teacher?</option>
      </Select>

      <div className="relative">
        <Input
          label="Security Answer"
          type={showSecurityAnswer ? 'text' : 'password'}
          placeholder="Enter your security answer"
          variant="glassmorphism"
          icon={<ShieldCheckIcon />}
          error={errors.security?.securityAnswer?.message}
          {...register('security.securityAnswer')}
        />
        <button
          type="button"
          onClick={() => setShowSecurityAnswer(!showSecurityAnswer)}
          className="absolute right-3 top-9 text-white/60 hover:text-white"
        >
          {showSecurityAnswer ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
        </button>
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            {...register('security.twoFactorEnabled')}
            className="rounded border-white/30 bg-white/10 text-primary-600 focus:ring-primary-500 focus:ring-offset-0"
          />
          <span className="text-sm text-white/80">Enable two-factor authentication (recommended)</span>
        </label>

        {biometricSupported && (
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              {...register('security.biometricEnabled')}
              className="rounded border-white/30 bg-white/10 text-primary-600 focus:ring-primary-500 focus:ring-offset-0"
            />
            <span className="text-sm text-white/80">Enable biometric authentication</span>
          </label>
        )}
      </div>
    </motion.div>
  );

  const renderStep4 = () => (
    <motion.div
      key="step4"
      variants={stepVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-white mb-2">Account Preferences</h2>
        <p className="text-white/80 text-sm">Customize your account settings</p>
      </div>

      <Select
        label="Account Type"
        variant="glassmorphism"
        {...register('preferences.accountType')}
      >
        <option value="personal">Personal Account</option>
        <option value="business">Business Account</option>
      </Select>

      <Select
        label="Preferred Currency"
        variant="glassmorphism"
        {...register('preferences.currency')}
      >
        {currencyList.map(currency => (
          <option key={currency} value={currency}>{currency}</option>
        ))}
      </Select>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-white/90">Notification Preferences</h3>
        
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            {...register('preferences.notifications.email')}
            className="rounded border-white/30 bg-white/10 text-primary-600 focus:ring-primary-500 focus:ring-offset-0"
          />
          <span className="text-sm text-white/80">Email notifications</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            {...register('preferences.notifications.sms')}
            className="rounded border-white/30 bg-white/10 text-primary-600 focus:ring-primary-500 focus:ring-offset-0"
          />
          <span className="text-sm text-white/80">SMS notifications</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            {...register('preferences.notifications.push')}
            className="rounded border-white/30 bg-white/10 text-primary-600 focus:ring-primary-500 focus:ring-offset-0"
          />
          <span className="text-sm text-white/80">Push notifications</span>
        </label>
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          {...register('preferences.marketing')}
          className="rounded border-white/30 bg-white/10 text-primary-600 focus:ring-primary-500 focus:ring-offset-0"
        />
        <span className="text-sm text-white/80">Send me marketing communications</span>
      </label>
    </motion.div>
  );

  const renderStep5 = () => (
    <motion.div
      key="step5"
      variants={stepVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-white mb-2">Legal Agreements</h2>
        <p className="text-white/80 text-sm">Review and accept our terms to complete registration</p>
      </div>

      <div className="bg-white/10 rounded-lg p-4 max-h-32 overflow-y-auto">
        <h4 className="font-medium text-white mb-2">Terms of Service</h4>
        <p className="text-white/80 text-xs leading-relaxed">
          By creating an account, you agree to our Terms of Service. We are committed to protecting your personal information 
          and ensuring the security of your banking data. Your account will be protected with industry-standard encryption 
          and security measures. You acknowledge that you are at least 18 years old and have the legal capacity to enter 
          into this agreement.
        </p>
      </div>

      <div className="bg-white/10 rounded-lg p-4 max-h-32 overflow-y-auto">
        <h4 className="font-medium text-white mb-2">Privacy Policy</h4>
        <p className="text-white/80 text-xs leading-relaxed">
          We collect and process your personal data in accordance with our Privacy Policy. This includes identity verification, 
          transaction processing, and fraud prevention. Your data will be stored securely and will not be shared with third 
          parties without your consent, except as required by law or for banking operations.
        </p>
      </div>

      <div className="bg-white/10 rounded-lg p-4 max-h-32 overflow-y-auto">
        <h4 className="font-medium text-white mb-2">Data Processing Consent</h4>
        <p className="text-white/80 text-xs leading-relaxed">
          I consent to the processing of my personal data for account creation, identity verification, and banking services. 
          I understand that I can withdraw this consent at any time by contacting support.
        </p>
      </div>

      <div className="space-y-3">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            {...register('agreements.termsOfService')}
            className="mt-1 rounded border-white/30 bg-white/10 text-primary-600 focus:ring-primary-500 focus:ring-offset-0"
          />
          <span className="text-sm text-white/80">
            I accept the{' '}
            <Link to="/terms" className="text-white underline hover:no-underline">
              Terms of Service
            </Link>
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            {...register('agreements.privacyPolicy')}
            className="mt-1 rounded border-white/30 bg-white/10 text-primary-600 focus:ring-primary-500 focus:ring-offset-0"
          />
          <span className="text-sm text-white/80">
            I accept the{' '}
            <Link to="/privacy" className="text-white underline hover:no-underline">
              Privacy Policy
            </Link>
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            {...register('agreements.dataProcessing')}
            className="mt-1 rounded border-white/30 bg-white/10 text-primary-600 focus:ring-primary-500 focus:ring-offset-0"
          />
          <span className="text-sm text-white/80">
            I consent to data processing as described above
          </span>
        </label>
      </div>

      {offlineMode && (
        <div className="bg-warning-500/20 border border-warning-500/50 rounded-lg p-4 flex items-start gap-3">
          <ExclamationTriangleIcon className="h-5 w-5 text-warning-400 mt-0.5" />
          <div>
            <h4 className="text-warning-300 font-medium mb-1">Offline Mode</h4>
            <p className="text-warning-200 text-sm">
              You're currently offline. Your signup will be processed when connection is restored.
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl"
      >
        {/* Connection Status */}
        {!isOnline && (
          <div className="mb-4 bg-error-500/20 border border-error-500/50 rounded-lg p-3 flex items-center gap-2">
            <ExclamationTriangleIcon className="h-4 w-4 text-error-400" />
            <span className="text-error-300 text-sm">Offline mode - some features may be limited</span>
          </div>
        )}

        {/* Main Signup Card */}
        <div className="card-glass p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4"
            >
              <ShieldCheckIcon className="h-8 w-8 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold text-white mb-2">Create Secure Account</h1>
            <p className="text-white/80">Join our secure banking platform with enhanced protection</p>
          </div>

          {/* Progress Bar */}
          {renderProgressBar()}

          {/* Form Steps */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <AnimatePresence mode="wait">
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}
              {currentStep === 4 && renderStep4()}
              {currentStep === 5 && renderStep5()}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              {currentStep > 1 && (
                <Button
                  type="button"
                  onClick={prevStep}
                  variant="glassmorphism"
                  size="md"
                  className="bg-white/10 hover:bg-white/20 border-white/20"
                >
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Back
                </Button>
              )}
              
              <div className="ml-auto">
                {currentStep < 5 ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    variant="glassmorphism"
                    size="md"
                    className="bg-white/20 hover:bg-white/30 border-white/30"
                  >
                    Next
                    <ArrowRightIcon className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    variant="glassmorphism"
                    size="md"
                    loading={isSubmitting}
                    disabled={isSubmitting || !isOnline}
                    className="bg-gradient-to-r from-accent-500 to-success-500 hover:from-accent-600 hover:to-success-600 border-accent-400"
                  >
                    {isSubmitting ? 'Creating Account...' : 'Create Secure Account'}
                  </Button>
                )}
              </div>
            </div>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-white/80">
              Already have an account?{' '}
              <Link
                to="/"
                className="text-white font-medium hover:underline underline-offset-4"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;