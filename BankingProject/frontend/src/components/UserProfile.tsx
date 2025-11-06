import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  ShieldCheckIcon,
  KeyIcon,
  DevicePhoneMobileIcon,
  BellIcon,
  PaintBrushIcon,
  GlobeAltIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import {
  UserCircleIcon,
  CogIcon,
  LockClosedIcon,
  BellAlertIcon,
  SwatchIcon
} from '@heroicons/react/24/solid';
import { useAuth } from '../hooks/useAuth';
import { useSecuritySettings } from '../hooks/useSecurity';
import { useNotificationSettings } from '../hooks/useNotifications';
import { useSecurity } from '../components/SecurityProvider';
import { XSSProtection } from '../utils/security';
import { useUpdateNotificationSettings } from '../hooks/useNotifications';
import { useTwoFactor, useBiometric, useSessionTimeout, useValidateSession } from '../hooks/useSecurity';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Select } from './ui/Select';
import { Card } from './ui/Card';
import { Tabs, TabList, Tab, TabPanel } from './ui/Tabs';
import { Switch } from './ui/Switch';
import { ProgressBar } from './ui/ProgressBar';
import { Alert } from './ui/Alert';

// Form validation schemas
const profileSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional()
  }).optional()
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(12, 'Password must be at least 12 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

const securitySettingsSchema = z.object({
  twoFactorEnabled: z.boolean(),
  biometricEnabled: z.boolean(),
  sessionTimeout: z.number().min(5).max(1440), // 5 minutes to 24 hours
  loginAlerts: z.boolean(),
  transactionAlerts: z.boolean()
});

const notificationSchema = z.object({
  email: z.boolean(),
  sms: z.boolean(),
  push: z.boolean(),
  transactionAlerts: z.boolean(),
  securityAlerts: z.boolean(),
  marketingEmails: z.boolean()
});

const accessibilitySchema = z.object({
  highContrast: z.boolean(),
  largeText: z.boolean(),
  reducedMotion: z.boolean(),
  screenReaderSupport: z.boolean()
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;
type SecuritySettingsFormData = z.infer<typeof securitySettingsSchema>;
type NotificationFormData = z.infer<typeof notificationSchema>;
type AccessibilityFormData = z.infer<typeof accessibilitySchema>;

interface UserProfileProps {
  className?: string;
}

const UserProfile: React.FC<UserProfileProps> = ({ className = '' }) => {
  const { user, updateProfile, updateProfileLoading, changePassword, changePasswordLoading } = useAuth();
  const securitySettingsQuery = useSecuritySettings();
  const securitySettings = securitySettingsQuery.data;
  const twoFactorMutation = useTwoFactor();
  const biometricMutation = useBiometric();
  const sessionTimeoutMutation = useSessionTimeout();
  const notificationSettingsQuery = useNotificationSettings();
  const notificationSettings = notificationSettingsQuery.data || null;
  const updateNotificationSettingsMutation = useUpdateNotificationSettings();
  const updateNotificationSettings = updateNotificationSettingsMutation.mutate;
  const validateSessionQuery = useValidateSession();
  const validateSession = useCallback(() => {
    return validateSessionQuery.data?.valid ?? false;
  }, [validateSessionQuery.data]);
  
  // Also use the security context for sanitizeInput
  const { sanitizeInput: securitySanitizeInput } = useSecurity();
  const sanitizeInput = useCallback((data: any): any => {
    // Sanitize input data recursively
    if (typeof data === 'string') {
      return securitySanitizeInput(data);
    }
    if (Array.isArray(data)) {
      return data.map(item => sanitizeInput(item));
    }
    if (data && typeof data === 'object') {
      const sanitized: any = {};
      for (const key in data) {
        sanitized[key] = sanitizeInput(data[key]);
      }
      return sanitized;
    }
    return data;
  }, [securitySanitizeInput]);
  
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [securityLevel, setSecurityLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Profile form
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.name?.split(' ')[0] || '',
      lastName: user?.name?.split(' ')[1] || '',
      email: user?.email || '',
      phoneNumber: '',
      dateOfBirth: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      }
    }
  });

  // Password form
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  // Security settings form
  const securityForm = useForm<SecuritySettingsFormData>({
    resolver: zodResolver(securitySettingsSchema),
    defaultValues: {
      twoFactorEnabled: securitySettings?.twoFactorEnabled || false,
      biometricEnabled: securitySettings?.biometricEnabled || false,
      sessionTimeout: securitySettings?.sessionTimeout || 30,
      loginAlerts: true,
      transactionAlerts: true
    }
  });

  // Notification settings form
  const notificationForm = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      email: notificationSettings?.email || true,
      sms: notificationSettings?.sms || false,
      push: notificationSettings?.desktop || true, // Using desktop as push
      transactionAlerts: true, // Default value
      securityAlerts: true, // Default value
      marketingEmails: false // Default value
    }
  });

  // Accessibility settings form
  const accessibilityForm = useForm<AccessibilityFormData>({
    resolver: zodResolver(accessibilitySchema),
    defaultValues: {
      highContrast: false,
      largeText: false,
      reducedMotion: false,
      screenReaderSupport: true
    }
  });

  // Calculate security level
  useEffect(() => {
    const settings = securityForm.watch();
    let score = 0;
    
    if (settings.twoFactorEnabled) score += 40;
    if (settings.biometricEnabled) score += 30;
    if (settings.sessionTimeout <= 30) score += 20;
    if (settings.loginAlerts) score += 10;
    
    if (score >= 80) setSecurityLevel('high');
    else if (score >= 50) setSecurityLevel('medium');
    else setSecurityLevel('low');
  }, [securityForm.watch()]);

  // Handle profile update
  const handleProfileUpdate = async (data: ProfileFormData) => {
    if (!validateSession()) {
      toast.error('Session expired. Please log in again.');
      return;
    }

    setIsSubmitting(true);
    try {
      const sanitizedData = sanitizeInput(data);
      await updateProfile({
        ...sanitizedData,
        name: `${sanitizedData.firstName} ${sanitizedData.lastName}`
      });
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (data: PasswordFormData) => {
    if (!validateSession()) {
      toast.error('Session expired. Please log in again.');
      return;
    }

    setIsSubmitting(true);
    try {
      await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      toast.success('Password changed successfully');
      passwordForm.reset();
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle security settings update
  const handleSecuritySettingsUpdate = async (data: SecuritySettingsFormData) => {
    if (!validateSession()) {
      toast.error('Session expired. Please log in again.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Update each security setting individually
      if (data.twoFactorEnabled !== securitySettings?.twoFactorEnabled) {
        await twoFactorMutation.mutateAsync({ enabled: data.twoFactorEnabled });
      }
      if (data.biometricEnabled !== securitySettings?.biometricEnabled) {
        await biometricMutation.mutateAsync({ enabled: data.biometricEnabled });
      }
      if (data.sessionTimeout !== securitySettings?.sessionTimeout) {
        await sessionTimeoutMutation.mutateAsync({ timeout: data.sessionTimeout });
      }
      toast.success('Security settings updated successfully');
    } catch (error) {
      toast.error('Failed to update security settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle notification settings update
  const handleNotificationSettingsUpdate = async (data: NotificationFormData) => {
    if (!validateSession()) {
      toast.error('Session expired. Please log in again.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateNotificationSettings(data);
      toast.success('Notification settings updated successfully');
    } catch (error) {
      toast.error('Failed to update notification settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle accessibility settings update
  const handleAccessibilitySettingsUpdate = async (data: AccessibilityFormData) => {
    if (!validateSession()) {
      toast.error('Session expired. Please log in again.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Apply accessibility settings immediately
      document.documentElement.classList.toggle('high-contrast', data.highContrast);
      document.documentElement.classList.toggle('large-text', data.largeText);
      document.documentElement.classList.toggle('reduced-motion', data.reducedMotion);
      
      toast.success('Accessibility settings updated successfully');
    } catch (error) {
      toast.error('Failed to update accessibility settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSecurityColor = () => {
    switch (securityLevel) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-red-600';
    }
  };

  const getSecurityProgress = () => {
    switch (securityLevel) {
      case 'high': return 100;
      case 'medium': return 66;
      case 'low': return 33;
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 py-8 ${className}`}>
      {/* Skip to main content link for screen readers */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Skip to main content
      </a>
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8" role="banner">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Settings</h1>
          <p className="text-gray-600">Manage your profile, security, and preferences</p>
        </div>

        {/* Security Overview */}
                <Card className="mb-6 p-6" role="region" aria-label="Security Status">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <ShieldCheckIcon className="h-6 w-6 text-blue-600" />
                      <h2 className="text-lg font-semibold text-gray-900">Security Status</h2>
                    </div>
                    <div className={`font-medium ${getSecurityColor()}`} aria-live="polite">
                      {securityLevel.charAt(0).toUpperCase() + securityLevel.slice(1)} Security
                    </div>
                  </div>
                  <ProgressBar 
                    value={getSecurityProgress()} 
                    className="mb-2"
                    color={securityLevel === 'high' ? 'green' : securityLevel === 'medium' ? 'yellow' : 'red'}
                    ariaLabel={`Security level progress: ${getSecurityProgress()}%`}
                  />
                  <p className="text-sm text-gray-600">
                    {securityLevel === 'high' 
                      ? 'Your account is well protected with strong security measures.'
                      : securityLevel === 'medium'
                      ? 'Consider enabling additional security features for better protection.'
                      : 'We strongly recommend enabling two-factor authentication and other security features.'
                    }
                  </p>
                </Card>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200" id="main-content" role="main">
          <Tabs activeTab={activeTab} onTabChange={setActiveTab} aria-label="Profile settings tabs">
            <TabList>
              <Tab id="profile" icon={<UserCircleIcon className="h-5 w-5" />} aria-label="Profile settings">
                Profile
              </Tab>
              <Tab id="security" icon={<ShieldCheckIcon className="h-5 w-5" />} aria-label="Security settings">
                Security
              </Tab>
              <Tab id="notifications" icon={<BellIcon className="h-5 w-5" />} aria-label="Notification settings">
                Notifications
              </Tab>
              <Tab id="accessibility" icon={<PaintBrushIcon className="h-5 w-5" />} aria-label="Accessibility settings">
                Accessibility
              </Tab>
            </TabList>

            {/* Profile Tab */}
            <TabPanel id="profile">
              <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Input
                      label="First Name"
                      {...profileForm.register('firstName')}
                      error={profileForm.formState.errors.firstName?.message}
                      icon={<UserIcon className="h-5 w-5 text-gray-400" />}
                      aria-label="First name"
                      aria-required="true"
                      aria-invalid={!!profileForm.formState.errors.firstName}
                      aria-describedby={profileForm.formState.errors.firstName ? 'firstName-error' : undefined}
                    />
                    {profileForm.formState.errors.firstName && (
                      <p id="firstName-error" className="mt-1 text-sm text-red-600" role="alert">
                        {profileForm.formState.errors.firstName.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Input
                      label="Last Name"
                      {...profileForm.register('lastName')}
                      error={profileForm.formState.errors.lastName?.message}
                      icon={<UserIcon className="h-5 w-5 text-gray-400" />}
                      aria-label="Last name"
                      aria-required="true"
                      aria-invalid={!!profileForm.formState.errors.lastName}
                      aria-describedby={profileForm.formState.errors.lastName ? 'lastName-error' : undefined}
                    />
                    {profileForm.formState.errors.lastName && (
                      <p id="lastName-error" className="mt-1 text-sm text-red-600" role="alert">
                        {profileForm.formState.errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                <Input
                  label="Email Address"
                  type="email"
                  {...profileForm.register('email')}
                  error={profileForm.formState.errors.email?.message}
                  icon={<EnvelopeIcon className="h-5 w-5 text-gray-400" />}
                  aria-label="Email address"
                  aria-required="true"
                  aria-invalid={!!profileForm.formState.errors.email}
                  aria-describedby={profileForm.formState.errors.email ? 'email-error' : undefined}
                />

                <Input
                  label="Phone Number"
                  type="tel"
                  {...profileForm.register('phoneNumber')}
                  error={profileForm.formState.errors.phoneNumber?.message}
                  icon={<PhoneIcon className="h-5 w-5 text-gray-400" />}
                  aria-label="Phone number"
                  aria-invalid={!!profileForm.formState.errors.phoneNumber}
                  aria-describedby={profileForm.formState.errors.phoneNumber ? 'phoneNumber-error' : undefined}
                />

                <Input
                  label="Date of Birth"
                  type="date"
                  {...profileForm.register('dateOfBirth')}
                  error={profileForm.formState.errors.dateOfBirth?.message}
                />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Address</h3>
                  <Input
                    label="Street Address"
                    {...profileForm.register('address.street')}
                    error={profileForm.formState.errors.address?.street?.message}
                    icon={<MapPinIcon className="h-5 w-5 text-gray-400" />}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      label="City"
                      {...profileForm.register('address.city')}
                      error={profileForm.formState.errors.address?.city?.message}
                    />
                    <Input
                      label="State/Province"
                      {...profileForm.register('address.state')}
                      error={profileForm.formState.errors.address?.state?.message}
                    />
                    <Input
                      label="ZIP/Postal Code"
                      {...profileForm.register('address.zipCode')}
                      error={profileForm.formState.errors.address?.zipCode?.message}
                    />
                  </div>
                  <Select
                    label="Country"
                    {...profileForm.register('address.country')}
                    error={profileForm.formState.errors.address?.country?.message}
                    icon={<GlobeAltIcon className="h-5 w-5 text-gray-400" />}
                  >
                    <option value="">Select a country</option>
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="UK">United Kingdom</option>
                    <option value="AU">Australia</option>
                  </Select>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    loading={updateProfileLoading || isSubmitting}
                    disabled={!profileForm.formState.isDirty}
                    aria-label="Update profile information"
                  >
                    Update Profile
                  </Button>
                </div>
              </form>
            </TabPanel>

            {/* Security Tab */}
            <TabPanel id="security">
              <div className="p-6 space-y-8">
                {/* Security Settings */}
                <form onSubmit={securityForm.handleSubmit(handleSecuritySettingsUpdate)} className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900">Security Settings</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <ShieldCheckIcon className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                          <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                        </div>
                      </div>
                      <Switch
                        {...securityForm.register('twoFactorEnabled')}
                        checked={securityForm.watch('twoFactorEnabled')}
                        onChange={(checked) => securityForm.setValue('twoFactorEnabled', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <DevicePhoneMobileIcon className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="font-medium text-gray-900">Biometric Authentication</p>
                          <p className="text-sm text-gray-600">Use fingerprint or face recognition</p>
                        </div>
                      </div>
                      <Switch
                        {...securityForm.register('biometricEnabled')}
                        checked={securityForm.watch('biometricEnabled')}
                        onChange={(checked) => securityForm.setValue('biometricEnabled', checked)}
                      />
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Session Timeout (minutes)
                      </label>
                      <Select
                        {...securityForm.register('sessionTimeout', { valueAsNumber: true })}
                        error={securityForm.formState.errors.sessionTimeout?.message}
                        options={[
                          { value: '5', label: '5 minutes' },
                          { value: '15', label: '15 minutes' },
                          { value: '30', label: '30 minutes' },
                          { value: '60', label: '1 hour' },
                          { value: '120', label: '2 hours' },
                          { value: '240', label: '4 hours' },
                          { value: '480', label: '8 hours' },
                          { value: '1440', label: '24 hours' }
                        ]}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      loading={twoFactorMutation.isPending || biometricMutation.isPending || sessionTimeoutMutation.isPending || isSubmitting}
                      disabled={!securityForm.formState.isDirty}
                    >
                      Update Security Settings
                    </Button>
                  </div>
                </form>

                {/* Change Password */}
                <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-6 border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900">Change Password</h3>
                  
                  <div className="space-y-4">
                  <div className="relative">
                    <Input
                      label="Current Password"
                      type={showPassword ? 'text' : 'password'}
                      {...passwordForm.register('currentPassword')}
                      error={passwordForm.formState.errors.currentPassword?.message}
                      icon={<KeyIcon className="h-5 w-5 text-gray-400" />}
                      aria-label="Current password"
                      aria-required="true"
                      aria-invalid={!!passwordForm.formState.errors.currentPassword}
                      aria-describedby={passwordForm.formState.errors.currentPassword ? 'currentPassword-error' : undefined}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                      aria-label={showPassword ? 'Hide current password' : 'Show current password'}
                    >
                      {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                    {passwordForm.formState.errors.currentPassword && (
                      <p id="currentPassword-error" className="mt-1 text-sm text-red-600" role="alert">
                        {passwordForm.formState.errors.currentPassword.message}
                      </p>
                    )}
                  </div>

                    <div className="relative">
                      <Input
                        label="New Password"
                        type={showNewPassword ? 'text' : 'password'}
                        {...passwordForm.register('newPassword')}
                        error={passwordForm.formState.errors.newPassword?.message}
                        icon={<KeyIcon className="h-5 w-5 text-gray-400" />}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                        aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                      >
                        {showNewPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                      </button>
                    </div>

                    <div className="relative">
                      <Input
                        label="Confirm New Password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        {...passwordForm.register('confirmPassword')}
                        error={passwordForm.formState.errors.confirmPassword?.message}
                        icon={<KeyIcon className="h-5 w-5 text-gray-400" />}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <Alert
                    type="info"
                    icon={<InformationCircleIcon className="h-5 w-5" />}
                    title="Password Requirements"
                    className="mb-4"
                  >
                    <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                      <li>At least 12 characters long</li>
                      <li>Contains uppercase and lowercase letters</li>
                      <li>Contains numbers and special characters</li>
                      <li>Not similar to your previous passwords</li>
                    </ul>
                  </Alert>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      loading={changePasswordLoading || isSubmitting}
                      disabled={!passwordForm.formState.isDirty}
                    >
                      Change Password
                    </Button>
                  </div>
                </form>
              </div>
            </TabPanel>

            {/* Notifications Tab */}
            <TabPanel id="notifications">
              <form onSubmit={notificationForm.handleSubmit(handleNotificationSettingsUpdate)} className="p-6 space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Notification Preferences</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <EnvelopeIcon className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-900">Email Notifications</p>
                        <p className="text-sm text-gray-600">Receive notifications via email</p>
                      </div>
                    </div>
                    <Switch
                      {...notificationForm.register('email')}
                      checked={notificationForm.watch('email')}
                      onChange={(checked) => notificationForm.setValue('email', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <DevicePhoneMobileIcon className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-900">SMS Notifications</p>
                        <p className="text-sm text-gray-600">Receive text message notifications</p>
                      </div>
                    </div>
                    <Switch
                      {...notificationForm.register('sms')}
                      checked={notificationForm.watch('sms')}
                      onChange={(checked) => notificationForm.setValue('sms', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <BellIcon className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-900">Push Notifications</p>
                        <p className="text-sm text-gray-600">Receive browser push notifications</p>
                      </div>
                    </div>
                    <Switch
                      {...notificationForm.register('push')}
                      checked={notificationForm.watch('push')}
                      onChange={(checked) => notificationForm.setValue('push', checked)}
                    />
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-3">Alert Types</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Transaction Alerts</p>
                          <p className="text-sm text-gray-600">Get notified about account transactions</p>
                        </div>
                        <Switch
                          {...notificationForm.register('transactionAlerts')}
                          checked={notificationForm.watch('transactionAlerts')}
                          onChange={(checked) => notificationForm.setValue('transactionAlerts', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Security Alerts</p>
                          <p className="text-sm text-gray-600">Get notified about security events</p>
                        </div>
                        <Switch
                          {...notificationForm.register('securityAlerts')}
                          checked={notificationForm.watch('securityAlerts')}
                          onChange={(checked) => notificationForm.setValue('securityAlerts', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Marketing Emails</p>
                          <p className="text-sm text-gray-600">Receive promotional offers and updates</p>
                        </div>
                        <Switch
                          {...notificationForm.register('marketingEmails')}
                          checked={notificationForm.watch('marketingEmails')}
                          onChange={(checked) => notificationForm.setValue('marketingEmails', checked)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    loading={isSubmitting}
                    disabled={!notificationForm.formState.isDirty}
                  >
                    Update Notification Settings
                  </Button>
                </div>
              </form>
            </TabPanel>

            {/* Accessibility Tab */}
            <TabPanel id="accessibility">
              <form onSubmit={accessibilityForm.handleSubmit(handleAccessibilitySettingsUpdate)} className="p-6 space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Accessibility Settings</h3>
                
                <Alert
                  type="info"
                  icon={<InformationCircleIcon className="h-5 w-5 text-blue-700" />}
                  title="Accessibility Features"
                  className="mb-6"
                >
                  These settings help make the application more accessible and easier to use.
                </Alert>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <PaintBrushIcon className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-900">High Contrast Mode</p>
                        <p className="text-sm text-gray-600">Increase color contrast for better visibility</p>
                      </div>
                    </div>
                    <Switch
                      {...accessibilityForm.register('highContrast')}
                      checked={accessibilityForm.watch('highContrast')}
                      onChange={(checked) => accessibilityForm.setValue('highContrast', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-gray-600">A</span>
                      <div>
                        <p className="font-medium text-gray-900">Large Text</p>
                        <p className="text-sm text-gray-600">Increase text size for better readability</p>
                      </div>
                    </div>
                    <Switch
                      {...accessibilityForm.register('largeText')}
                      checked={accessibilityForm.watch('largeText')}
                      onChange={(checked) => accessibilityForm.setValue('largeText', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-600">🚫</span>
                      <div>
                        <p className="font-medium text-gray-900">Reduce Motion</p>
                        <p className="text-sm text-gray-600">Minimize animations and transitions</p>
                      </div>
                    </div>
                    <Switch
                      {...accessibilityForm.register('reducedMotion')}
                      checked={accessibilityForm.watch('reducedMotion')}
                      onChange={(checked) => accessibilityForm.setValue('reducedMotion', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-600">🔊</span>
                      <div>
                        <p className="font-medium text-gray-900">Screen Reader Support</p>
                        <p className="text-sm text-gray-600">Optimize for screen readers and assistive technologies</p>
                      </div>
                    </div>
                    <Switch
                      {...accessibilityForm.register('screenReaderSupport')}
                      checked={accessibilityForm.watch('screenReaderSupport')}
                      onChange={(checked) => accessibilityForm.setValue('screenReaderSupport', checked)}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    loading={isSubmitting}
                    disabled={!accessibilityForm.formState.isDirty}
                  >
                    Update Accessibility Settings
                  </Button>
                </div>
              </form>
            </TabPanel>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;