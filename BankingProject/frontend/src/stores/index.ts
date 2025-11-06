// Zustand Store Exports
import { useUIStore } from './uiStore';
import { usePaymentStore } from './paymentStore';
import { useAuthStore } from './authStore';
import { useNotificationStore } from './notificationStore';
import { useOfflineStore } from './offlineStore';

export { useUIStore } from './uiStore';
export { usePaymentStore } from './paymentStore';
export { useAuthStore } from './authStore';
export { useNotificationStore } from './notificationStore';
export { useOfflineStore } from './offlineStore';

// React Query exports
export { queryClient, QUERY_KEYS, invalidateQueries, prefetchQuery, optimisticUpdate } from '../lib/react-query';

// Combined store hooks for convenience
export const useAppStore = () => {
  const ui = useUIStore();
  const auth = useAuthStore();
  const payments = usePaymentStore();
  const notifications = useNotificationStore();
  const offline = useOfflineStore();
  
  return {
    ui,
    auth,
    payments,
    notifications,
    offline,
  };
};