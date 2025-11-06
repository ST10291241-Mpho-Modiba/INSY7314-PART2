import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';

// Auth Store
interface AuthState {
  // User data
  user: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    role: 'user' | 'admin';
    isVerified: boolean;
    twoFactorEnabled: boolean;
    lastLogin: string;
  } | null;
  
  // Authentication state
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  refreshToken: string | null;
  
  // Security settings
  securitySettings: {
    twoFactorEnabled: boolean;
    biometricEnabled: boolean;
    sessionTimeout: number; // minutes
    loginAttempts: number;
    lastPasswordChange: string | null;
  };
  
  // Session management
  sessionExpiry: number | null;
  lastActivity: number | null;
  
  // Actions
  setUser: (user: AuthState['user']) => void;
  setAuth: (auth: { token: string; refreshToken?: string; user: AuthState['user'] }) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  updateUser: (updates: Partial<NonNullable<AuthState['user']>>) => void;
  
  setSecuritySettings: (settings: Partial<AuthState['securitySettings']>) => void;
  setSessionExpiry: (expiry: number | null) => void;
  updateLastActivity: () => void;
  
  // Computed values
  isSessionValid: () => boolean;
  shouldRefreshToken: () => boolean;
  getTimeUntilExpiry: () => number | null;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      subscribeWithSelector((set, get) => ({
        user: null,
        isAuthenticated: false,
        isLoading: true,
        token: null,
        refreshToken: null,
        
        securitySettings: {
          twoFactorEnabled: false,
          biometricEnabled: false,
          sessionTimeout: 30,
          loginAttempts: 0,
          lastPasswordChange: null,
        },
        
        sessionExpiry: null,
        lastActivity: null,
        
        setUser: (user) => set({ user }),
        
        setAuth: ({ token, refreshToken, user }) => {
          const sessionExpiry = Date.now() + (30 * 60 * 1000); // 30 minutes
          set({
            user,
            token,
            refreshToken: refreshToken || null,
            isAuthenticated: true,
            isLoading: false,
            sessionExpiry,
            lastActivity: Date.now(),
          });
        },
        
        setLoading: (loading) => set({ isLoading: loading }),
        
        logout: () => set({
          user: null,
          isAuthenticated: false,
          token: null,
          refreshToken: null,
          sessionExpiry: null,
          lastActivity: null,
          isLoading: false,
        }),
        
        updateUser: (updates) => set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
        
        setSecuritySettings: (settings) => set((state) => ({
          securitySettings: { ...state.securitySettings, ...settings },
        })),
        
        setSessionExpiry: (expiry) => set({ sessionExpiry: expiry }),
        
        updateLastActivity: () => set({ lastActivity: Date.now() }),
        
        // Computed values
        isSessionValid: () => {
          const state = get();
          if (!state.sessionExpiry || !state.lastActivity) return false;
          
          const now = Date.now();
          const sessionValid = now < state.sessionExpiry;
          const activityValid = (now - state.lastActivity) < (state.securitySettings.sessionTimeout * 60 * 1000);
          
          return sessionValid && activityValid;
        },
        
        shouldRefreshToken: () => {
          const state = get();
          if (!state.sessionExpiry) return false;
          
          const now = Date.now();
          const timeUntilExpiry = state.sessionExpiry - now;
          
          // Refresh if token expires in less than 5 minutes
          return timeUntilExpiry < (5 * 60 * 1000);
        },
        
        getTimeUntilExpiry: () => {
          const state = get();
          if (!state.sessionExpiry) return null;
          
          const now = Date.now();
          return Math.max(0, state.sessionExpiry - now);
        },
      })),
      {
        name: 'auth-store',
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          securitySettings: state.securitySettings,
        }),
      }
    ),
    {
      name: 'auth-store',
    }
  )
);

// Subscribe to session expiry and auto-logout
useAuthStore.subscribe(
  (state) => ({ sessionExpiry: state.sessionExpiry, isAuthenticated: state.isAuthenticated }),
  ({ sessionExpiry, isAuthenticated }) => {
    if (!isAuthenticated || !sessionExpiry) return;
    
    const checkInterval = setInterval(() => {
      const state = useAuthStore.getState();
      if (!state.isSessionValid()) {
        state.logout();
        clearInterval(checkInterval);
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(checkInterval);
  }
);