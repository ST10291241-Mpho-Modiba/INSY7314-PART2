import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import React from 'react';
import { useAuthStore } from '../stores/authStore';
import { QUERY_KEYS, invalidateQueries } from '../lib/react-query';
import { toast } from 'sonner';

// API functions (these would be replaced with actual API calls)
const authAPI = {
  login: async (credentials: { email: string; password: string }) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (credentials.email === 'demo@example.com' && credentials.password === 'password') {
      return {
        token: 'demo-token-' + Date.now(),
        refreshToken: 'demo-refresh-token-' + Date.now(),
        user: {
          id: '1',
          email: credentials.email,
          name: 'Demo User',
          role: 'user' as const,
          isVerified: true,
          twoFactorEnabled: false,
          lastLogin: new Date().toISOString(),
        },
      };
    }
    
    throw new Error('Invalid credentials');
  },
  
  logout: async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true };
  },
  
  refreshToken: async (refreshToken: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      token: 'new-token-' + Date.now(),
      refreshToken: 'new-refresh-token-' + Date.now(),
    };
  },
  
  getProfile: async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      id: '1',
      email: 'demo@example.com',
      name: 'Demo User',
      avatar: 'https://via.placeholder.com/150',
      role: 'user' as const,
      isVerified: true,
      twoFactorEnabled: false,
      lastLogin: new Date().toISOString(),
    };
  },
  
  updateProfile: async (data: any) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    return { success: true, user: data };
  },
  
  changePassword: async (data: { currentPassword: string; newPassword: string }) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true };
  },
  
  getSecuritySettings: async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      twoFactorEnabled: false,
      biometricEnabled: false,
      sessionTimeout: 30,
      loginAttempts: 0,
      lastPasswordChange: new Date().toISOString(),
    };
  },
  
  updateSecuritySettings: async (settings: any) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    return { success: true, settings };
  },
};

// Auth Hooks
export const useAuth = () => {
  const { user, isAuthenticated, isLoading, token, securitySettings } = useAuthStore();
  const setAuth = useAuthStore((state) => state.setAuth);
  const logoutStore = useAuthStore((state) => state.logout);
  const updateUser = useAuthStore((state) => state.updateUser);
  const setSecuritySettings = useAuthStore((state) => state.setSecuritySettings);
  const queryClient = useQueryClient();
  
  // Login mutation
  const loginMutation = useMutation({
    mutationFn: authAPI.login,
    onSuccess: (data) => {
      setAuth(data);
      toast.success('Login successful');
      invalidateQueries([QUERY_KEYS.USER[0], QUERY_KEYS.PROFILE[0]]);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Login failed');
    },
  });
  
  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: authAPI.logout,
    onSuccess: () => {
      logoutStore();
      queryClient.clear();
      toast.success('Logged out successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Logout failed');
      // Still logout locally even if API fails
      logoutStore();
      queryClient.clear();
    },
  });
  
  // Profile query
  const profileQuery = useQuery({
    queryKey: QUERY_KEYS.PROFILE,
    queryFn: authAPI.getProfile,
    enabled: isAuthenticated && !!token,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update user when profile data changes
  React.useEffect(() => {
    if (profileQuery.data) {
      updateUser(profileQuery.data);
    }
  }, [profileQuery.data, updateUser]);
  
  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: authAPI.updateProfile,
    onSuccess: (data) => {
      updateUser(data.user);
      toast.success('Profile updated successfully');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PROFILE });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update profile');
    },
  });
  
  // Password change mutation
  const changePasswordMutation = useMutation({
    mutationFn: authAPI.changePassword,
    onSuccess: () => {
      toast.success('Password changed successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to change password');
    },
  });
  
  // Security settings query
  const securitySettingsQuery = useQuery({
    queryKey: QUERY_KEYS.SECURITY_SETTINGS,
    queryFn: authAPI.getSecuritySettings,
    enabled: isAuthenticated && !!token,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Update security settings when data changes
  React.useEffect(() => {
    if (securitySettingsQuery.data) {
      setSecuritySettings(securitySettingsQuery.data);
    }
  }, [securitySettingsQuery.data, setSecuritySettings]);
  
  // Security settings update mutation
  const updateSecuritySettingsMutation = useMutation({
    mutationFn: authAPI.updateSecuritySettings,
    onSuccess: (data) => {
      setSecuritySettings(data.settings);
      toast.success('Security settings updated successfully');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SECURITY_SETTINGS });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update security settings');
    },
  });
  
  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    token,
    securitySettings,
    
    // Queries
    profile: profileQuery.data,
    profileLoading: profileQuery.isLoading,
    profileError: profileQuery.error,
    
    securitySettingsData: securitySettingsQuery.data,
    securitySettingsLoading: securitySettingsQuery.isLoading,
    securitySettingsError: securitySettingsQuery.error,
    
    // Mutations
    login: loginMutation.mutate,
    loginLoading: loginMutation.isPending,
    
    logout: logoutMutation.mutate,
    logoutLoading: logoutMutation.isPending,
    
    updateProfile: updateProfileMutation.mutate,
    updateProfileLoading: updateProfileMutation.isPending,
    
    changePassword: changePasswordMutation.mutate,
    changePasswordLoading: changePasswordMutation.isPending,
    
    updateSecuritySettings: updateSecuritySettingsMutation.mutate,
    updateSecuritySettingsLoading: updateSecuritySettingsMutation.isPending,
  };
};

// Hook for token refresh
export const useTokenRefresh = () => {
  const { token, refreshToken, shouldRefreshToken } = useAuthStore();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  const refreshTokenMutation = useMutation({
    mutationFn: authAPI.refreshToken,
    onSuccess: (data) => {
      setAuth({ token: data.token, refreshToken: data.refreshToken, user: useAuthStore.getState().user! });
    },
    onError: (error) => {
      console.error('Token refresh failed:', error);
      // Force logout on refresh failure
      useAuthStore.getState().logout();
    },
  });
  
  // Auto-refresh token when needed
  React.useEffect(() => {
    if (shouldRefreshToken() && refreshToken) {
      refreshTokenMutation.mutate(refreshToken);
    }
  }, [shouldRefreshToken(), refreshToken]);
  
  return {
    refreshToken: refreshTokenMutation.mutate,
    isRefreshing: refreshTokenMutation.isPending,
  };
};