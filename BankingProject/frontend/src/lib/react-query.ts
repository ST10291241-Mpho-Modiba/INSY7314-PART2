import { QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Create a custom query client with optimized configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      // onError removed in v5 - handle errors in mutation callbacks
    },
  },
});

// Query keys for different data types
export const QUERY_KEYS = {
  // Auth
  USER: ['user'],
  PROFILE: ['profile'],
  
  // Payments
  TRANSACTIONS: ['transactions'],
  TRANSACTION: (id: string) => ['transaction', id],
  PAYMENT_METHODS: ['payment-methods'],
  PAYMENT_HISTORY: ['payment-history'],
  
  // Notifications
  NOTIFICATIONS: ['notifications'],
  NOTIFICATION_SETTINGS: ['notification-settings'],
  
  // Security
  SECURITY_SETTINGS: ['security-settings'],
  SECURITY_LOGS: ['security-logs'],
  
  // Accounts
  ACCOUNTS: ['accounts'],
  ACCOUNT: (id: string) => ['account', id],
  BALANCE: ['balance'],
  ACCOUNT_TRANSACTIONS: ['account-transactions'],
  ACCOUNT_STATEMENTS: ['account-statements'],
  
  // Notifications (additional)
  NOTIFICATION: (id: string) => ['notification', id],
  
  // Security (additional)
  SECURITY_ALERTS: ['security-alerts'],
  ENCRYPTION_KEY: ['encryption-key'],
  SESSION_VALIDATION: ['session-validation'],
  
  // Offline
  OFFLINE_DATA: ['offline-data'],
  SYNC_STATUS: ['sync-status'],
} as const;

// Helper function to invalidate related queries
export const invalidateQueries = (keys: string[]) => {
  keys.forEach(key => {
    queryClient.invalidateQueries({ queryKey: [key] });
  });
};

// Helper function to prefetch data
export const prefetchQuery = (key: string[], fn: () => Promise<any>) => {
  queryClient.prefetchQuery({
    queryKey: key,
    queryFn: fn,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Helper function to optimistically update data
export const optimisticUpdate = <T>(
  queryKey: string[],
  updater: (oldData: T) => T,
  rollback?: () => void
) => {
  const previousData = queryClient.getQueryData(queryKey);
  
  // Optimistically update the cache
  queryClient.setQueryData(queryKey, updater);
  
  return {
    rollback: () => {
      if (rollback) rollback();
      queryClient.setQueryData(queryKey, previousData);
    },
  };
};