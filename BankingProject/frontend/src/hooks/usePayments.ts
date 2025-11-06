import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { usePaymentStore } from '../stores/paymentStore';
import { useOfflineStore } from '../stores/offlineStore';
import { QUERY_KEYS, optimisticUpdate } from '../lib/react-query';
import { toast } from 'sonner';

// API functions (these would be replaced with actual API calls)
const paymentsAPI = {
  getTransactions: async (page = 1, limit = 10, filters = {}) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const mockTransactions = Array.from({ length: limit }, (_, i) => ({
      id: `transaction-${page}-${i}`,
      amount: Math.random() * 1000,
      currency: 'USD',
      status: ['pending', 'completed', 'failed'][Math.floor(Math.random() * 3)],
      type: ['payment', 'transfer', 'refund'][Math.floor(Math.random() * 3)],
      recipient: `Recipient ${page}-${i}`,
      description: `Test transaction ${page}-${i}`,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    
    return {
      transactions: mockTransactions,
      total: 100,
      page,
      totalPages: 10,
      hasNext: page < 10,
    };
  },
  
  getTransaction: async (id: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      id,
      amount: Math.random() * 1000,
      currency: 'USD',
      status: 'completed',
      type: 'payment',
      recipient: 'Test Recipient',
      description: 'Test transaction',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      details: {
        paymentMethod: 'card',
        cardLast4: '1234',
        processingFee: 2.5,
        netAmount: 997.5,
      },
    };
  },
  
  createTransaction: async (data: {
    amount: number;
    currency: string;
    recipient: string;
    description?: string;
    paymentMethodId: string;
  }) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      id: `transaction-${Date.now()}`,
      ...data,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },
  
  updateTransaction: async (id: string, data: any) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      id,
      ...data,
      updatedAt: new Date().toISOString(),
    };
  },
  
  getPaymentMethods: async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 600));
    
    return [
      {
        id: 'card-1',
        type: 'card' as const,
        name: 'Visa ****1234',
        last4: '1234',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'bank-1',
        type: 'bank' as const,
        name: 'Chase Bank',
        isDefault: false,
        isActive: true,
      },
      {
        id: 'wallet-1',
        type: 'wallet' as const,
        name: 'PayPal',
        isDefault: false,
        isActive: true,
      },
    ];
  },
  
  addPaymentMethod: async (data: {
    type: 'card' | 'bank' | 'wallet';
    name: string;
    details: any;
  }) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    return {
      id: `method-${Date.now()}`,
      type: data.type,
      name: data.name,
      isDefault: false,
      isActive: true,
      ...data.details,
    };
  },
  
  setDefaultPaymentMethod: async (id: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return { success: true };
  },
  
  removePaymentMethod: async (id: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 600));
    
    return { success: true };
  },
  
  processPayment: async (data: {
    amount: number;
    currency: string;
    recipient: string;
    paymentMethodId: string;
    description?: string;
  }) => {
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate different outcomes
    const success = Math.random() > 0.1; // 90% success rate
    
    if (success) {
      return {
        success: true,
        transactionId: `transaction-${Date.now()}`,
        status: 'completed',
        processingTime: 2000,
      };
    } else {
      throw new Error('Payment processing failed');
    }
  },
};

import React from 'react';

// Payment Hooks
export const useTransactions = (filters = {}, options = {}) => {
  const { isOnline } = useOfflineStore();
  const setTransactions = usePaymentStore((state) => state.setTransactions);
  
  const query = useInfiniteQuery({
    queryKey: [QUERY_KEYS.TRANSACTIONS[0], filters],
    queryFn: ({ pageParam = 1 }: { pageParam: number }) => paymentsAPI.getTransactions(pageParam, 10, filters),
    initialPageParam: 1,
    getNextPageParam: (lastPage: any) => lastPage.hasNext ? lastPage.page + 1 : undefined,
    enabled: isOnline,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
  
  // Update Zustand store when data changes
  React.useEffect(() => {
    if (query.data) {
      const allTransactions = query.data.pages.flatMap(page => page.transactions);
      setTransactions(allTransactions);
    }
  }, [query.data]);
  
  return {
    ...query,
    transactions: query.data?.pages.flatMap(page => page.transactions) || [],
    total: query.data?.pages[0]?.total || 0,
  };
};

export const useTransaction = (id: string) => {
  const { isOnline } = useOfflineStore();
  
  return useQuery({
    queryKey: QUERY_KEYS.TRANSACTION(id),
    queryFn: () => paymentsAPI.getTransaction(id),
    enabled: isOnline && !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  const { isOnline } = useOfflineStore();
  const addToSyncQueue = useOfflineStore((state) => state.addToSyncQueue);
  const addTransaction = usePaymentStore((state) => state.addTransaction);
  
  const mutation = useMutation({
    mutationFn: paymentsAPI.createTransaction,
    onMutate: async (newTransaction) => {
      // Optimistic update
      const tempId = `temp-${Date.now()}`;
      const optimisticTransaction = {
        id: tempId,
        ...newTransaction,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Add to store immediately
      addTransaction(optimisticTransaction);
      
      return { tempId, optimisticTransaction };
    },
    onSuccess: (data, variables, context) => {
      // Replace optimistic transaction with real one
      if (context?.tempId) {
        queryClient.setQueryData(
          [QUERY_KEYS.TRANSACTIONS[0]],
          (old: any) => {
            if (!old) return old;
            return {
              ...old,
              pages: old.pages.map((page: any) => ({
                ...page,
                transactions: page.transactions.map((t: any) =>
                  t.id === context.tempId ? data : t
                ),
              })),
            };
          }
        );
      }
      
      toast.success('Transaction created successfully');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TRANSACTIONS });
    },
    onError: (error: any, variables, context) => {
      // Remove optimistic transaction on error
      if (context?.tempId) {
        queryClient.setQueryData(
          [QUERY_KEYS.TRANSACTIONS[0]],
          (old: any) => {
            if (!old) return old;
            return {
              ...old,
              pages: old.pages.map((page: any) => ({
                ...page,
                transactions: page.transactions.filter((t: any) => t.id !== context.tempId),
              })),
            };
          }
        );
      }
      
      // Queue for offline sync if offline
      if (!isOnline) {
        addToSyncQueue({
          type: 'create',
          entity: 'transaction',
          data: variables,
          maxRetries: 3,
        });
        toast.info('Transaction queued for sync');
      } else {
        toast.error(error.message || 'Failed to create transaction');
      }
    },
  });
  
  return mutation;
};

export const usePaymentMethods = () => {
  const { isOnline } = useOfflineStore();
  const setPaymentMethods = usePaymentStore((state) => state.setPaymentMethods);
  
  const query = useQuery({
    queryKey: QUERY_KEYS.PAYMENT_METHODS,
    queryFn: paymentsAPI.getPaymentMethods,
    enabled: isOnline,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
  
  // Update Zustand store when data changes
  React.useEffect(() => {
    if (query.data) {
      setPaymentMethods(query.data);
    }
  }, [query.data]);
  
  return query;
};

export const useAddPaymentMethod = () => {
  const queryClient = useQueryClient();
  const addPaymentMethod = usePaymentStore((state) => state.addPaymentMethod);
  
  return useMutation({
    mutationFn: paymentsAPI.addPaymentMethod,
    onSuccess: (data) => {
      addPaymentMethod(data);
      toast.success('Payment method added successfully');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PAYMENT_METHODS });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add payment method');
    },
  });
};

export const useSetDefaultPaymentMethod = () => {
  const queryClient = useQueryClient();
  const setDefaultPaymentMethod = usePaymentStore((state) => state.setDefaultPaymentMethod);
  
  return useMutation({
    mutationFn: paymentsAPI.setDefaultPaymentMethod,
    onSuccess: (data, variables) => {
      setDefaultPaymentMethod(variables);
      toast.success('Default payment method updated');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PAYMENT_METHODS });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update default payment method');
    },
  });
};

export const useRemovePaymentMethod = () => {
  const queryClient = useQueryClient();
  const removePaymentMethod = usePaymentStore((state) => state.removePaymentMethod);
  
  return useMutation({
    mutationFn: paymentsAPI.removePaymentMethod,
    onSuccess: (data, variables) => {
      removePaymentMethod(variables);
      toast.success('Payment method removed successfully');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PAYMENT_METHODS });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to remove payment method');
    },
  });
};

export const useProcessPayment = () => {
  const queryClient = useQueryClient();
  const { isOnline } = useOfflineStore();
  const addToSyncQueue = useOfflineStore((state) => state.addToSyncQueue);
  
  return useMutation({
    mutationFn: paymentsAPI.processPayment,
    onSuccess: (data) => {
      toast.success('Payment processed successfully');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TRANSACTIONS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PAYMENT_HISTORY });
      return data;
    },
    onError: (error: any) => {
      if (!isOnline) {
        toast.info('Payment queued for processing when online');
      } else {
        toast.error(error.message || 'Payment processing failed');
      }
      throw error;
    },
  });
};