import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  EnvelopeIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  DevicePhoneMobileIcon,
  FingerPrintIcon,
  KeyIcon,
  ArrowPathIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import {
  EnvelopeIcon as EnvelopeSolidIcon,
  LockClosedIcon as LockSolidIcon,
  ShieldCheckIcon as ShieldCheckSolidIcon
} from '@heroicons/react/24/solid';
import api from '../api/axiosConfig';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { useToast } from '../contexts/ToastContext';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { Button, Input } from './ui';
import { serviceWorkerManager } from '../utils/serviceWorker';

// Enhanced login form schema with security validation
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(100, 'Email must be less than 100 characters'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password must be less than 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  rememberMe: z.boolean().optional(),
  mfaCode: z
    .string()
    .optional()
    .refine((val) => !val || /^\d{6}$/.test(val), 'MFA code must be 6 digits')
});

type LoginFormData = z.infer<typeof loginSchema>;

// Enhanced login component with TypeScript and security features
const Login: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<{ type: 'success' | 'error'; message: string; details?: any } | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showMFA, setShowMFA] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [trustedDevice, setTrustedDevice] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'password' | 'biometric' | 'sms'>('password');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [securityIndicators, setSecurityIndicators] = useState({
    connection: false,
    encryption: true,
    secure: true
  });

  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const { showToast } = useUI();
  const { showSuccess, showError, showInfo } = useToast();
  const { handleError } = useErrorHandler();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    clearErrors,
    setValue,
    watch
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    defaultValues: {
      email: localStorage.getItem('rememberedEmail') || '',
      password: '',
      rememberMe: !!localStorage.getItem('rememberedEmail'),
      mfaCode: ''
    }
  });

  const rememberMe = watch('rememberMe');

  // Security: Block login attempts after 5 failed attempts
  useEffect(() => {
    const attempts = parseInt(localStorage.getItem('loginAttempts') || '0');
    const lastAttempt = parseInt(localStorage.getItem('lastLoginAttempt') || '0');
    const now = Date.now();
    
    if (attempts >= 5 && now - lastAttempt < 15 * 60 * 1000) { // 15 minutes block
      setIsBlocked(true);
      setLoginAttempts(attempts);
      const remaining = Math.ceil((15 * 60 * 1000 - (now - lastAttempt)) / 1000);
      setBlockTimeRemaining(remaining);
      
      const timer = setInterval(() => {
        setBlockTimeRemaining(prev => {
          if (prev <= 1) {
            setIsBlocked(false);
            localStorage.removeItem('loginAttempts');
            localStorage.removeItem('lastLoginAttempt');
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    } else if (now - lastAttempt >= 15 * 60 * 1000) {
      // Reset attempts after 15 minutes
      localStorage.removeItem('loginAttempts');
      localStorage.removeItem('lastLoginAttempt');
      setLoginAttempts(0);
    } else {
      setLoginAttempts(attempts);
    }
  }, []);

  // Online/offline status monitoring
  useEffect(() => {
    const handleOnlineStatusChange = (event: CustomEvent) => {
      setIsOnline(event.detail.isOnline);
      setSecurityIndicators(prev => ({
        ...prev,
        connection: event.detail.isOnline
      }));
    };

    window.addEventListener('onlineStatusChange', handleOnlineStatusChange as EventListener);
    return () => window.removeEventListener('onlineStatusChange', handleOnlineStatusChange as EventListener);
  }, []);

  // Check biometric availability
  useEffect(() => {
    const checkBiometricAvailability = async () => {
      if ('credentials' in navigator && 'create' in navigator.credentials) {
        try {
          const available = await navigator.credentials.create({
            publicKey: {
              challenge: new Uint8Array(32),
              rp: { name: 'Banking App' },
              user: {
                id: new Uint8Array(16),
                name: 'test@example.com',
                displayName: 'Test User'
              },
              pubKeyCredParams: [{ alg: -7, type: 'public-key' }]
            }
          });
          setBiometricAvailable(true);
        } catch (error) {
          setBiometricAvailable(false);
        }
      }
    };

    checkBiometricAvailability();
  }, []);

  // Security indicators monitoring
  useEffect(() => {
    const checkSecurityIndicators = () => {
      setSecurityIndicators({
        connection: isOnline,
        encryption: window.location.protocol === 'https:',
        secure: window.location.protocol === 'https:' && !window.location.hostname.includes('localhost')
      });
    };

    checkSecurityIndicators();
    const interval = setInterval(checkSecurityIndicators, 5000);
    return () => clearInterval(interval);
  }, [isOnline]);

  const handleRememberMeChange = useCallback((checked: boolean) => {
    setValue('rememberMe', checked);
    if (!checked) {
      localStorage.removeItem('rememberedEmail');
    }
  }, [setValue]);

  const handleTrustedDeviceChange = useCallback((checked: boolean) => {
    setTrustedDevice(checked);
  }, []);

  const onSubmit = async (data: LoginFormData) => {
    if (isBlocked) {
      showError(
        'Account Temporarily Blocked',
        `Too many failed attempts. Try again in ${Math.ceil(blockTimeRemaining / 60)} minutes.`
      );
      return;
    }

    try {
      clearErrors();
      
      // Handle offline mode
      if (!isOnline) {
        const cachedUser = await serviceWorkerManager.getOfflineData(`user_${data.email}`);
        if (cachedUser && cachedUser.password === data.password) {
          await login(cachedUser.user, 'offline_token');
          showInfo('Offline Mode', 'You are logged in offline mode. Some features may be limited.');
          navigate('/payments');
          return;
        }
        showError('Offline Mode', 'Cannot login offline. Please connect to the internet.');
        return;
      }

      const loginData = {
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe,
        trustedDevice,
        mfaCode: data.mfaCode,
        loginMethod,
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          windowSize: `${window.innerWidth}x${window.innerHeight}`,
          isStandalone: serviceWorkerManager.isStandalone()
        }
      };

      const response = await api.post('/api/auth/login', loginData);

      // Reset login attempts on successful login
      localStorage.removeItem('loginAttempts');
      localStorage.removeItem('lastLoginAttempt');
      setLoginAttempts(0);

      // Handle remember me
      if (data.rememberMe) {
        localStorage.setItem('rememberedEmail', data.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      // Store token securely
      const token = response.data.token;
      if (data.rememberMe) {
        localStorage.setItem('token', token);
      } else {
        sessionStorage.setItem('token', token);
      }

      // Cache user data for offline access
      if (trustedDevice) {
        await serviceWorkerManager.cacheOfflineData(`user_${data.email}`, {
          user: response.data.user,
          password: data.password, // In production, this should be hashed
          cachedAt: new Date().toISOString()
        }, { expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() }); // 30 days
      }

      // Update auth context - ensure user object includes role
      const userData = {
        ...response.data.user,
        role: response.data.user.role || 'user' // Default to 'user' if role not provided
      };
      await login(userData, token);

      showSuccess(
        'Welcome back!',
        `You have successfully logged in as ${userData.username || userData.email}.`
      );

      // Navigate based on user role
      const redirectTo = new URLSearchParams(window.location.search).get('redirect') || 
        (userData.role === 'employee' ? '/employee' : '/payments');
      navigate(redirectTo);

    } catch (error) {
      // Handle failed login attempts
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      localStorage.setItem('loginAttempts', newAttempts.toString());
      localStorage.setItem('lastLoginAttempt', Date.now().toString());

      if (newAttempts >= 5) {
        setIsBlocked(true);
        setBlockTimeRemaining(15 * 60); // 15 minutes
        showError(
          'Account Temporarily Blocked',
          'Too many failed login attempts. Account blocked for 15 minutes.'
        );
      } else {
        const remainingAttempts = 5 - newAttempts;
        showError(
          'Login Failed',
          `Invalid credentials. ${remainingAttempts} attempts remaining.`
        );
      }

      handleError(error, { context: 'login' });
    }
  };

  const testConnection = async () => {
    setIsTestingConnection(true);
    try {
      const response = await api.get('/api/health');
      setConnectionStatus({
        type: 'success',
        message: `Connected successfully - ${response.data.msg}`,
        details: response.data
      });
      showSuccess(
        'Connection Test',
        'Backend connection successful!'
      );
    } catch (error) {
      setConnectionStatus({
        type: 'error',
        message: 'Connection failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
      showError(
        'Connection Test',
        'Failed to connect to backend server.'
      );
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleBiometricLogin = async () => {
    if (!biometricAvailable) {
      showError('Biometric Login', 'Biometric authentication is not available on this device.');
      return;
    }

    try {
      // Simulate biometric authentication
      showInfo('Biometric Login', 'Please authenticate using your biometric device...');
      
      // In a real implementation, this would use WebAuthn API
      setTimeout(() => {
        showSuccess('Biometric Login', 'Biometric authentication successful!');
        setLoginMethod('biometric');
      }, 2000);
    } catch (error) {
      showError('Biometric Login', 'Biometric authentication failed.');
      handleError(error, { context: 'biometric_login' });
    }
  };

  const handleSMSLogin = async () => {
    try {
      showInfo('SMS Login', 'Sending verification code to your registered mobile number...');
      
      // Simulate SMS code sending
      setTimeout(() => {
        showSuccess('SMS Login', 'Verification code sent! Please check your mobile device.');
        setShowMFA(true);
      }, 2000);
    } catch (error) {
      showError('SMS Login', 'Failed to send verification code.');
      handleError(error, { context: 'sms_login' });
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getSecurityIndicatorColor = (indicator: keyof typeof securityIndicators) => {
    if (indicator === 'connection') return securityIndicators.connection ? 'text-success-400' : 'text-error-400';
    return securityIndicators[indicator] ? 'text-success-400' : 'text-warning-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-accent-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Enhanced Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.03%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
      
      {/* Floating Security Indicators */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <div className="bg-black/20 backdrop-blur-sm rounded-lg p-2 flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${securityIndicators.connection ? 'bg-success-400' : 'bg-error-400'} animate-pulse`}></div>
          <span className="text-xs text-white/80">
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
        <div className="bg-black/20 backdrop-blur-sm rounded-lg p-2">
          <ShieldCheckSolidIcon className={`h-4 w-4 ${getSecurityIndicatorColor('encryption')}`} />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
        className="w-full max-w-md"
      >
        {/* Main Login Card */}
        <div className="card-glass-enhanced p-8 mb-6 relative">
          {/* Enhanced Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mx-auto w-20 h-20 bg-gradient-to-br from-white/20 to-white/10 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm border border-white/20"
            >
              <ShieldCheckIcon className="h-10 w-10 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold text-white mb-2">Secure Banking</h1>
            <p className="text-white/80 text-sm">Sign in to your account with enhanced security</p>
          </div>

          {/* Security Status */}
          <AnimatePresence>
            {isBlocked && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                className="bg-error-500/20 border border-error-400/30 rounded-lg p-4 mb-6 backdrop-blur-sm"
              >
                <div className="flex items-center gap-3">
                  <ExclamationTriangleIcon className="h-5 w-5 text-error-300 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-error-100 font-medium text-sm">Account Temporarily Blocked</p>
                    <p className="text-error-200 text-xs">
                      Time remaining: {formatTime(blockTimeRemaining)}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Login Method Selector */}
          <div className="mb-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              <button
                type="button"
                onClick={() => setLoginMethod('password')}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  loginMethod === 'password'
                    ? 'bg-white/20 text-white border border-white/30'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                <LockClosedIcon className="h-4 w-4 inline mr-1" />
                Password
              </button>
              <button
                type="button"
                onClick={handleBiometricLogin}
                disabled={!biometricAvailable}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  loginMethod === 'biometric'
                    ? 'bg-white/20 text-white border border-white/30'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 disabled:opacity-50'
                }`}
              >
                <FingerPrintIcon className="h-4 w-4 inline mr-1" />
                Biometric
              </button>
              <button
                type="button"
                onClick={handleSMSLogin}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  loginMethod === 'sms'
                    ? 'bg-white/20 text-white border border-white/30'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                <DevicePhoneMobileIcon className="h-4 w-4 inline mr-1" />
                SMS
              </button>
            </div>
          </div>

          {/* Enhanced Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="Enter your email"
                variant="glassmorphism-enhanced"
                icon={<EnvelopeIcon />}
                error={errors.email?.message}
                disabled={isBlocked || isSubmitting}
                autoComplete="email"
                {...register('email', {
                  onChange: (e) => {
                    if (rememberMe) {
                      localStorage.setItem('rememberedEmail', e.target.value);
                    }
                  }
                })}
              />

              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  variant="glassmorphism-enhanced"
                  icon={<LockClosedIcon />}
                  error={errors.password?.message}
                  disabled={isBlocked || isSubmitting}
                  autoComplete="current-password"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-white/60 hover:text-white transition-colors"
                  disabled={isBlocked}
                >
                  {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>

              {/* MFA Code Input */}
              <AnimatePresence>
                {showMFA && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Input
                      label="Verification Code"
                      type="text"
                      placeholder="Enter 6-digit code"
                      variant="glassmorphism-enhanced"
                      icon={<KeyIcon />}
                      error={errors.mfaCode?.message}
                      disabled={isBlocked || isSubmitting}
                      maxLength={6}
                      {...register('mfaCode')}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Enhanced Options */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => handleRememberMeChange(e.target.checked)}
                    disabled={isBlocked || isSubmitting}
                    className="rounded border-white/30 bg-white/10 text-primary-600 focus:ring-primary-500 focus:ring-offset-0"
                  />
                  <span className="ml-2 text-sm text-white/80">Remember me</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-white/80 hover:text-white underline-offset-4 hover:underline transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={trustedDevice}
                  onChange={(e) => handleTrustedDeviceChange(e.target.checked)}
                  disabled={isBlocked || isSubmitting}
                  className="rounded border-white/30 bg-white/10 text-primary-600 focus:ring-primary-500 focus:ring-offset-0"
                />
                <span className="ml-2 text-sm text-white/80">Trust this device</span>
                <InformationCircleIcon className="h-4 w-4 text-white/60 ml-1" title="Trusting this device allows offline access and faster login" />
              </label>
            </div>

            {/* Login Attempts Warning */}
            <AnimatePresence>
              {loginAttempts > 0 && loginAttempts < 5 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-warning-500/20 border border-warning-400/30 rounded-lg p-3 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-2">
                    <ExclamationTriangleIcon className="h-4 w-4 text-warning-300 flex-shrink-0" />
                    <p className="text-warning-100 text-xs">
                      {5 - loginAttempts} login attempts remaining
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              type="submit"
              variant="glassmorphism-enhanced"
              size="lg"
              fullWidth
              loading={isSubmitting || isLoading}
              disabled={isBlocked || isSubmitting}
              className="bg-gradient-to-r from-white/20 to-white/10 hover:from-white/30 hover:to-white/20 border border-white/30 text-white font-semibold py-3"
            >
              {isSubmitting || isLoading ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Sign In Securely'
              )}
            </Button>
          </form>

          {/* Enhanced Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-white/80 text-sm">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="text-white font-medium hover:underline underline-offset-4 transition-all hover:text-white/90"
              >
                Sign up here
              </Link>
            </p>
          </div>
        </div>

        {/* Enhanced Connection Test Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="card-glass-enhanced p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <CheckCircleIcon className="h-5 w-5" />
            System Status
          </h3>
          
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/80">Connection</span>
              <span className={`font-medium ${isOnline ? 'text-success-400' : 'text-error-400'}`}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/80">Encryption</span>
              <span className="text-success-400 font-medium">TLS 1.3</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/80">Last Sync</span>
              <span className="text-white/60 font-medium">Just now</span>
            </div>
          </div>
          
          <Button
            onClick={testConnection}
            variant="glassmorphism"
            size="sm"
            loading={isTestingConnection}
            className="w-full bg-white/10 hover:bg-white/20 border border-white/20 mb-3"
          >
            Test Backend Connection
          </Button>

          {connectionStatus && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`p-3 rounded-lg border ${
                connectionStatus.type === 'success'
                  ? 'bg-success-500/20 border-success-400/30'
                  : 'bg-error-500/20 border-error-400/30'
              } backdrop-blur-sm`}
            >
              <p className={`text-sm font-medium ${
                connectionStatus.type === 'success' ? 'text-success-100' : 'text-error-100'
              }`}>
                {connectionStatus.message}
              </p>
              {connectionStatus.details && (
                <p className={`text-xs mt-1 ${
                  connectionStatus.type === 'success' ? 'text-success-200' : 'text-error-200'
                }`}>
                  {typeof connectionStatus.details === 'string' 
                    ? connectionStatus.details 
                    : JSON.stringify(connectionStatus.details)
                  }
                </p>
              )}
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;