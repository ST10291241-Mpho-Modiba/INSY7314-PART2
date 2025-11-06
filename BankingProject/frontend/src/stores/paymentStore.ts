import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';

// Payment Store
interface PaymentState {
  // Current payment flow
  currentPayment: {
    step: number;
    data: any;
    errors: Record<string, string>;
  } | null;
  
  // Payment methods
  paymentMethods: Array<{
    id: string;
    type: 'card' | 'bank' | 'wallet';
    name: string;
    last4?: string;
    isDefault: boolean;
    isActive: boolean;
  }>;
  
  // Quick pay settings
  quickPayRecipients: Array<{
    id: string;
    name: string;
    account: string;
    lastUsed: string;
  }>;
  
  // Payment preferences
  preferences: {
    defaultPaymentMethod: string | null;
    enableBiometric: boolean;
    requireConfirmation: boolean;
    maxQuickPayAmount: number;
  };
  
  // Actions
  setCurrentPayment: (payment: PaymentState['currentPayment']) => void;
  updatePaymentStep: (step: number, data?: any) => void;
  setPaymentError: (field: string, error: string) => void;
  clearPaymentErrors: () => void;
  
  setPaymentMethods: (methods: PaymentState['paymentMethods']) => void;
  addPaymentMethod: (method: PaymentState['paymentMethods'][0]) => void;
  removePaymentMethod: (id: string) => void;
  setDefaultPaymentMethod: (id: string) => void;
  
  addQuickPayRecipient: (recipient: PaymentState['quickPayRecipients'][0]) => void;
  removeQuickPayRecipient: (id: string) => void;
  
  updatePreferences: (preferences: Partial<PaymentState['preferences']>) => void;
  
  // Transaction management
  transactions: any[];
  setTransactions: (transactions: any[]) => void;
  addTransaction: (transaction: any) => void;
  
  // Computed values
  getDefaultPaymentMethod: () => PaymentState['paymentMethods'][0] | undefined;
  getActivePaymentMethods: () => PaymentState['paymentMethods'];
  canUseQuickPay: (amount: number) => boolean;
}

export const usePaymentStore = create<PaymentState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      currentPayment: null,
      paymentMethods: [],
      quickPayRecipients: [],
      transactions: [],
      preferences: {
        defaultPaymentMethod: null,
        enableBiometric: false,
        requireConfirmation: true,
        maxQuickPayAmount: 500,
      },
      
      setCurrentPayment: (payment) => set({ currentPayment: payment }),
      
      updatePaymentStep: (step, data) => set((state) => ({
        currentPayment: state.currentPayment ? {
          ...state.currentPayment,
          step,
          data: { ...state.currentPayment.data, ...data },
        } : null,
      })),
      
      setPaymentError: (field, error) => set((state) => ({
        currentPayment: state.currentPayment ? {
          ...state.currentPayment,
          errors: { ...state.currentPayment.errors, [field]: error },
        } : null,
      })),
      
      clearPaymentErrors: () => set((state) => ({
        currentPayment: state.currentPayment ? {
          ...state.currentPayment,
          errors: {},
        } : null,
      })),
      
      setPaymentMethods: (methods) => set({ paymentMethods: methods }),
      
      addPaymentMethod: (method) => set((state) => ({
        paymentMethods: [...state.paymentMethods, method],
      })),
      
      removePaymentMethod: (id) => set((state) => ({
        paymentMethods: state.paymentMethods.filter(m => m.id !== id),
      })),
      
      setDefaultPaymentMethod: (id) => set((state) => ({
        paymentMethods: state.paymentMethods.map(m => ({
          ...m,
          isDefault: m.id === id,
        })),
        preferences: { ...state.preferences, defaultPaymentMethod: id },
      })),
      
      addQuickPayRecipient: (recipient) => set((state) => ({
        quickPayRecipients: [recipient, ...state.quickPayRecipients].slice(0, 10), // Keep top 10
      })),
      
      removeQuickPayRecipient: (id) => set((state) => ({
        quickPayRecipients: state.quickPayRecipients.filter(r => r.id !== id),
      })),
      
      updatePreferences: (preferences) => set((state) => ({
        preferences: { ...state.preferences, ...preferences },
      })),
      
      setTransactions: (transactions) => set({ transactions }),
      addTransaction: (transaction) => set((state) => ({
        transactions: [transaction, ...state.transactions],
      })),
      
      // Computed values
      getDefaultPaymentMethod: () => {
        const state = get();
        return state.paymentMethods.find(m => m.isDefault);
      },
      
      getActivePaymentMethods: () => {
        const state = get();
        return state.paymentMethods.filter(m => m.isActive);
      },
      
      canUseQuickPay: (amount) => {
        const state = get();
        return state.preferences.enableBiometric && amount <= state.preferences.maxQuickPayAmount;
      },
    })),
    {
      name: 'payment-store',
    }
  )
);