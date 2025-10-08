import React, { createContext, useContext, useReducer } from 'react';

// Initial state
const initialState = {
  transactions: [],
  currentPayment: null,
  filters: {
    status: 'all',
    dateRange: 'all',
    amount: { min: '', max: '' },
    currency: 'all',
  },
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
  },
  loading: false,
  error: null,
};

// Action types
const PAYMENTS_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_TRANSACTIONS: 'SET_TRANSACTIONS',
  ADD_TRANSACTION: 'ADD_TRANSACTION',
  UPDATE_TRANSACTION: 'UPDATE_TRANSACTION',
  SET_CURRENT_PAYMENT: 'SET_CURRENT_PAYMENT',
  CLEAR_CURRENT_PAYMENT: 'CLEAR_CURRENT_PAYMENT',
  SET_FILTERS: 'SET_FILTERS',
  RESET_FILTERS: 'RESET_FILTERS',
  SET_PAGINATION: 'SET_PAGINATION',
};

// Reducer
const paymentsReducer = (state, action) => {
  switch (action.type) {
    case PAYMENTS_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };
    case PAYMENTS_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    case PAYMENTS_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
    case PAYMENTS_ACTIONS.SET_TRANSACTIONS:
      return {
        ...state,
        transactions: action.payload,
        loading: false,
        error: null,
      };
    case PAYMENTS_ACTIONS.ADD_TRANSACTION:
      return {
        ...state,
        transactions: [action.payload, ...state.transactions],
      };
    case PAYMENTS_ACTIONS.UPDATE_TRANSACTION:
      return {
        ...state,
        transactions: state.transactions.map(t =>
          t.id === action.payload.id ? { ...t, ...action.payload } : t
        ),
      };
    case PAYMENTS_ACTIONS.SET_CURRENT_PAYMENT:
      return {
        ...state,
        currentPayment: action.payload,
      };
    case PAYMENTS_ACTIONS.CLEAR_CURRENT_PAYMENT:
      return {
        ...state,
        currentPayment: null,
      };
    case PAYMENTS_ACTIONS.SET_FILTERS:
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
        pagination: { ...state.pagination, page: 1 }, // Reset to first page when filtering
      };
    case PAYMENTS_ACTIONS.RESET_FILTERS:
      return {
        ...state,
        filters: initialState.filters,
        pagination: { ...state.pagination, page: 1 },
      };
    case PAYMENTS_ACTIONS.SET_PAGINATION:
      return {
        ...state,
        pagination: { ...state.pagination, ...action.payload },
      };
    default:
      return state;
  }
};

// Create context
const PaymentsContext = createContext();

// Provider component
export const PaymentsProvider = ({ children }) => {
  const [state, dispatch] = useReducer(paymentsReducer, initialState);

  // Actions
  const setLoading = (loading) => {
    dispatch({ type: PAYMENTS_ACTIONS.SET_LOADING, payload: loading });
  };

  const setError = (error) => {
    dispatch({ type: PAYMENTS_ACTIONS.SET_ERROR, payload: error });
  };

  const clearError = () => {
    dispatch({ type: PAYMENTS_ACTIONS.CLEAR_ERROR });
  };

  const setTransactions = (transactions) => {
    dispatch({ type: PAYMENTS_ACTIONS.SET_TRANSACTIONS, payload: transactions });
  };

  const addTransaction = (transaction) => {
    dispatch({ type: PAYMENTS_ACTIONS.ADD_TRANSACTION, payload: transaction });
  };

  const updateTransaction = (transaction) => {
    dispatch({ type: PAYMENTS_ACTIONS.UPDATE_TRANSACTION, payload: transaction });
  };

  const setCurrentPayment = (payment) => {
    dispatch({ type: PAYMENTS_ACTIONS.SET_CURRENT_PAYMENT, payload: payment });
  };

  const clearCurrentPayment = () => {
    dispatch({ type: PAYMENTS_ACTIONS.CLEAR_CURRENT_PAYMENT });
  };

  const setFilters = (filters) => {
    dispatch({ type: PAYMENTS_ACTIONS.SET_FILTERS, payload: filters });
  };

  const resetFilters = () => {
    dispatch({ type: PAYMENTS_ACTIONS.RESET_FILTERS });
  };

  const setPagination = (pagination) => {
    dispatch({ type: PAYMENTS_ACTIONS.SET_PAGINATION, payload: pagination });
  };

  // Helper functions
  const getFilteredTransactions = () => {
    let filtered = [...state.transactions];

    // Filter by status
    if (state.filters.status !== 'all') {
      filtered = filtered.filter(t => t.status === state.filters.status);
    }

    // Filter by amount range
    if (state.filters.amount.min) {
      filtered = filtered.filter(t => parseFloat(t.amount) >= parseFloat(state.filters.amount.min));
    }
    if (state.filters.amount.max) {
      filtered = filtered.filter(t => parseFloat(t.amount) <= parseFloat(state.filters.amount.max));
    }

    // Filter by currency
    if (state.filters.currency !== 'all') {
      filtered = filtered.filter(t => t.currency === state.filters.currency);
    }

    // Filter by date range
    if (state.filters.dateRange !== 'all') {
      const now = new Date();
      let startDate;

      switch (state.filters.dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = null;
      }

      if (startDate) {
        filtered = filtered.filter(t => new Date(t.createdAt) >= startDate);
      }
    }

    return filtered;
  };

  const getPaginatedTransactions = () => {
    const filtered = getFilteredTransactions();
    const startIndex = (state.pagination.page - 1) * state.pagination.limit;
    const endIndex = startIndex + state.pagination.limit;
    
    return {
      transactions: filtered.slice(startIndex, endIndex),
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / state.pagination.limit),
    };
  };

  const value = {
    ...state,
    setLoading,
    setError,
    clearError,
    setTransactions,
    addTransaction,
    updateTransaction,
    setCurrentPayment,
    clearCurrentPayment,
    setFilters,
    resetFilters,
    setPagination,
    getFilteredTransactions,
    getPaginatedTransactions,
  };

  return (
    <PaymentsContext.Provider value={value}>
      {children}
    </PaymentsContext.Provider>
  );
};

// Custom hook
export const usePayments = () => {
  const context = useContext(PaymentsContext);
  if (!context) {
    throw new Error('usePayments must be used within a PaymentsProvider');
  }
  return context;
};

export { PAYMENTS_ACTIONS };