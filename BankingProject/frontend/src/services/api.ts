import api from '../api/axiosConfig';

export interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
}

export interface SecuritySettingsData {
  twoFactorEnabled: boolean;
  biometricEnabled: boolean;
  sessionTimeout: number;
  loginAlerts?: boolean;
  transactionAlerts?: boolean;
}

export interface NotificationSettingsData {
  email: boolean;
  sms: boolean;
  push: boolean;
  transactionAlerts: boolean;
  securityAlerts: boolean;
  marketingEmails: boolean;
}

export interface AccessibilitySettingsData {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  screenReaderSupport: boolean;
}

export async function updateProfile(data: ProfileData) {
  const res = await api.put('/profile', data);
  return res.data;
}

export async function changePassword(data: { currentPassword: string; newPassword: string }) {
  const res = await api.post('/profile/change-password', data);
  return res.data;
}

export async function updateSecuritySettings(data: SecuritySettingsData) {
  const res = await api.put('/profile/security-settings', data);
  return res.data;
}

export async function updateNotificationSettings(data: NotificationSettingsData) {
  const res = await api.put('/profile/notification-settings', data);
  return res.data;
}

export async function updateAccessibilitySettings(data: AccessibilitySettingsData) {
  const res = await api.put('/profile/accessibility-settings', data);
  return res.data;
}