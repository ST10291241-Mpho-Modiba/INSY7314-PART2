import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOfflineStore } from '../stores/offlineStore';
import { QUERY_KEYS } from '../lib/react-query';
import { toast } from 'sonner';

// API functions (these would be replaced with actual API calls)
const accountsAPI = {
  getAccounts: async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 700));
    
    return [
      {
        id: 'account-1',
        type: 'checking' as const,
        name: 'Primary Checking',
        accountNumber: '****1234',
        balance: 5423.67,
        availableBalance: 5423.67,
        currency: 'USD',
        status: 'active' as const,
        isPrimary: true,
        lastActivity: new Date().toISOString(),
        routingNumber: '021000021',
        interestRate: 0.01,
      },
      {
        id: 'account-2',
        type: 'savings' as const,
        name: 'High Yield Savings',
        accountNumber: '****5678',
        balance: 12543.21,
        availableBalance: 12543.21,
        currency: 'USD',
        status: 'active' as const,
        isPrimary: false,
        lastActivity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        routingNumber: '021000021',
        interestRate: 2.5,
      },
      {
        id: 'account-3',
        type: 'credit' as const,
        name: 'Rewards Credit Card',
        accountNumber: '****9012',
        balance: -1234.56,
        availableBalance: 8765.44,
        creditLimit: 10000,
        currency: 'USD',
        status: 'active' as const,
        isPrimary: false,
        lastActivity: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        interestRate: 18.99,
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        minimumPayment: 25.00,
      },
    ];
  },
  
  getAccount: async (id: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const accounts = await accountsAPI.getAccounts();
    return accounts.find(acc => acc.id === id);
  },
  
  getAccountTransactions: async (accountId: string, page = 1, limit = 20) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const transactions = Array.from({ length: limit }, (_, i) => ({
      id: `transaction-${accountId}-${page}-${i}`,
      accountId,
      amount: (Math.random() - 0.5) * 500,
      description: `Transaction ${page}-${i}`,
      type: ['debit', 'credit'][Math.floor(Math.random() * 2)] as 'debit' | 'credit',
      category: ['food', 'transport', 'shopping', 'bills', 'entertainment'][Math.floor(Math.random() * 5)],
      timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      balanceAfter: Math.random() * 10000,
      merchant: `Merchant ${page}-${i}`,
      location: 'New York, NY',
      status: 'completed' as const,
    }));
    
    return {
      transactions,
      total: 100,
      page,
      totalPages: 5,
      hasNext: page < 5,
    };
  },
  
  createAccount: async (data: {
    type: 'checking' | 'savings' | 'credit';
    name: string;
    initialDeposit?: number;
  }) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    return {
      id: `account-${Date.now()}`,
      ...data,
      accountNumber: '****' + Math.floor(1000 + Math.random() * 9000),
      balance: data.initialDeposit || 0,
      availableBalance: data.initialDeposit || 0,
      currency: 'USD',
      status: 'active',
      isPrimary: false,
      lastActivity: new Date().toISOString(),
      routingNumber: '021000021',
      interestRate: data.type === 'savings' ? 2.5 : 0.01,
    };
  },
  
  updateAccount: async (id: string, data: {
    name?: string;
    status?: 'active' | 'inactive';
  }) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      id,
      ...data,
      updatedAt: new Date().toISOString(),
    };
  },
  
  setPrimaryAccount: async (id: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 600));
    
    return {
      success: true,
      accountId: id,
    };
  },
  
  getAccountStatements: async (accountId: string, year: number, month: number) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 900));
    
    return {
      id: `statement-${accountId}-${year}-${month}`,
      accountId,
      year,
      month,
      startDate: new Date(year, month - 1, 1).toISOString(),
      endDate: new Date(year, month, 0).toISOString(),
      openingBalance: 1000,
      closingBalance: 1500,
      totalCredits: 2000,
      totalDebits: 1500,
      transactions: 45,
      pdfUrl: `/statements/${accountId}/${year}/${month}.pdf`,
      csvUrl: `/statements/${accountId}/${year}/${month}.csv`,
    };
  },
  
  exportStatement: async (accountId: string, format: 'pdf' | 'csv', startDate: string, endDate: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      success: true,
      downloadUrl: `/exports/${accountId}-${format}-${Date.now()}.${format}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
  },
};

import React from 'react';

// Account Hooks
export const useAccounts = () => {
  const { isOnline } = useOfflineStore();
  
  return useQuery({
    queryKey: QUERY_KEYS.ACCOUNTS,
    queryFn: accountsAPI.getAccounts,
    enabled: isOnline,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useAccount = (id: string) => {
  const { isOnline } = useOfflineStore();
  
  return useQuery({
    queryKey: QUERY_KEYS.ACCOUNT(id),
    queryFn: () => accountsAPI.getAccount(id),
    enabled: isOnline && !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useAccountTransactions = (accountId: string, page = 1, limit = 20) => {
  const { isOnline } = useOfflineStore();
  
  return useQuery({
    queryKey: [QUERY_KEYS.ACCOUNT_TRANSACTIONS[0], accountId, page],
    queryFn: () => accountsAPI.getAccountTransactions(accountId, page, limit),
    enabled: isOnline && !!accountId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useCreateAccount = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: accountsAPI.createAccount,
    onSuccess: (data) => {
      toast.success('Account created successfully');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ACCOUNTS });
      return data;
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create account');
    },
  });
};

export const useUpdateAccount = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => accountsAPI.updateAccount(id, data),
    onSuccess: (data, variables) => {
      toast.success('Account updated successfully');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ACCOUNTS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ACCOUNT(variables.id) });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update account');
    },
  });
};

export const useSetPrimaryAccount = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: accountsAPI.setPrimaryAccount,
    onSuccess: (data, accountId) => {
      toast.success('Primary account updated');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ACCOUNTS });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to set primary account');
    },
  });
};

export const useAccountStatements = (accountId: string, year: number, month: number) => {
  const { isOnline } = useOfflineStore();
  
  return useQuery({
    queryKey: [QUERY_KEYS.ACCOUNT_STATEMENTS[0], accountId, year, month],
    queryFn: () => accountsAPI.getAccountStatements(accountId, year, month),
    enabled: isOnline && !!accountId,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
};

export const useExportStatement = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ accountId, format, startDate, endDate }: {
      accountId: string;
      format: 'pdf' | 'csv';
      startDate: string;
      endDate: string;
    }) => accountsAPI.exportStatement(accountId, format, startDate, endDate),
    onSuccess: (data) => {
      toast.success('Statement export initiated');
      // In a real app, you might trigger a download here
      console.log('Export ready:', data.downloadUrl);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to export statement');
    },
  });
};