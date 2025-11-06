import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheckIcon,
  PaperAirplaneIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ArrowPathIcon,
  EyeIcon,
  DocumentDuplicateIcon,
  BanknotesIcon,
  UserGroupIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import api from '../api/axiosConfig';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { LoadingSpinner, TransactionListSkeleton } from './ui/LoadingStates';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Type definitions
interface EmployeeTransaction {
  id: string;
  userId?: string;
  username?: string;
  email?: string;
  description: string;
  recipient: string;
  amount: number;
  currency: string;
  date: string;
  status: 'pending' | 'completed' | 'failed' | 'submitted_to_swift';
  transactionId: string;
  swiftCode?: string;
  submittedBy?: string;
  submittedAt?: string;
}

interface SWIFTSubmissionForm {
  swiftCode: string;
}

// SWIFT code validation schema
const swiftSchema = z.object({
  swiftCode: z.string()
    .min(8, 'SWIFT code must be at least 8 characters')
    .max(11, 'SWIFT code must be at most 11 characters')
    .regex(/^[A-Z0-9]{8}([A-Z0-9]{3})?$/, 'SWIFT/BIC code must be 8 or 11 alphanumeric characters (uppercase)')
});

const EmployeePortal: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'submitted_to_swift' | 'failed'>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<EmployeeTransaction | null>(null);
  const [showSWIFTModal, setShowSWIFTModal] = useState(false);
  const [submittingTransactionId, setSubmittingTransactionId] = useState<string | null>(null);

  const { user } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();
  const queryClient = useQueryClient();

  // Form for SWIFT submission
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue
  } = useForm<SWIFTSubmissionForm>({
    resolver: zodResolver(swiftSchema),
    defaultValues: {
      swiftCode: ''
    }
  });

  // Fetch all transactions (employee-only endpoint)
  const { data: transactions = [], isLoading, error, refetch } = useQuery<EmployeeTransaction[]>({
    queryKey: ['employeeTransactions'],
    queryFn: async () => {
      const response = await api.get('/api/payments/all-transactions');
      return response.data;
    },
    enabled: !!user && user.role === 'employee',
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Handle errors
  React.useEffect(() => {
    if (error) {
      const err: any = error;
      if (err.response?.status === 403) {
        showError('Access Denied', 'You do not have permission to access the employee portal.');
      } else {
        showError('Error', 'Failed to load transactions. Please try again.');
      }
    }
  }, [error, showError]);

  // SWIFT submission mutation
  const submitSWIFTMutation = useMutation({
    mutationFn: async ({ transactionId, swiftCode }: { transactionId: string; swiftCode: string }) => {
      const response = await api.post('/api/payments/submit-to-swift', {
        transactionId,
        swiftCode: swiftCode.toUpperCase() // Ensure uppercase
      });
      return response.data;
    },
    onSuccess: (data) => {
      showSuccess('Success', 'Transaction submitted to SWIFT successfully!');
      queryClient.invalidateQueries({ queryKey: ['employeeTransactions'] });
      setShowSWIFTModal(false);
      reset();
      setSelectedTransaction(null);
      setSubmittingTransactionId(null);
    },
    onError: (error: any) => {
      if (error.response?.status === 403) {
        showError('Access Denied', 'You do not have permission to submit transactions to SWIFT.');
      } else if (error.response?.status === 400) {
        showError('Validation Error', error.response.data.msg || 'Invalid SWIFT code or transaction data.');
      } else if (error.response?.status === 404) {
        showError('Not Found', 'Transaction not found.');
      } else {
        showError('Error', error.response?.data?.msg || 'Failed to submit transaction to SWIFT. Please try again.');
      }
      setSubmittingTransactionId(null);
    }
  });

  // Handle SWIFT submission
  const onSubmitSWIFT = useCallback((data: SWIFTSubmissionForm) => {
    if (!selectedTransaction) return;
    
    setSubmittingTransactionId(selectedTransaction.transactionId);
    submitSWIFTMutation.mutate({
      transactionId: selectedTransaction.transactionId,
      swiftCode: data.swiftCode.toUpperCase()
    });
  }, [selectedTransaction, submitSWIFTMutation]);

  // Open SWIFT submission modal
  const handleSubmitToSWIFT = useCallback((transaction: EmployeeTransaction) => {
    if (transaction.status === 'submitted_to_swift') {
      showInfo('Already Submitted', 'This transaction has already been submitted to SWIFT.');
      return;
    }
    
    setSelectedTransaction(transaction);
    setValue('swiftCode', transaction.swiftCode || '');
    setShowSWIFTModal(true);
  }, [setValue, showInfo]);

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { icon: ClockIcon, color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'Pending' },
      completed: { icon: CheckCircleIcon, color: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'Completed' },
      submitted_to_swift: { icon: PaperAirplaneIcon, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'Submitted to SWIFT' },
      failed: { icon: XCircleIcon, color: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Failed' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        <Icon className="w-3.5 h-3.5" />
        {config.label}
      </span>
    );
  };

  // Check if user is employee
  if (user?.role !== 'employee') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full border border-gray-700/50">
          <div className="flex flex-col items-center text-center">
            <ShieldCheckIcon className="w-16 h-16 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
            <p className="text-gray-400 mb-6">
              You do not have permission to access the employee portal. Employee role required.
            </p>
            <button
              onClick={() => window.location.href = '/payments'}
              className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
            >
              Go to User Portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <ShieldCheckIcon className="w-8 h-8 text-primary-400" />
                Employee Portal
              </h1>
              <p className="text-gray-400">Manage and submit transactions to SWIFT</p>
            </div>
            <button
              onClick={() => refetch()}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 mb-6 border border-gray-700/50"
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions, recipients, or users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <FunnelIcon className="w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="submitted_to_swift">Submitted to SWIFT</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Transactions List */}
        {isLoading ? (
          <TransactionListSkeleton />
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
            <ExclamationTriangleIcon className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-400">Failed to load transactions. Please try again.</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-12 text-center border border-gray-700/50">
            <BanknotesIcon className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No transactions found</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {filteredTransactions.map((transaction, index) => (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  {/* Transaction Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1">
                          {transaction.description || `Payment to ${transaction.recipient}`}
                        </h3>
                        <p className="text-sm text-gray-400">
                          Recipient: <span className="text-gray-300">{transaction.recipient}</span>
                        </p>
                        {transaction.username && (
                          <p className="text-sm text-gray-400">
                            User: <span className="text-gray-300">{transaction.username} ({transaction.email})</span>
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-white mb-1">
                          {formatCurrency(transaction.amount, transaction.currency)}
                        </p>
                        <p className="text-xs text-gray-400">{formatDate(transaction.date)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-3">
                      {getStatusBadge(transaction.status)}
                      <span className="text-xs text-gray-500 font-mono">
                        ID: {transaction.transactionId}
                      </span>
                      {transaction.swiftCode && (
                        <span className="text-xs text-gray-500 font-mono">
                          SWIFT: {transaction.swiftCode}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {transaction.status === 'pending' || transaction.status === 'completed' ? (
                      <button
                        onClick={() => handleSubmitToSWIFT(transaction)}
                        disabled={submittingTransactionId === transaction.transactionId}
                        className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <PaperAirplaneIcon className="w-5 h-5" />
                        {submittingTransactionId === transaction.transactionId ? 'Submitting...' : 'Submit to SWIFT'}
                      </button>
                    ) : transaction.status === 'submitted_to_swift' ? (
                      <div className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg flex items-center gap-2">
                        <CheckCircleIcon className="w-5 h-5" />
                        Submitted
                      </div>
                    ) : null}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* SWIFT Submission Modal */}
        <AnimatePresence>
          {showSWIFTModal && selectedTransaction && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => !isSubmitting && setShowSWIFTModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gray-800 rounded-2xl p-6 max-w-md w-full border border-gray-700"
              >
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <PaperAirplaneIcon className="w-6 h-6 text-primary-400" />
                  Submit to SWIFT
                </h2>
                
                <div className="mb-6">
                  <p className="text-gray-400 mb-2">Transaction Details:</p>
                  <div className="bg-gray-700/50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Amount:</span>
                      <span className="text-white font-semibold">
                        {formatCurrency(selectedTransaction.amount, selectedTransaction.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Recipient:</span>
                      <span className="text-white">{selectedTransaction.recipient}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Transaction ID:</span>
                      <span className="text-white font-mono text-sm">{selectedTransaction.transactionId}</span>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit(onSubmitSWIFT)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      SWIFT/BIC Code <span className="text-red-400">*</span>
                    </label>
                    <input
                      {...register('swiftCode')}
                      type="text"
                      placeholder="ABCDEFGH or ABCDEFGH123"
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 uppercase"
                      maxLength={11}
                      disabled={isSubmitting}
                    />
                    {errors.swiftCode && (
                      <p className="mt-1 text-sm text-red-400">{errors.swiftCode.message}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Enter 8 or 11 alphanumeric characters (uppercase)
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowSWIFTModal(false);
                        reset();
                        setSelectedTransaction(null);
                      }}
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <LoadingSpinner size="sm" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <PaperAirplaneIcon className="w-5 h-5" />
                          Submit to SWIFT
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default EmployeePortal;

