// Auth hooks
export { useAuth, useTokenRefresh } from './useAuth';

// Payment hooks
export {
  useTransactions,
  useTransaction,
  useCreateTransaction,
  usePaymentMethods,
  useAddPaymentMethod,
  useSetDefaultPaymentMethod,
  useRemovePaymentMethod,
  useProcessPayment,
} from './usePayments';

// Notification hooks
export {
  useNotifications,
  useNotification,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
  useDeleteAllNotifications,
  useNotificationSettings,
  useUpdateNotificationSettings,
  useSyncNotifications,
} from './useNotifications';

// Security hooks
export {
  useSecuritySettings,
  useTwoFactor,
  useBiometric,
  useSessionTimeout,
  useChangePassword,
  useManageTrustedDevice,
  useSecurityAlerts,
  useResolveSecurityAlert,
  useEncryptionKey,
  useValidateSession,
} from './useSecurity';

// Account hooks
export {
  useAccounts,
  useAccount,
  useAccountTransactions,
  useCreateAccount,
  useUpdateAccount,
  useSetPrimaryAccount,
  useAccountStatements,
  useExportStatement,
} from './useAccounts';

// Re-export stores for convenience
export {
  useUIStore,
  usePaymentStore,
  useAuthStore,
  useNotificationStore,
  useOfflineStore,
  useAppStore,
} from '../stores';

// Re-export React Query utilities
export {
  queryClient,
  QUERY_KEYS,
  invalidateQueries,
  prefetchQuery,
  optimisticUpdate,
} from '../lib/react-query';