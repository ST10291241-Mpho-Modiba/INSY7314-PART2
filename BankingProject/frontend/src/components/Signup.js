import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
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
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import api from '../api/axiosConfig';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { useToast } from '../contexts/ToastContext';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { Button, Input } from './ui';

const Signup = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState(null);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const { showToast } = useUI();
  const { showSuccess, showError, showInfo } = useToast();
  const { handleError } = useErrorHandler();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    trigger,
    getValues,
    clearErrors
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: ''
    }
  });

  const watchedPassword = watch('password');
  const watchedEmail = watch('email');
  const watchedUsername = watch('username');

  // Real-time password strength calculation
  useEffect(() => {
    if (watchedPassword) {
      const strength = calculatePasswordStrength(watchedPassword);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(0);
    }
  }, [watchedPassword]);

  // Real-time email availability check
  useEffect(() => {
    const checkEmailAvailability = async () => {
      if (watchedEmail && validateEmail(watchedEmail) === true) {
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
  }, [watchedEmail]);

  // Real-time username availability check
  useEffect(() => {
    const checkUsernameAvailability = async () => {
      if (watchedUsername && validateUsername(watchedUsername) === true) {
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
  }, [watchedUsername]);

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (password.match(/[a-z]/)) strength += 1;
    if (password.match(/[A-Z]/)) strength += 1;
    if (password.match(/[0-9]/)) strength += 1;
    if (password.match(/[^a-zA-Z0-9]/)) strength += 1;
    return strength;
  };

  const getPasswordStrengthText = (strength) => {
    switch (strength) {
      case 0:
      case 1: return { text: 'Very Weak', color: 'text-error-500' };
      case 2: return { text: 'Weak', color: 'text-warning-500' };
      case 3: return { text: 'Fair', color: 'text-warning-400' };
      case 4: return { text: 'Good', color: 'text-accent-500' };
      case 5: return { text: 'Strong', color: 'text-success-500' };
      default: return { text: 'Very Weak', color: 'text-error-500' };
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return true;
  };

  const validateUsername = (username) => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return 'Username must be 3-20 characters (letters, numbers, underscore only)';
    }
    return true;
  };

  const validatePassword = (password) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Password must contain at least one number';
    }
    if (!/(?=.*[!@#$%^&*])/.test(password)) {
      return 'Password must contain at least one special character (!@#$%^&*)';
    }
    return true;
  };

  const validateConfirmPassword = (confirmPassword) => {
    const password = getValues('password');
    if (confirmPassword !== password) {
      return 'Passwords do not match';
    }
    return true;
  };

  const validateName = (name) => {
    if (name.length < 2) {
      return 'Name must be at least 2 characters long';
    }
    if (!/^[a-zA-Z\s]+$/.test(name)) {
      return 'Name can only contain letters and spaces';
    }
    return true;
  };

  const nextStep = async () => {
    let fieldsToValidate = [];
    
    switch (currentStep) {
      case 1:
        fieldsToValidate = ['firstName', 'lastName'];
        break;
      case 2:
        fieldsToValidate = ['username', 'email'];
        break;
      case 3:
        fieldsToValidate = ['password', 'confirmPassword'];
        break;
      default:
        return;
    }

    const isValid = await trigger(fieldsToValidate);
    
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
      
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const onSubmit = async (data) => {
    if (!agreedToTerms) {
      showError('Please agree to the Terms of Service and Privacy Policy to continue.');
      return;
    }

    try {
      clearErrors();
      
      const response = await api.post('/api/auth/signup', {
        username: data.username,
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName
      });

      // Store token and update auth context
      const token = response.data.token;
      localStorage.setItem('token', token);
      await login(response.data.user, token);

      showSuccess('Welcome! Your account has been created successfully.');

      navigate('/payments');
    } catch (error) {
      handleError(error, { context: 'signup' });
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
        <span className="text-sm text-white/80">Step {currentStep} of 4</span>
        <span className="text-sm text-white/80">{Math.round((currentStep / 4) * 100)}% Complete</span>
      </div>
      <div className="w-full bg-white/20 rounded-full h-2">
        <motion.div
          className="bg-white h-2 rounded-full"
          initial={{ width: '25%' }}
          animate={{ width: `${(currentStep / 4) * 100}%` }}
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
        <p className="text-white/80 text-sm">Let's start with your basic details</p>
      </div>

      <Input
        label="First Name"
        type="text"
        placeholder="Enter your first name"
        variant="glassmorphism"
        icon={<UserIcon />}
        error={errors.firstName?.message}
        {...register('firstName', {
          required: 'First name is required',
          validate: validateName
        })}
      />

      <Input
        label="Last Name"
        type="text"
        placeholder="Enter your last name"
        variant="glassmorphism"
        icon={<UserIcon />}
        error={errors.lastName?.message}
        {...register('lastName', {
          required: 'Last name is required',
          validate: validateName
        })}
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
        <p className="text-white/80 text-sm">Choose your username and email</p>
      </div>

      <div className="relative">
        <Input
          label="Username"
          type="text"
          placeholder="Choose a unique username"
          variant="glassmorphism"
          icon={<UserIcon />}
          error={errors.username?.message}
          {...register('username', {
            required: 'Username is required',
            validate: validateUsername
          })}
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
          error={errors.email?.message}
          {...register('email', {
            required: 'Email is required',
            validate: validateEmail
          })}
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
        <h2 className="text-xl font-semibold text-white mb-2">Secure Password</h2>
        <p className="text-white/80 text-sm">Create a strong password to protect your account</p>
      </div>

      <div className="relative">
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Create a strong password"
          variant="glassmorphism"
          icon={<LockClosedIcon />}
          error={errors.password?.message}
          {...register('password', {
            required: 'Password is required',
            validate: validatePassword
          })}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-9 text-white/60 hover:text-white"
        >
          {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
        </button>
        
        {watchedPassword && (
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-white/80">Password Strength</span>
              <span className={`text-xs ${getPasswordStrengthText(passwordStrength).color}`}>
                {getPasswordStrengthText(passwordStrength).text}
              </span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-1">
              <div
                className={`h-1 rounded-full transition-all duration-300 ${
                  passwordStrength <= 1 ? 'bg-error-500' :
                  passwordStrength <= 2 ? 'bg-warning-500' :
                  passwordStrength <= 3 ? 'bg-warning-400' :
                  passwordStrength <= 4 ? 'bg-accent-500' : 'bg-success-500'
                }`}
                style={{ width: `${(passwordStrength / 5) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="relative">
        <Input
          label="Confirm Password"
          type={showConfirmPassword ? 'text' : 'password'}
          placeholder="Confirm your password"
          variant="glassmorphism"
          icon={<LockClosedIcon />}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword', {
            required: 'Please confirm your password',
            validate: validateConfirmPassword
          })}
        />
        <button
          type="button"
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          className="absolute right-3 top-9 text-white/60 hover:text-white"
        >
          {showConfirmPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
        </button>
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
        <h2 className="text-xl font-semibold text-white mb-2">Terms & Conditions</h2>
        <p className="text-white/80 text-sm">Review and accept our terms to complete registration</p>
      </div>

      <div className="bg-white/10 rounded-lg p-4 max-h-32 overflow-y-auto">
        <p className="text-white/80 text-sm leading-relaxed">
          By creating an account, you agree to our Terms of Service and Privacy Policy. 
          We are committed to protecting your personal information and ensuring the security 
          of your banking data. Your account will be protected with industry-standard encryption 
          and security measures.
        </p>
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={agreedToTerms}
          onChange={(e) => setAgreedToTerms(e.target.checked)}
          className="mt-1 rounded border-white/30 bg-white/10 text-primary-600 focus:ring-primary-500 focus:ring-offset-0"
        />
        <span className="text-sm text-white/80">
          I agree to the{' '}
          <Link to="/terms" className="text-white underline hover:no-underline">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="text-white underline hover:no-underline">
            Privacy Policy
          </Link>
        </span>
      </label>
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
        className="w-full max-w-md"
      >
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
            <h1 className="text-2xl font-bold text-white mb-2">Create Account</h1>
            <p className="text-white/80">Join our secure banking platform</p>
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
                {currentStep < 4 ? (
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
                    loading={isSubmitting || isLoading}
                    disabled={!agreedToTerms}
                    className="bg-white/20 hover:bg-white/30 border-white/30"
                  >
                    {isSubmitting || isLoading ? 'Creating Account...' : 'Create Account'}
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