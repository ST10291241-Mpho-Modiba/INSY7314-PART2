import React from 'react';
import { AuthProvider } from './AuthContext';
import { UIProvider } from './UIContext';
import { OfflineProvider } from './OfflineContext';
import { PaymentsProvider } from './PaymentsContext';

// Combined provider component
export const AppProvider = ({ children }) => {
  return (
    <OfflineProvider>
      <UIProvider>
        <AuthProvider>
          <PaymentsProvider>
            {children}
          </PaymentsProvider>
        </AuthProvider>
      </UIProvider>
    </OfflineProvider>
  );
};

// Export all hooks for convenience
export { useAuth } from './AuthContext';
export { useUI } from './UIContext';
export { useOffline } from './OfflineContext';
export { usePayments } from './PaymentsContext';