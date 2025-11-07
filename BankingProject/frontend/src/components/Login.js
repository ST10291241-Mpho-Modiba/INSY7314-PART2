import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import {
  EnvelopeIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import api from '../api/axiosConfig';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { useToast } from '../contexts/ToastContext';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { Button, Input } from './ui';

const Login = () => {

  const [connectionStatus, setConnectionStatus] = useState(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);

  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const { showToast } = useUI();
  const { showSuccess, showError, showInfo } = useToast();
  const { handleError } = useErrorHandler();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    clearErrors
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: ''
    }
  });



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

  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return true;
  };

  const validatePassword = (password) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    return true;
  };

  const onSubmit = async (data) => {
    if (isBlocked) {
      showError(
        'Account Temporarily Blocked',
        `Too many failed attempts. Try again in ${Math.ceil(blockTimeRemaining / 60)} minutes.`
      );
      return;
    }

    try {
      clearErrors();
      
      const response = await api.post('/api/auth/login', {
        email: data.email,
        password: data.password,
        rememberMe
      });

      // Reset login attempts on successful login
      localStorage.removeItem('loginAttempts');
      localStorage.removeItem('lastLoginAttempt');
      setLoginAttempts(0);

      // Store token
      const token = response.data.token;
      if (rememberMe) {
        localStorage.setItem('token', token);
      } else {
        sessionStorage.setItem('token', token);
      }

      // Update auth context - ensure user object includes role
      const userData = {
        ...response.data.user,
        role: response.data.user.role || 'user' // Default to 'user' if role not provided
      };
      await login(userData, token);

      showSuccess(
        'Welcome back!',
        'You have successfully logged in.'
      );

      // Navigate based on user role
      const redirectTo = userData.role === 'employee' ? '/employee' : '/payments';
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
        details: error.message
      });
      showError(
        'Connection Test',
        'Failed to connect to backend server.'
      );
    } finally {
      setIsTestingConnection(false);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Main Login Card */}
        <div className="card-glass p-8 mb-6">
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
            <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-white/80">Sign in to your secure banking account</p>
          </div>

          {/* Security Warning */}
          {isBlocked && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-error-500/20 border border-error-400/30 rounded-lg p-4 mb-6"
            >
              <div className="flex items-center gap-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-error-300" />
                <div>
                  <p className="text-error-100 font-medium">Account Temporarily Blocked</p>
                  <p className="text-error-200 text-sm">
                    Time remaining: {formatTime(blockTimeRemaining)}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
              label="Email Address"
              type="email"
              placeholder="Enter your email"
              variant="glassmorphism"
              icon={<EnvelopeIcon />}
              error={errors.email?.message}
              disabled={isBlocked}
              {...register('email', {
                required: 'Email is required',
                validate: validateEmail
              })}
            />

            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              variant="glassmorphism"
              icon={<LockClosedIcon />}
              error={errors.password?.message}
              disabled={isBlocked}
              {...register('password', {
                required: 'Password is required',
                validate: validatePassword
              })}
            />

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isBlocked}
                  className="rounded border-white/30 bg-white/10 text-primary-600 focus:ring-primary-500 focus:ring-offset-0"
                />
                <span className="ml-2 text-sm text-white/80">Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-white/80 hover:text-white underline-offset-4 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            {/* Login Attempts Warning */}
            {loginAttempts > 0 && loginAttempts < 5 && (
              <div className="bg-warning-500/20 border border-warning-400/30 rounded-lg p-3">
                <p className="text-warning-100 text-sm">
                  {5 - loginAttempts} login attempts remaining
                </p>
              </div>
            )}

            <Button
              type="submit"
              variant="glassmorphism"
              size="lg"
              fullWidth
              loading={isSubmitting || isLoading}
              disabled={isBlocked}
              className="bg-white/20 hover:bg-white/30 border-white/30"
            >
              {isSubmitting || isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-white/80">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="text-white font-medium hover:underline underline-offset-4"
              >
                Sign up here
              </Link>
            </p>
          </div>
        </div>

        {/* Connection Test Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="card-glass p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <CheckCircleIcon className="h-5 w-5" />
            System Status
          </h3>
          
          <Button
            onClick={testConnection}
            variant="glassmorphism"
            size="sm"
            loading={isTestingConnection}
            className="mb-4 bg-white/10 hover:bg-white/20 border-white/20"
          >
            Test Backend Connection
          </Button>

          {connectionStatus && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3 rounded-lg border ${
                connectionStatus.type === 'success'
                  ? 'bg-success-500/20 border-success-400/30'
                  : 'bg-error-500/20 border-error-400/30'
              }`}
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