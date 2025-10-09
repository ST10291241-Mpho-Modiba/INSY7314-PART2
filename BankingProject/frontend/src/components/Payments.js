import React, { useState, useEffect } from 'react';
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
  XMarkIcon
} from '@heroicons/react/24/outline';
import api from '../api/axiosConfig';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useNotifications } from '../contexts/NotificationContext';
import { useNotificationErrorHandler } from '../hooks/useNotificationErrorHandler';
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
import { useToast } from '../contexts/ToastContext';
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
  hoverScale
} from '../utils/animations';
import { PaymentErrorBoundary, TransactionErrorBoundary } from './ErrorBoundary';

const Payments = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showBalance, setShowBalance] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [accountData, setAccountData] = useState({
    balance: 0,
    availableCredit: 0,
    creditLimit: 1,
    monthlySpending: 0,
    spendingChange: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [transactionFilter, setTransactionFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentStep, setPaymentStep] = useState(1);
  
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
  
  // Toast notifications
  const { showSuccess: showToastSuccess, showError: showToastError, showInfo: showToastInfo } = useToast();
  
  // Accessibility and offline hooks
  const { announce, focusElement, shouldReduceMotion } = useAccessibility();
  const { saveFocus, restoreFocus } = useFocusRestore();
  const { isOnline, queueTransaction } = useOfflineStatus();
  
  // Responsive hooks
  const { isMobile, isTablet, isDesktop, screenSize } = useResponsive();
  const { modalSize, modalPosition } = useResponsiveModal();

  // Keyboard navigation
  useKeyboardNavigation({
    onEscape: () => {
      if (showPaymentModal) {
        setShowPaymentModal(false);
        restoreFocus();
      }
    },
    onEnter: (event) => {
      if (event.target.classList.contains('quick-action-btn')) {
        event.target.click();
      }
    }
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm({
    defaultValues: {
      amount: '',
      currency: 'USD',
      recipient: '',
      description: ''
    }
  });

  // Fetch real account data from API
  useEffect(() => {
    const fetchAccountData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch account data from API
        const accountResponse = await api.get('/api/payments/account');
        if (accountResponse.data) {
          setAccountData(accountResponse.data);
        }

        // Fetch transactions from API
        const transactionsResponse = await api.get('/api/payments/transactions');
        if (transactionsResponse.data) {
          setTransactions(transactionsResponse.data);
        }

        // Show welcome toast only if data was loaded
        if (accountResponse.data || transactionsResponse.data) {
          showToastSuccess(
            'Welcome Back!',
            'Your account data has been loaded successfully.',
            { duration: 4000 }
          );

          // Announce to screen readers
          announce('Account data loaded successfully');
        }
      } catch (error) {
        handleError(error, { context: 'fetchAccountData' });
        
        // Keep default values for accountData, just clear transactions
        setTransactions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAccountData();
  }, [handleError, showToastSuccess, announce]);

  // Form submission handler
  const onSubmit = async (data) => {
    try {
      // Save focus for restoration
      saveFocus();

      // Show processing toast
      showToastInfo(
        'Processing Payment',
        'Your payment is being processed...',
        { 
          duration: 2000,
          persistent: false
        }
      );

      // Handle offline scenario
      if (!isOnline) {
        await queueTransaction({
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
      
      // Make the API call and wait for response
      const response = await api.post('/api/payments/process', data);
      
      // Only show success if the API call was successful
      if (response.status === 201 && response.data) {
        // Show success toast
        showToastSuccess(
          'Payment Sent Successfully!',
          `${formatCurrency(data.amount)} has been sent to ${data.recipient}`,
          {
            duration: 6000,
            actions: [
              {
                label: 'View Receipt',
                handler: () => {
                  console.log('View receipt for payment:', data);
                },
                variant: 'primary'
              }
            ]
          }
        );
        
        // Announce success to screen readers
        announce(`Payment of ${formatCurrency(data.amount)} sent successfully to ${data.recipient}`);
        
        // Reset form and close modal
        reset();
        setTimeout(() => {
          setShowPaymentModal(false);
          restoreFocus();
        }, 2000);
        
        // Refresh transactions to show the new payment
        try {
          const transactionsResponse = await api.get('/api/payments/transactions');
          if (transactionsResponse.data) {
            setTransactions(transactionsResponse.data);
          }
        } catch (refreshError) {
          console.warn('Failed to refresh transactions:', refreshError);
        }
      } else {
        throw new Error('Payment processing failed - invalid response');
      }
    } catch (error) {
      console.error('Payment submission error:', error);
      
      // Reset payment step
      setPaymentStep(1);
      
      // Determine error message based on error type
      let errorMessage = 'Payment processing failed. Please try again.';
      let errorTitle = 'Payment Failed';
      
      if (error.response) {
        // Server responded with error status
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
        // Network error
        errorTitle = 'Network Error';
        errorMessage = 'Unable to connect to payment service. Please check your internet connection.';
      }
      
      // Show error toast
      showToastError(
        errorTitle,
        errorMessage,
        {
          duration: 8000,
          actions: [
            {
              label: 'Retry',
              handler: () => {
                handleSubmit(onSubmit)(data);
              },
              variant: 'primary'
            }
          ]
        }
      );
      
      // Also use the existing error handler for additional error reporting
      handleTransactionError(error, {
        id: Date.now().toString(),
        amount: data.amount,
        recipient: data.recipient
      });
    }
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type, category) => {
    if (type === 'credit') {
      return <ArrowDownIcon className="h-5 w-5 text-success-500" />;
    }
    return <ArrowUpIcon className="h-5 w-5 text-error-500" />;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4 text-success-500" />;
      case 'pending':
        return <ClockIcon className="h-4 w-4 text-warning-500" />;
      case 'failed':
        return <XCircleIcon className="h-4 w-4 text-error-500" />;
      default:
        return <ExclamationTriangleIcon className="h-4 w-4 text-neutral-500" />;
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesFilter = transactionFilter === 'all' || transaction.type === transactionFilter;
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.recipient.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    announce(`Switched to ${tab} tab`);
    
    // Focus management for keyboard users
    setTimeout(() => {
      const tabContent = document.querySelector(`[data-tab="${tab}"]`);
      if (tabContent) {
        focusElement(tabContent);
      }
    }, 100);
  };

  const handlePaymentModalOpen = () => {
    saveFocus();
    setShowPaymentModal(true);
    announce('Payment modal opened');
    
    // Focus first input after modal opens
    setTimeout(() => {
      const firstInput = document.querySelector('#payment-modal input');
      if (firstInput) {
        focusElement(firstInput);
      }
    }, 100);
  };

  if (isLoading) {
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
            <button
              onClick={() => handleTabChange('overview')}
              className={`flex-1 md:flex-none px-4 md:px-6 py-2 rounded-md font-medium transition-all ${
                activeTab === 'overview'
                  ? 'bg-white/20 text-white shadow-lg'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
              aria-pressed={activeTab === 'overview'}
              aria-label="Overview tab"
            >
              Overview
            </button>
            <button
              onClick={() => handleTabChange('transactions')}
              className={`flex-1 md:flex-none px-4 md:px-6 py-2 rounded-md font-medium transition-all ${
                activeTab === 'transactions'
                  ? 'bg-white/20 text-white shadow-lg'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
              aria-pressed={activeTab === 'transactions'}
              aria-label="Transactions tab"
            >
              Transactions
            </button>
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
              tabIndex="-1"
            >
              {/* Account Overview Cards */}
              <motion.div
                variants={getAnimationVariant(staggerContainer, shouldReduceMotion)}
                initial="initial"
                animate="animate"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
              >
                {/* Balance Card */}
                <motion.div
                  variants={getAnimationVariant(staggerItem, shouldReduceMotion)}
                  {...(shouldReduceMotion ? {} : hoverLift)}
                  className="card-glass p-4 md:p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white/80 text-sm font-medium">Total Balance</h3>
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
                  <div className="text-warning-400 text-sm">
                    {(accountData?.spendingChange || 0) > 0 ? '+' : ''}{accountData?.spendingChange || 0}% vs last month
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
                <h3 className="text-white text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  <motion.button
                    onClick={handlePaymentModalOpen}
                    {...(shouldReduceMotion ? {} : hoverScale)}
                    className="quick-action-btn flex flex-col items-center p-3 md:p-4 rounded-lg bg-white/10 hover:bg-white/20 transition-colors group focus:outline-none focus:ring-2 focus:ring-white/50"
                    aria-label="Send money"
                  >
                    <PaperAirplaneIcon className="h-5 md:h-6 w-5 md:w-6 text-white/80 group-hover:text-white mb-2" />
                    <span className="text-white/80 group-hover:text-white text-xs md:text-sm">Send Money</span>
                  </motion.button>
                  <motion.button 
                    {...(shouldReduceMotion ? {} : hoverScale)}
                    className="quick-action-btn flex flex-col items-center p-3 md:p-4 rounded-lg bg-white/10 hover:bg-white/20 transition-colors group focus:outline-none focus:ring-2 focus:ring-white/50"
                    aria-label="Request money"
                  >
                    <ArrowDownIcon className="h-5 md:h-6 w-5 md:w-6 text-white/80 group-hover:text-white mb-2" />
                    <span className="text-white/80 group-hover:text-white text-xs md:text-sm">Request</span>
                  </motion.button>
                  <motion.button 
                    {...(shouldReduceMotion ? {} : hoverScale)}
                    className="quick-action-btn flex flex-col items-center p-3 md:p-4 rounded-lg bg-white/10 hover:bg-white/20 transition-colors group focus:outline-none focus:ring-2 focus:ring-white/50"
                    aria-label="Pay bills"
                  >
                    <CreditCardIcon className="h-5 md:h-6 w-5 md:w-6 text-white/80 group-hover:text-white mb-2" />
                    <span className="text-white/80 group-hover:text-white text-xs md:text-sm">Pay Bills</span>
                  </motion.button>
                  <motion.button 
                    {...(shouldReduceMotion ? {} : hoverScale)}
                    className="quick-action-btn flex flex-col items-center p-3 md:p-4 rounded-lg bg-white/10 hover:bg-white/20 transition-colors group focus:outline-none focus:ring-2 focus:ring-white/50"
                    aria-label="View analytics"
                  >
                    <ChartBarIcon className="h-5 md:h-6 w-5 md:w-6 text-white/80 group-hover:text-white mb-2" />
                    <span className="text-white/80 group-hover:text-white text-xs md:text-sm">Analytics</span>
                  </motion.button>
                </div>
              </motion.div>

              {/* Recent Transactions Preview */}
              <TransactionErrorBoundary>
                <motion.div
                  variants={getAnimationVariant(fadeInUp, shouldReduceMotion)}
                  initial="initial"
                  animate="animate"
                  transition={{ delay: 0.5 }}
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
                    {transactions.slice(0, 3).map((transaction, index) => (
                      <motion.div 
                        key={transaction.id}
                        variants={getAnimationVariant(transactionSlideIn, shouldReduceMotion)}
                        initial="initial"
                        animate="animate"
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {getTransactionIcon(transaction.type)}
                          <div className="min-w-0 flex-1">
                            <p className="text-white font-medium truncate">{transaction.description}</p>
                            <p className="text-white/60 text-sm truncate">{transaction.recipient}</p>
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
              tabIndex="-1"
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
                  <select
                    value={transactionFilter}
                    onChange={(e) => setTransactionFilter(e.target.value)}
                    className="px-4 py-2 md:py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                    aria-label="Filter transactions"
                  >
                    <option value="all">All Transactions</option>
                    <option value="credit">Credits</option>
                    <option value="debit">Debits</option>
                  </select>
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
                  <h3 className="text-white text-lg font-semibold mb-4">Transaction History</h3>
                  {filteredTransactions.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-white/60">No transactions found matching your criteria.</p>
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
                          className="flex items-center justify-between p-3 md:p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
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

                {isSubmitting ? (
                  <PaymentProcessingAnimation step={paymentStep} />
                ) : (
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">
                      Recipient
                    </label>
                    <input
                      type="text"
                      {...register('recipient', {
                        required: 'Recipient is required',
                        minLength: { value: 2, message: 'Recipient name must be at least 2 characters' },
                        maxLength: { value: 100, message: 'Recipient name is too long' }
                      })}
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
                        {...register('amount', {
                          required: 'Amount is required',
                          min: { value: 0.01, message: 'Amount must be greater than 0' },
                          max: { value: accountData?.balance || 0, message: 'Insufficient funds' }
                        })}
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
                      Description (Optional)
                    </label>
                    <input
                      type="text"
                      {...register('description')}
                      placeholder="What's this payment for?"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                    />
                  </div>

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
                      loading={isSubmitting}
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
    </div>
  );
};

export default Payments;