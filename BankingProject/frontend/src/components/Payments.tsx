import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCardIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChartBarIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  PaperAirplaneIcon,
  XMarkIcon,
  BanknotesIcon,
  ShieldCheckIcon,
  CogIcon,
  BellIcon,
  ArrowPathIcon,
  DocumentDuplicateIcon,
  QrCodeIcon,
  UserGroupIcon,
  SparklesIcon,
  WalletIcon,
  CurrencyDollarIcon,
  ChartPieIcon,
  FunnelIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../api/axiosConfig';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useNotifications } from '../contexts/NotificationContext';
import { useNotificationErrorHandler } from '../hooks/useNotificationErrorHandler';
import { useToast } from '../contexts/ToastContext';
import { useServiceWorker, useOfflineData, useBackgroundSync } from '../hooks/useServiceWorker';
import { 
  LoadingSpinner, 
  AccountLoadingSkeleton, 
  TransactionListSkeleton,
  LoadingButton,
  PaymentProcessingAnimation
} from './ui/LoadingStates';
import { useAccessibility, useKeyboardNavigation, useFocusRestore } from '../hooks/useAccessibility';
import { useResponsive, useResponsiveModal } from '../hooks/useResponsive';
import { CompactOfflineIndicator } from './ui/OfflineIndicator';
import { useOfflineStatus } from '../hooks/useOfflineStatus';
import { 
  fadeInUp, 
  scaleIn, 
  getAnimationVariant,
  transactionSlideIn,
  modalBackdrop,
  modalContent,
  mobileModalContent,
  tabContent,
  staggerContainer,
  staggerItem,
  hoverLift,
  balanceReveal,
  hoverScale,
  slideInRight,
  slideInLeft
} from '../utils/animations';
import { PaymentErrorBoundary, TransactionErrorBoundary } from './ErrorBoundary';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

// Type definitions
interface AccountData {
  balance: number;
  availableCredit: number;
  creditLimit: number;
  monthlySpending: number;
  spendingChange: number;
  lastMonthChange?: number;
  accountNumber: string;
  routingNumber: string;
  currency: string;
  interestRate: number;
  minimumPayment: number;
  dueDate: string;
}

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  recipient: string;
  date: string;
  category: string;
  status: 'completed' | 'pending' | 'failed' | 'processing';
  referenceNumber?: string;
  merchant?: string;
  location?: string;
  tags?: string[];
}

interface PaymentFormData {
  amount: string;
  currency: string;
  recipient: string;
  description: string;
  paymentMethod: 'balance' | 'credit' | 'bank';
  saveRecipient: boolean;
  schedulePayment: boolean;
  scheduledDate?: string;
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  action: () => void;
  color: string;
  description: string;
}

interface Insight {
  id: string;
  type: 'spending' | 'saving' | 'budget' | 'trend';
  title: string;
  description: string;
  value: string;
  change: number;
  icon: React.ComponentType<any>;
  color: string;
}

// Form validation schema
const paymentSchema = z.object({
  amount: z.string()
    .min(1, 'Amount is required')
    .refine((val) => parseFloat(val) > 0, 'Amount must be greater than 0')
    .refine((val) => parseFloat(val) <= 100000, 'Amount exceeds maximum limit'),
  currency: z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD']),
  recipient: z.string()
    .min(2, 'Recipient name must be at least 2 characters')
    .max(100, 'Recipient name is too long')
    .regex(/^[a-zA-Z\s\-']+$/, 'Recipient name can only contain letters, spaces, hyphens, and apostrophes'),
  description: z.string().max(200, 'Description is too long').optional(),
  paymentMethod: z.enum(['balance', 'credit', 'bank']),
  saveRecipient: z.boolean().optional(),
  schedulePayment: z.boolean().optional(),
  scheduledDate: z.string().optional().refine((val) => {
    if (!val) return true;
    const date = new Date(val);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  }, 'Scheduled date must be today or in the future')
});

const Payments: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'analytics' | 'recipients'>('overview');
  const [showBalance, setShowBalance] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showInsights, setShowInsights] = useState(true);
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'credit' | 'debit' | 'pending'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [paymentStep, setPaymentStep] = useState(1);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showTransactionDetail, setShowTransactionDetail] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { user } = useAuth();
  const { showNotification } = useUI();
  const { handleError } = useErrorHandler();
  const notifications = useNotifications();
  const { 
    handleApiError, 
    handleTransactionError, 
    showSuccess, 
    showInfo 
  } = useNotificationErrorHandler();
  
  const { showSuccess: showToastSuccess, showError: showToastError, showInfo: showToastInfo } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  // Service Worker hooks
  const { isOnline, checkForUpdates } = useServiceWorker();
  const { cacheData, getCachedData, clearCachedData } = useOfflineData();
  const { addToSyncQueue, getSyncQueue } = useBackgroundSync();
  
  // Accessibility and offline hooks
  const { announce, focusElement, prefersReducedMotion } = useAccessibility();
  const shouldReduceMotion = prefersReducedMotion();
  const { saveFocus, restoreFocus } = useFocusRestore();
  const { isOnline: networkOnline } = useOfflineStatus();
  
  // Responsive hooks
  const { isMobile, isTablet, isDesktop, screenSize } = useResponsive();
  const { getModalSize, getModalPosition } = useResponsiveModal();
  const modalSize = getModalSize();
  const modalPosition = getModalPosition();

  // Form setup
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: '',
      currency: 'USD',
      recipient: '',
      description: '',
      paymentMethod: 'balance',
      saveRecipient: false,
      schedulePayment: false
    }
  });

  // Watch form values
  const watchSchedulePayment = watch('schedulePayment');
  const watchPaymentMethod = watch('paymentMethod');

  // Query account data
  const { data: accountData, isLoading: accountLoading, error: accountError } = useQuery<AccountData>({
    queryKey: ['accountData'],
    queryFn: async () => {
      const response = await api.get('/api/payments/account');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 3,
    retryDelay: 1000
  });

  // Query transactions
  const { data: transactions = [], isLoading: transactionsLoading, error: transactionsError } = useQuery<Transaction[]>({
    queryKey: ['transactions', dateRange, transactionFilter],
    queryFn: async () => {
      const response = await api.get(`/api/payments/transactions?range=${dateRange}&filter=${transactionFilter}`);
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
    retry: 2,
    retryDelay: 1000
  });

  // Payment mutation
  const paymentMutation = useMutation({
    mutationFn: async (data: PaymentFormData) => {
      const response = await api.post('/api/payments/process', data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      showToastSuccess(
        'Payment Sent Successfully!',
        `${formatCurrency(Number(variables.amount))} has been sent to ${variables.recipient}`,
        {
          duration: 6000,
          actions: [
            {
              label: 'View Receipt',
              handler: () => navigate(`/payments/receipt/${data.transactionId}`),
              variant: 'primary' as const
            },
            {
              label: 'Send Another',
              handler: () => {
                reset();
                setPaymentStep(1);
              },
              variant: 'secondary' as const
            }
          ]
        }
      );
      
      announce(`Payment of ${formatCurrency(Number(variables.amount))} sent successfully to ${variables.recipient}`);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['accountData'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      
      // Reset form and close modal
      reset();
      setTimeout(() => {
        setShowPaymentModal(false);
        restoreFocus();
      }, 2000);
    },
    onError: (error: any, variables) => {
      console.error('Payment submission error:', error);
      
      // Reset payment step
      setPaymentStep(1);
      
      // Determine error message
      let errorMessage = 'Payment processing failed. Please try again.';
      let errorTitle = 'Payment Failed';
      
      if (error.response) {
        const status = error.response.status;
        const serverMessage = error.response.data?.msg || error.response.data?.message;
        
        if (status === 503) {
          errorTitle = 'Service Temporarily Unavailable';
          errorMessage = 'Our payment system is temporarily unavailable. Please try again later.';
        } else if (status === 400) {
          errorTitle = 'Invalid Payment Information';
          errorMessage = serverMessage || 'Please check your payment details and try again.';
        } else if (status === 401) {
          errorTitle = 'Authentication Required';
          errorMessage = 'Please log in again to process payments.';
        } else if (serverMessage) {
          errorMessage = serverMessage;
        }
      } else if (error.request) {
        errorTitle = 'Network Error';
        errorMessage = 'Unable to connect to payment service. Please check your internet connection.';
      }
      
      showToastError(errorTitle, errorMessage, {
        duration: 8000,
        actions: [
          {
            label: 'Retry',
            handler: () => onSubmit(variables),
            variant: 'primary' as const
          }
        ]
      });
      
      handleTransactionError(error, {
        id: Date.now().toString(),
        amount: variables.amount,
        recipient: variables.recipient
      });
    }
  });

  // Keyboard navigation
  useKeyboardNavigation({
    onEscape: () => {
      if (showPaymentModal) {
        setShowPaymentModal(false);
        restoreFocus();
      }
      if (showTransactionDetail) {
        setShowTransactionDetail(false);
        setSelectedTransaction(null);
      }
    },
    onEnter: (event: any) => {
      if (event.target.classList.contains('quick-action-btn')) {
        event.target.click();
      }
    },
    onR: () => {
      if (!showPaymentModal && !showTransactionDetail) {
        handleRefresh();
      }
    }
  });

  // Format currency
  const formatCurrency = useCallback((amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }, []);

  // Format date
  const formatDate = useCallback((dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  // Get transaction icon
  const getTransactionIcon = useCallback((type: string, category?: string) => {
    if (type === 'credit') {
      return <ArrowDownIcon className="h-5 w-5 text-success-500" />;
    }
    return <ArrowUpIcon className="h-5 w-5 text-error-500" />;
  }, []);

  // Get status icon
  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4 text-success-500" />;
      case 'pending':
        return <ClockIcon className="h-4 w-4 text-warning-500" />;
      case 'failed':
        return <XCircleIcon className="h-4 w-4 text-error-500" />;
      case 'processing':
        return <ArrowPathIcon className="h-4 w-4 text-info-500 animate-spin" />;
      default:
        return <ExclamationTriangleIcon className="h-4 w-4 text-neutral-500" />;
    }
  }, []);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const matchesFilter = transactionFilter === 'all' || transaction.type === transactionFilter || 
                           (transactionFilter === 'pending' && transaction.status === 'pending');
      const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           transaction.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           transaction.category.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [transactions, transactionFilter, searchTerm]);

  // Quick actions
  const quickActions: QuickAction[] = useMemo(() => [
    {
      id: 'send-money',
      label: 'Send Money',
      icon: PaperAirplaneIcon,
      action: () => setShowPaymentModal(true),
      color: 'bg-primary-500 hover:bg-primary-600',
      description: 'Send money to anyone'
    },
    {
      id: 'request-money',
      label: 'Request',
      icon: ArrowDownIcon,
      action: () => navigate('/payments/request'),
      color: 'bg-success-500 hover:bg-success-600',
      description: 'Request money from others'
    },
    {
      id: 'pay-bills',
      label: 'Pay Bills',
      icon: CreditCardIcon,
      action: () => navigate('/payments/bills'),
      color: 'bg-warning-500 hover:bg-warning-600',
      description: 'Pay your bills'
    },
    {
      id: 'split-bill',
      label: 'Split Bill',
      icon: UserGroupIcon,
      action: () => navigate('/payments/split'),
      color: 'bg-info-500 hover:bg-info-600',
      description: 'Split expenses with friends'
    }
  ], [navigate]);

  // Financial insights
  const insights: Insight[] = useMemo(() => [
    {
      id: 'spending-trend',
      type: 'spending',
      title: 'Spending Trend',
      description: 'Your spending increased this month',
      value: '+12%',
      change: 12,
      icon: ArrowTrendingUpIcon,
      color: 'text-warning-500'
    },
    {
      id: 'savings-goal',
      type: 'saving',
      title: 'Savings Goal',
      description: 'You\'re 75% to your monthly goal',
      value: '75%',
      change: 5,
      icon: WalletIcon,
      color: 'text-success-500'
    },
    {
      id: 'budget-alert',
      type: 'budget',
      title: 'Budget Alert',
      description: 'Dining budget almost exceeded',
      value: '$45 left',
      change: -8,
      icon: ExclamationTriangleIcon,
      color: 'text-error-500'
    }
  ], []);

  // Handle tab change
  const handleTabChange = useCallback((tab: 'overview' | 'transactions' | 'analytics' | 'recipients') => {
    setActiveTab(tab);
    announce(`Switched to ${tab} tab`);
    
    setTimeout(() => {
      const tabContent = document.querySelector(`[data-tab="${tab}"]`);
      if (tabContent) {
        focusElement(tabContent);
      }
    }, 100);
  }, [announce, focusElement]);

  // Handle payment modal open
  const handlePaymentModalOpen = useCallback(() => {
    saveFocus();
    setShowPaymentModal(true);
    announce('Payment modal opened');
    
    setTimeout(() => {
      const firstInput = document.querySelector('#payment-modal input');
      if (firstInput) {
        focusElement(firstInput as HTMLElement);
      }
    }, 100);
  }, [saveFocus, announce, focusElement]);

  // Handle transaction detail
  const handleTransactionDetail = useCallback((transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionDetail(true);
    saveFocus();
  }, [saveFocus]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    announce('Refreshing account data');
    
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['accountData'] }),
        queryClient.invalidateQueries({ queryKey: ['transactions'] })
      ]);
      
      showToastSuccess('Data Refreshed', 'Your account data has been updated');
    } catch (error) {
      showToastError('Refresh Failed', 'Unable to refresh data. Please try again.');
    } finally {
      setRefreshing(false);
    }
  }, [queryClient, announce, showToastSuccess, showToastError]);

  // Form submission
  const onSubmit = useCallback(async (data: PaymentFormData) => {
    saveFocus();
    
    showToastInfo(
      'Processing Payment',
      'Your payment is being processed...',
      { 
        duration: 2000,
        persistent: false
      }
    );

    // Handle offline scenario
    if (!networkOnline) {
      await addToSyncQueue({
        type: 'payment',
        ...data,
        timestamp: new Date().toISOString()
      });
      
      showToastInfo(
        'Payment Queued',
        'Your payment will be processed when you\'re back online.',
        { duration: 4000 }
      );
      
      reset();
      setShowPaymentModal(false);
      restoreFocus();
      return;
    }

    // Simulate payment processing steps
    setPaymentStep(1);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setPaymentStep(2);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setPaymentStep(3);
    
    // Execute payment mutation
    paymentMutation.mutate(data);
  }, [saveFocus, showToastInfo, networkOnline, addToSyncQueue, reset, restoreFocus, paymentMutation]);

  // Loading states
  if (accountLoading || transactionsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 flex items-center justify-center">
        <motion.div
          variants={getAnimationVariant(scaleIn, shouldReduceMotion)}
          initial="initial"
          animate="animate"
          className="card-glass p-8 text-center"
        >
          <AccountLoadingSkeleton />
          <p className="text-white/80 mt-4">Loading your account...</p>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (accountError || transactionsError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 flex items-center justify-center">
        <motion.div
          variants={getAnimationVariant(scaleIn, shouldReduceMotion)}
          initial="initial"
          animate="animate"
          className="card-glass p-8 text-center"
        >
          <ExclamationTriangleIcon className="h-12 w-12 text-error-500 mx-auto mb-4" />
          <h3 className="text-white text-xl font-semibold mb-2">Unable to Load Data</h3>
          <p className="text-white/60 mb-4">There was an error loading your account information.</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
      
      {/* Offline Indicator */}
      <CompactOfflineIndicator />
      
      <div className="relative z-10 p-4 md:p-6">
        {/* Header */}
        <motion.div
          variants={getAnimationVariant(fadeInUp, shouldReduceMotion)}
          initial="initial"
          animate="animate"
          className="mb-6 md:mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Banking Dashboard</h1>
              <p className="text-white/80 mt-1">Welcome back, {user?.firstName || 'User'}</p>
            </div>
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <button
                onClick={handleRefresh}
                className={`p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors ${refreshing ? 'animate-spin' : ''}`}
                aria-label="Refresh data"
                disabled={refreshing}
              >
                <ArrowPathIcon className="h-4 w-4" />
              </button>
              <CalendarIcon className="h-4 w-4" />
              <span className="hidden sm:inline">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
              <span className="sm:hidden">
                {new Date().toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Navigation Tabs */}
        <motion.div
          variants={getAnimationVariant(fadeInUp, shouldReduceMotion)}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.1 }}
          className="mb-6 md:mb-8"
        >
          <div className="card-glass p-2 inline-flex rounded-lg w-full md:w-auto">
            {[
              { key: 'overview', label: 'Overview', icon: ChartPieIcon },
              { key: 'transactions', label: 'Transactions', icon: DocumentDuplicateIcon },
              { key: 'analytics', label: 'Analytics', icon: ChartBarIcon },
              { key: 'recipients', label: 'Recipients', icon: UserGroupIcon }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-white/20 text-white shadow-lg'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
                aria-pressed={activeTab === tab.key}
                aria-label={`${tab.label} tab`}
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              data-tab="overview"
              variants={getAnimationVariant(tabContent, shouldReduceMotion)}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-4 md:space-y-6"
              tabIndex={-1}
            >
              {/* Account Overview Cards */}
              <motion.div
                variants={getAnimationVariant(staggerContainer, shouldReduceMotion)}
                initial="initial"
                animate="animate"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
              >
                {/* Balance Card */}
                <motion.div
                  variants={getAnimationVariant(staggerItem, shouldReduceMotion)}
                  {...(shouldReduceMotion ? {} : hoverLift)}
                  className="card-glass p-4 md:p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white/80 text-sm font-medium">Total Balance</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setShowBalance(!showBalance);
                          announce(showBalance ? 'Balance hidden' : 'Balance shown');
                        }}
                        className="text-white/60 hover:text-white transition-colors p-1 rounded focus:outline-none focus:ring-2 focus:ring-white/50"
                        aria-label={showBalance ? 'Hide balance' : 'Show balance'}
                      >
                        {showBalance ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                      </button>
                      <WalletIcon className="h-4 w-4 text-white/60" />
                    </div>
                  </div>
                  <motion.div
                    variants={getAnimationVariant(balanceReveal, shouldReduceMotion)}
                    initial="initial"
                    animate="animate"
                    className="text-xl md:text-2xl font-bold text-white mb-2"
                  >
                    {showBalance ? formatCurrency(accountData?.balance || 0) : '••••••'}
                  </motion.div>
                  {accountData?.lastMonthChange !== undefined ? (
                    <div className={`flex items-center text-sm ${
                      accountData.lastMonthChange >= 0 ? 'text-success-400' : 'text-error-400'
                    }`}>
                      {accountData.lastMonthChange >= 0 ? (
                        <ArrowUpIcon className="h-4 w-4 mr-1" />
                      ) : (
                        <ArrowDownIcon className="h-4 w-4 mr-1" />
                      )}
                      {accountData.lastMonthChange >= 0 ? '+' : ''}{accountData.lastMonthChange.toFixed(1)}% from last month
                    </div>
                  ) : (
                    <div className="flex items-center text-sm text-gray-400">
                      <span>No change data available</span>
                    </div>
                  )}
                </motion.div>

                {/* Available Credit */}
                <motion.div
                  variants={getAnimationVariant(staggerItem, shouldReduceMotion)}
                  {...(shouldReduceMotion ? {} : hoverLift)}
                  className="card-glass p-4 md:p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white/80 text-sm font-medium">Available Credit</h3>
                    <CreditCardIcon className="h-5 w-5 text-white/60" />
                  </div>
                  <div className="text-xl md:text-2xl font-bold text-white mb-2">
                    {formatCurrency(accountData?.availableCredit || 0)}
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <motion.div 
                      className="bg-gradient-to-r from-primary-400 to-accent-400 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${((accountData?.availableCredit || 0) / (accountData?.creditLimit || 1)) * 100}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                    ></motion.div>
                  </div>
                  <div className="text-white/60 text-xs mt-1">
                    of {formatCurrency(accountData?.creditLimit || 0)} limit
                  </div>
                </motion.div>

                {/* Monthly Spending */}
                <motion.div
                  variants={getAnimationVariant(staggerItem, shouldReduceMotion)}
                  {...(shouldReduceMotion ? {} : hoverLift)}
                  className="card-glass p-4 md:p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white/80 text-sm font-medium">Monthly Spending</h3>
                    <ChartBarIcon className="h-5 w-5 text-white/60" />
                  </div>
                  <div className="text-xl md:text-2xl font-bold text-white mb-2">
                    {formatCurrency(accountData?.monthlySpending || 0)}
                  </div>
                  <div className={`flex items-center text-sm ${
                    (accountData?.spendingChange || 0) > 0 ? 'text-warning-500' : 'text-success-500'
                  }`}>
                    {(accountData?.spendingChange || 0) > 0 ? (
                      <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                    ) : (
                      <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                    )}
                    {(accountData?.spendingChange || 0) > 0 ? '+' : ''}{accountData?.spendingChange || 0}% vs last month
                  </div>
                </motion.div>

                {/* Interest Rate */}
                <motion.div
                  variants={getAnimationVariant(staggerItem, shouldReduceMotion)}
                  {...(shouldReduceMotion ? {} : hoverLift)}
                  className="card-glass p-4 md:p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white/80 text-sm font-medium">Interest Rate</h3>
                    <SparklesIcon className="h-5 w-5 text-white/60" />
                  </div>
                  <div className="text-xl md:text-2xl font-bold text-white mb-2">
                    {accountData?.interestRate || 0}%
                  </div>
                  <div className="text-success-400 text-sm">
                    APY
                  </div>
                </motion.div>
              </motion.div>

              {/* Quick Actions */}
              <motion.div
                variants={getAnimationVariant(fadeInUp, shouldReduceMotion)}
                initial="initial"
                animate="animate"
                transition={{ delay: 0.4 }}
                className="card-glass p-4 md:p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white text-lg font-semibold">Quick Actions</h3>
                  <button
                    onClick={() => setShowInsights(!showInsights)}
                    className="text-white/60 hover:text-white transition-colors p-1 rounded"
                    aria-label={showInsights ? 'Hide insights' : 'Show insights'}
                  >
                    <SparklesIcon className="h-5 w-5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  {quickActions.map((action) => (
                    <motion.button
                      key={action.id}
                      onClick={action.action}
                      {...(shouldReduceMotion ? {} : hoverScale)}
                      className={`quick-action-btn flex flex-col items-center p-3 md:p-4 rounded-lg ${action.color} transition-colors group focus:outline-none focus:ring-2 focus:ring-white/50`}
                      aria-label={action.description}
                      title={action.description}
                    >
                      <action.icon className="h-5 md:h-6 w-5 md:w-6 text-white mb-2" />
                      <span className="text-white text-xs md:text-sm font-medium">{action.label}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Financial Insights */}
              {showInsights && (
                <motion.div
                  variants={getAnimationVariant(fadeInUp, shouldReduceMotion)}
                  initial="initial"
                  animate="animate"
                  transition={{ delay: 0.5 }}
                  className="card-glass p-4 md:p-6"
                >
                  <h3 className="text-white text-lg font-semibold mb-4">Financial Insights</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {insights.map((insight) => (
                      <motion.div
                        key={insight.id}
                        variants={getAnimationVariant(staggerItem, shouldReduceMotion)}
                        className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        <div className={`p-2 rounded-lg ${insight.change > 0 ? 'bg-success-500/20' : insight.change < 0 ? 'bg-error-500/20' : 'bg-warning-500/20'}`}>
                          <insight.icon className={`h-5 w-5 ${insight.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-medium text-sm">{insight.title}</h4>
                          <p className="text-white/60 text-xs mt-1">{insight.description}</p>
                          <p className={`text-sm font-semibold mt-1 ${insight.color}`}>
                            {insight.value}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Recent Transactions Preview */}
              <TransactionErrorBoundary>
                <motion.div
                  variants={getAnimationVariant(fadeInUp, shouldReduceMotion)}
                  initial="initial"
                  animate="animate"
                  transition={{ delay: 0.6 }}
                  className="card-glass p-4 md:p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white text-lg font-semibold">Recent Transactions</h3>
                    <button
                      onClick={() => handleTabChange('transactions')}
                      className="text-primary-300 hover:text-primary-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/50 rounded px-2 py-1"
                    >
                      View All
                    </button>
                  </div>
                  <div className="space-y-3">
                    {filteredTransactions.slice(0, 5).map((transaction, index) => (
                      <motion.div 
                        key={transaction.id}
                        variants={getAnimationVariant(transactionSlideIn, shouldReduceMotion)}
                        initial="initial"
                        animate="animate"
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                        onClick={() => handleTransactionDetail(transaction)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && handleTransactionDetail(transaction)}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {getTransactionIcon(transaction.type, transaction.category)}
                          <div className="min-w-0 flex-1">
                            <p className="text-white font-medium truncate">{transaction.description}</p>
                            <p className="text-white/60 text-sm truncate">{transaction.recipient}</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`font-semibold ${transaction.type === 'credit' ? 'text-success-400' : 'text-white'}`}>
                            {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                          </p>
                          <p className="text-white/60 text-xs">{formatDate(transaction.date)}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </TransactionErrorBoundary>
            </motion.div>
          )}

          {activeTab === 'transactions' && (
            <motion.div
              key="transactions"
              data-tab="transactions"
              variants={getAnimationVariant(tabContent, shouldReduceMotion)}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-4 md:space-y-6"
              tabIndex={-1}
            >
              {/* Transaction Filters */}
              <motion.div
                variants={getAnimationVariant(fadeInUp, shouldReduceMotion)}
                initial="initial"
                animate="animate"
                className="card-glass p-4 md:p-6"
              >
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60" />
                      <input
                        type="text"
                        placeholder="Search transactions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 md:py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                        aria-label="Search transactions"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={transactionFilter}
                      onChange={(e) => setTransactionFilter(e.target.value as any)}
                      className="px-4 py-2 md:py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                      aria-label="Filter transactions"
                    >
                      <option value="all">All</option>
                      <option value="credit">Credits</option>
                      <option value="debit">Debits</option>
                      <option value="pending">Pending</option>
                    </select>
                    <select
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value as any)}
                      className="px-4 py-2 md:py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                      aria-label="Date range"
                    >
                      <option value="7d">Last 7 days</option>
                      <option value="30d">Last 30 days</option>
                      <option value="90d">Last 90 days</option>
                      <option value="1y">Last year</option>
                    </select>
                  </div>
                </div>
              </motion.div>

              {/* Transaction List */}
              <TransactionErrorBoundary>
                <motion.div
                  variants={getAnimationVariant(fadeInUp, shouldReduceMotion)}
                  initial="initial"
                  animate="animate"
                  transition={{ delay: 0.1 }}
                  className="card-glass p-4 md:p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white text-lg font-semibold">Transaction History</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowInsights(!showInsights)}
                        className="text-white/60 hover:text-white transition-colors p-1 rounded"
                        aria-label={showInsights ? 'Hide insights' : 'Show insights'}
                      >
                        <FunnelIcon className="h-5 w-5" />
                      </button>
                      <span className="text-white/60 text-sm">
                        {filteredTransactions.length} transactions
                      </span>
                    </div>
                  </div>
                  {filteredTransactions.length === 0 ? (
                    <div className="text-center py-8">
                      <DocumentDuplicateIcon className="h-12 w-12 text-white/40 mx-auto mb-4" />
                      <p className="text-white/60">No transactions found matching your criteria.</p>
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setTransactionFilter('all');
                        }}
                        className="mt-2 text-primary-300 hover:text-primary-200 text-sm"
                      >
                        Clear filters
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredTransactions.map((transaction, index) => (
                        <motion.div
                          key={transaction.id}
                          variants={getAnimationVariant(transactionSlideIn, shouldReduceMotion)}
                          initial="initial"
                          animate="animate"
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center justify-between p-3 md:p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                          onClick={() => handleTransactionDetail(transaction)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && handleTransactionDetail(transaction)}
                        >
                          <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                            {getTransactionIcon(transaction.type, transaction.category)}
                            <div className="min-w-0 flex-1">
                              <p className="text-white font-medium truncate">{transaction.description}</p>
                              <div className="flex items-center gap-2 text-white/60 text-sm">
                                <span className="truncate">{transaction.recipient}</span>
                                <span className="hidden sm:inline">•</span>
                                <span className="hidden sm:inline">{transaction.category}</span>
                                {getStatusIcon(transaction.status)}
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className={`font-semibold ${transaction.type === 'credit' ? 'text-success-400' : 'text-white'}`}>
                              {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                            </p>
                            <p className="text-white/60 text-sm">{formatDate(transaction.date)}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </TransactionErrorBoundary>
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              data-tab="analytics"
              variants={getAnimationVariant(tabContent, shouldReduceMotion)}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-4 md:space-y-6"
              tabIndex={-1}
            >
              <div className="text-center py-12">
                <ChartBarIcon className="h-16 w-16 text-white/40 mx-auto mb-4" />
                <h3 className="text-white text-xl font-semibold mb-2">Analytics Coming Soon</h3>
                <p className="text-white/60">Advanced analytics and insights will be available here.</p>
              </div>
            </motion.div>
          )}

          {activeTab === 'recipients' && (
            <motion.div
              key="recipients"
              data-tab="recipients"
              variants={getAnimationVariant(tabContent, shouldReduceMotion)}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-4 md:space-y-6"
              tabIndex={-1}
            >
              <div className="text-center py-12">
                <UserGroupIcon className="h-16 w-16 text-white/40 mx-auto mb-4" />
                <h3 className="text-white text-xl font-semibold mb-2">Recipients Coming Soon</h3>
                <p className="text-white/60">Manage your saved recipients and contacts here.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Action Button */}
      <motion.button
        variants={getAnimationVariant(scaleIn, shouldReduceMotion)}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
        onClick={handlePaymentModalOpen}
        className="fixed bottom-4 right-4 md:bottom-6 md:right-6 w-12 h-12 md:w-14 md:h-14 bg-primary-500 hover:bg-primary-600 rounded-full shadow-lg flex items-center justify-center text-white transition-colors z-40 focus:outline-none focus:ring-2 focus:ring-white/50"
        aria-label="Send payment"
      >
        <PlusIcon className="h-5 w-5 md:h-6 md:w-6" />
      </motion.button>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div
            variants={getAnimationVariant(modalBackdrop, shouldReduceMotion)}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => {
              setShowPaymentModal(false);
              restoreFocus();
            }}
          >
            <PaymentErrorBoundary>
              <motion.div
                id="payment-modal"
                variants={getAnimationVariant(
                  isMobile ? mobileModalContent : modalContent, 
                  shouldReduceMotion
                )}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className={`card-glass p-4 md:p-6 w-full ${
                  isMobile ? 'max-w-sm' : 'max-w-md'
                } max-h-[90vh] overflow-y-auto`}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="payment-modal-title"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 id="payment-modal-title" className="text-xl font-semibold text-white">
                    Send Payment
                  </h3>
                  <button
                    onClick={() => {
                      setShowPaymentModal(false);
                      restoreFocus();
                    }}
                    className="text-white/60 hover:text-white transition-colors p-1 rounded focus:outline-none focus:ring-2 focus:ring-white/50"
                    aria-label="Close payment modal"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {paymentMutation.isPending ? (
                  <PaymentProcessingAnimation step={paymentStep} />
                ) : (
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">
                        Recipient
                      </label>
                      <input
                        type="text"
                        {...register('recipient')}
                        placeholder="Enter recipient name or email"
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                        aria-describedby={errors.recipient ? 'recipient-error' : undefined}
                      />
                      {errors.recipient && (
                        <p id="recipient-error" className="text-error-400 text-sm mt-1" role="alert">
                          {errors.recipient.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">
                        Amount
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          {...register('amount')}
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                          aria-describedby={errors.amount ? 'amount-error' : undefined}
                        />
                        <select
                          {...register('currency')}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-transparent text-white/80 text-sm focus:outline-none"
                          aria-label="Currency"
                        >
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                          <option value="CAD">CAD</option>
                          <option value="AUD">AUD</option>
                        </select>
                      </div>
                      {errors.amount && (
                        <p id="amount-error" className="text-error-400 text-sm mt-1" role="alert">
                          {errors.amount.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">
                        Payment Method
                      </label>
                      <select
                        {...register('paymentMethod')}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                        aria-label="Payment method"
                      >
                        <option value="balance">Account Balance</option>
                        <option value="credit">Credit Card</option>
                        <option value="bank">Bank Transfer</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">
                        Description (Optional)
                      </label>
                      <input
                        type="text"
                        {...register('description')}
                        placeholder="What's this payment for?"
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                      />
                      {errors.description && (
                        <p id="description-error" className="text-error-400 text-sm mt-1" role="alert">
                          {errors.description.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          {...register('saveRecipient')}
                          className="w-4 h-4 text-primary-600 bg-white/10 border-white/30 rounded focus:ring-primary-500"
                        />
                        <span className="text-white/80 text-sm">Save recipient for future payments</span>
                      </label>
                      
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          {...register('schedulePayment')}
                          className="w-4 h-4 text-primary-600 bg-white/10 border-white/30 rounded focus:ring-primary-500"
                        />
                        <span className="text-white/80 text-sm">Schedule this payment</span>
                      </label>
                    </div>

                    {watchSchedulePayment && (
                      <div>
                        <label className="block text-white/80 text-sm font-medium mb-2">
                          Schedule Date
                        </label>
                        <input
                          type="date"
                          {...register('scheduledDate')}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                          aria-describedby={errors.scheduledDate ? 'scheduled-date-error' : undefined}
                        />
                        {errors.scheduledDate && (
                          <p id="scheduled-date-error" className="text-error-400 text-sm mt-1" role="alert">
                            {errors.scheduledDate.message}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowPaymentModal(false);
                          restoreFocus();
                        }}
                        className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
                      >
                        Cancel
                      </button>
                      <LoadingButton
                        type="submit"
                        loading={paymentMutation.isPending}
                        loadingText="Processing..."
                        className="flex-1 px-4 py-3 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
                      >
                        <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                        Send Payment
                      </LoadingButton>
                    </div>
                  </form>
                )}
              </motion.div>
            </PaymentErrorBoundary>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transaction Detail Modal */}
      <AnimatePresence>
        {showTransactionDetail && selectedTransaction && (
          <motion.div
            variants={getAnimationVariant(modalBackdrop, shouldReduceMotion)}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => {
              setShowTransactionDetail(false);
              setSelectedTransaction(null);
              restoreFocus();
            }}
          >
            <motion.div
              variants={getAnimationVariant(
                isMobile ? mobileModalContent : modalContent, 
                shouldReduceMotion
              )}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className={`card-glass p-4 md:p-6 w-full ${
                isMobile ? 'max-w-sm' : 'max-w-md'
              } max-h-[90vh] overflow-y-auto`}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Transaction Details</h3>
                <button
                  onClick={() => {
                    setShowTransactionDetail(false);
                    setSelectedTransaction(null);
                    restoreFocus();
                  }}
                  className="text-white/60 hover:text-white transition-colors p-1 rounded focus:outline-none focus:ring-2 focus:ring-white/50"
                  aria-label="Close transaction details"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Amount</span>
                  <span className={`text-lg font-semibold ${
                    selectedTransaction.type === 'credit' ? 'text-success-400' : 'text-white'
                  }`}>
                    {selectedTransaction.type === 'credit' ? '+' : '-'}{formatCurrency(Math.abs(selectedTransaction.amount))}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Description</span>
                  <span className="text-white">{selectedTransaction.description}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Recipient</span>
                  <span className="text-white">{selectedTransaction.recipient}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Date</span>
                  <span className="text-white">{formatDate(selectedTransaction.date)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Status</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedTransaction.status)}
                    <span className="text-white capitalize">{selectedTransaction.status}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Category</span>
                  <span className="text-white">{selectedTransaction.category}</span>
                </div>
                
                {selectedTransaction.referenceNumber && (
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Reference</span>
                    <span className="text-white font-mono text-sm">{selectedTransaction.referenceNumber}</span>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 pt-6">
                <button
                  onClick={() => {
                    setShowTransactionDetail(false);
                    setSelectedTransaction(null);
                    restoreFocus();
                  }}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    // Copy transaction details to clipboard
                    navigator.clipboard.writeText(JSON.stringify(selectedTransaction, null, 2));
                    showToastSuccess('Copied', 'Transaction details copied to clipboard');
                  }}
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  <DocumentDuplicateIcon className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Payments;