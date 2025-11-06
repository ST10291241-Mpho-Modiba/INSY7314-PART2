import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { useOfflineStore } from '../stores/offlineStore';
import { QUERY_KEYS } from '../lib/react-query';
import { toast } from 'sonner';

// API functions (these would be replaced with actual API calls)
const securityAPI = {
  getSecuritySettings: async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      twoFactorEnabled: false,
      biometricEnabled: false,
      sessionTimeout: 30, // minutes
      loginAttempts: 0,
      lastPasswordChange: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      trustedDevices: [
        {
          id: 'device-1',
          name: 'Chrome on Windows',
          type: 'browser',
          lastUsed: new Date().toISOString(),
          trusted: true,
        },
        {
          id: 'device-2',
          name: 'iPhone 12',
          type: 'mobile',
          lastUsed: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          trusted: true,
        },
      ],
      recentActivity: [
        {
          id: 'activity-1',
          type: 'login',
          device: 'Chrome on Windows',
          ip: '192.168.1.1',
          location: 'New York, NY',
          timestamp: new Date().toISOString(),
          success: true,
        },
        {
          id: 'activity-2',
          type: 'password_change',
          device: 'iPhone 12',
          ip: '192.168.1.2',
          location: 'New York, NY',
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          success: true,
        },
      ],
    };
  },
  
  updateTwoFactor: async (enabled: boolean, method?: 'sms' | 'app' | 'email') => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      success: true,
      twoFactorEnabled: enabled,
      backupCodes: enabled ? ['123456', '789012', '345678', '901234'] : undefined,
    };
  },
  
  updateBiometric: async (enabled: boolean) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 600));
    
    return {
      success: true,
      biometricEnabled: enabled,
    };
  },
  
  updateSessionTimeout: async (timeout: number) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 400));
    
    return {
      success: true,
      sessionTimeout: timeout,
    };
  },
  
  changePassword: async (currentPassword: string, newPassword: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate password validation
    if (currentPassword === newPassword) {
      throw new Error('New password must be different from current password');
    }
    
    if (newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }
    
    return {
      success: true,
      lastPasswordChange: new Date().toISOString(),
    };
  },
  
  manageTrustedDevice: async (deviceId: string, action: 'trust' | 'untrust' | 'remove') => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      action,
      deviceId,
    };
  },
  
  getSecurityAlerts: async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 600));
    
    return [
      {
        id: 'alert-1',
        type: 'suspicious_login',
        title: 'Suspicious Login Attempt',
        description: 'Login attempt from unrecognized device in San Francisco, CA',
        severity: 'high' as const,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        resolved: false,
        actionRequired: true,
      },
      {
        id: 'alert-2',
        type: 'password_weak',
        title: 'Weak Password Detected',
        description: 'Your password has not been changed in over 90 days',
        severity: 'medium' as const,
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        resolved: false,
        actionRequired: true,
      },
      {
        id: 'alert-3',
        type: 'device_untrusted',
        title: 'Untrusted Device',
        description: 'New device detected - iPad Pro',
        severity: 'low' as const,
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        resolved: true,
        actionRequired: false,
      },
    ];
  },
  
  resolveSecurityAlert: async (alertId: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 400));
    
    return {
      success: true,
      alertId,
      resolved: true,
      resolvedAt: new Date().toISOString(),
    };
  },
  
  getEncryptionKey: async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      key: 'encryption-key-12345',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
  },
  
  validateSession: async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return {
      valid: true,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
    };
  },
};

// Security Hooks
export const useSecuritySettings = () => {
  const { isOnline } = useOfflineStore();
  const setSecuritySettings = useAuthStore((state) => state.setSecuritySettings);
  
  const query = useQuery({
    queryKey: QUERY_KEYS.SECURITY_SETTINGS,
    queryFn: securityAPI.getSecuritySettings,
    enabled: isOnline,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Update Zustand store when data changes
  React.useEffect(() => {
    if (query.data) {
      setSecuritySettings(query.data);
    }
  }, [query.data]);
  
  return query;
};

export const useTwoFactor = () => {
  const queryClient = useQueryClient();
  const setSecuritySettings = useAuthStore((state) => state.setSecuritySettings);
  
  return useMutation({
    mutationFn: async (params: { enabled: boolean; method?: 'sms' | 'app' | 'email' }) => {
      return securityAPI.updateTwoFactor(params.enabled, params.method);
    },
    onSuccess: (data) => {
      setSecuritySettings({ twoFactorEnabled: data.twoFactorEnabled });
      toast.success(data.twoFactorEnabled ? 'Two-factor authentication enabled' : 'Two-factor authentication disabled');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SECURITY_SETTINGS });
      
      if (data.backupCodes) {
        toast.info('Backup codes generated. Please save them in a secure location.');
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update two-factor authentication');
    },
  });
};

export const useBiometric = () => {
  const queryClient = useQueryClient();
  const setSecuritySettings = useAuthStore((state) => state.setSecuritySettings);
  
  return useMutation({
    mutationFn: async (params: { enabled: boolean }) => {
      return securityAPI.updateBiometric(params.enabled);
    },
    onSuccess: (data) => {
      setSecuritySettings({ biometricEnabled: data.biometricEnabled });
      toast.success(data.biometricEnabled ? 'Biometric authentication enabled' : 'Biometric authentication disabled');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SECURITY_SETTINGS });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update biometric authentication');
    },
  });
};

export const useSessionTimeout = () => {
  const queryClient = useQueryClient();
  const setSecuritySettings = useAuthStore((state) => state.setSecuritySettings);
  
  return useMutation({
    mutationFn: async (params: { timeout: number }) => {
      return securityAPI.updateSessionTimeout(params.timeout);
    },
    onSuccess: (data) => {
      setSecuritySettings({ sessionTimeout: data.sessionTimeout });
      toast.success('Session timeout updated');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SECURITY_SETTINGS });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update session timeout');
    },
  });
};

export const useChangePassword = () => {
  const queryClient = useQueryClient();
  const setSecuritySettings = useAuthStore((state) => state.setSecuritySettings);
  
  return useMutation({
    mutationFn: async (params: { currentPassword: string; newPassword: string }) => {
      return securityAPI.changePassword(params.currentPassword, params.newPassword);
    },
    onSuccess: (data) => {
      // Note: lastPasswordChange is not in the user type, but we can update security settings
      setSecuritySettings({ lastPasswordChange: data.lastPasswordChange });
      toast.success('Password changed successfully');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SECURITY_SETTINGS });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to change password');
    },
  });
};

export const useManageTrustedDevice = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: { deviceId: string; action: 'trust' | 'untrust' | 'remove' }) => {
      return securityAPI.manageTrustedDevice(params.deviceId, params.action);
    },
    onSuccess: (data) => {
      toast.success(`Device ${data.action}d successfully`);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SECURITY_SETTINGS });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to manage device');
    },
  });
};

export const useSecurityAlerts = () => {
  const { isOnline } = useOfflineStore();
  
  return useQuery({
    queryKey: QUERY_KEYS.SECURITY_ALERTS,
    queryFn: securityAPI.getSecurityAlerts,
    enabled: isOnline,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useResolveSecurityAlert = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: securityAPI.resolveSecurityAlert,
    onSuccess: (data) => {
      toast.success('Security alert resolved');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SECURITY_ALERTS });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to resolve security alert');
    },
  });
};

export const useEncryptionKey = () => {
  const { isOnline } = useOfflineStore();
  
  return useQuery({
    queryKey: QUERY_KEYS.ENCRYPTION_KEY,
    queryFn: securityAPI.getEncryptionKey,
    enabled: isOnline,
    staleTime: 20 * 60 * 1000, // 20 minutes
  });
};

export const useValidateSession = () => {
  const { isOnline } = useOfflineStore();
  const setSessionExpiry = useAuthStore((state) => state.setSessionExpiry);
  
  const query = useQuery({
    queryKey: QUERY_KEYS.SESSION_VALIDATION,
    queryFn: securityAPI.validateSession,
    enabled: isOnline,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Handle success
  React.useEffect(() => {
    if (query.data) {
      setSessionExpiry((query.data as any).expiresAt);
    }
  }, [query.data, setSessionExpiry]);

  // Handle errors
  React.useEffect(() => {
    if (query.error) {
      // Session invalid, might need to refresh token or logout
      toast.error('Session validation failed');
    }
  }, [query.error]);

  return query;
};