import React, { createContext, useContext, useReducer } from 'react';

// Initial state
const initialState = {
  theme: localStorage.getItem('theme') || 'light',
  sidebarOpen: false,
  notifications: [],
  loading: {},
  modals: {},
  toasts: [],
};

// Action types
const UI_ACTIONS = {
  SET_THEME: 'SET_THEME',
  TOGGLE_SIDEBAR: 'TOGGLE_SIDEBAR',
  SET_SIDEBAR: 'SET_SIDEBAR',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  MARK_NOTIFICATION_READ: 'MARK_NOTIFICATION_READ',
  CLEAR_NOTIFICATIONS: 'CLEAR_NOTIFICATIONS',
  SET_LOADING: 'SET_LOADING',
  OPEN_MODAL: 'OPEN_MODAL',
  CLOSE_MODAL: 'CLOSE_MODAL',
  ADD_TOAST: 'ADD_TOAST',
  REMOVE_TOAST: 'REMOVE_TOAST',
};

// Reducer
const uiReducer = (state, action) => {
  switch (action.type) {
    case UI_ACTIONS.SET_THEME:
      localStorage.setItem('theme', action.payload);
      return {
        ...state,
        theme: action.payload,
      };
    case UI_ACTIONS.TOGGLE_SIDEBAR:
      return {
        ...state,
        sidebarOpen: !state.sidebarOpen,
      };
    case UI_ACTIONS.SET_SIDEBAR:
      return {
        ...state,
        sidebarOpen: action.payload,
      };
    case UI_ACTIONS.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
      };
    case UI_ACTIONS.REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
      };
    case UI_ACTIONS.MARK_NOTIFICATION_READ:
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === action.payload ? { ...n, isRead: true } : n
        ),
      };
    case UI_ACTIONS.CLEAR_NOTIFICATIONS:
      return {
        ...state,
        notifications: [],
      };
    case UI_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.key]: action.payload.value,
        },
      };
    case UI_ACTIONS.OPEN_MODAL:
      return {
        ...state,
        modals: {
          ...state.modals,
          [action.payload.key]: action.payload.props || {},
        },
      };
    case UI_ACTIONS.CLOSE_MODAL:
      return {
        ...state,
        modals: {
          ...state.modals,
          [action.payload]: undefined,
        },
      };
    case UI_ACTIONS.ADD_TOAST:
      return {
        ...state,
        toasts: [...state.toasts, action.payload],
      };
    case UI_ACTIONS.REMOVE_TOAST:
      return {
        ...state,
        toasts: state.toasts.filter(t => t.id !== action.payload),
      };
    default:
      return state;
  }
};

// Create context
const UIContext = createContext();

// Provider component
export const UIProvider = ({ children }) => {
  const [state, dispatch] = useReducer(uiReducer, initialState);

  // Actions
  const setTheme = (theme) => {
    dispatch({ type: UI_ACTIONS.SET_THEME, payload: theme });
  };

  const toggleSidebar = () => {
    dispatch({ type: UI_ACTIONS.TOGGLE_SIDEBAR });
  };

  const setSidebar = (isOpen) => {
    dispatch({ type: UI_ACTIONS.SET_SIDEBAR, payload: isOpen });
  };

  const addNotification = (notification) => {
    const id = Date.now().toString();
    dispatch({ 
      type: UI_ACTIONS.ADD_NOTIFICATION, 
      payload: { ...notification, id, isRead: false, timestamp: new Date() }
    });
    return id;
  };

  const removeNotification = (id) => {
    dispatch({ type: UI_ACTIONS.REMOVE_NOTIFICATION, payload: id });
  };

  const markNotificationRead = (id) => {
    dispatch({ type: UI_ACTIONS.MARK_NOTIFICATION_READ, payload: id });
  };

  const clearNotifications = () => {
    dispatch({ type: UI_ACTIONS.CLEAR_NOTIFICATIONS });
  };

  const setLoading = (key, value) => {
    dispatch({ type: UI_ACTIONS.SET_LOADING, payload: { key, value } });
  };

  const openModal = (key, props = {}) => {
    dispatch({ type: UI_ACTIONS.OPEN_MODAL, payload: { key, props } });
  };

  const closeModal = (key) => {
    dispatch({ type: UI_ACTIONS.CLOSE_MODAL, payload: key });
  };

  const addToast = (toast) => {
    const id = Date.now().toString();
    dispatch({ 
      type: UI_ACTIONS.ADD_TOAST, 
      payload: { ...toast, id }
    });
    
    // Auto remove toast after duration
    if (toast.duration !== 0) {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration || 5000);
    }
    
    return id;
  };

  const removeToast = (id) => {
    dispatch({ type: UI_ACTIONS.REMOVE_TOAST, payload: id });
  };

  const value = {
    ...state,
    setTheme,
    toggleSidebar,
    setSidebar,
    addNotification,
    removeNotification,
    markNotificationRead,
    clearNotifications,
    setLoading,
    openModal,
    closeModal,
    addToast,
    removeToast,
  };

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
};

// Custom hook
export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};

export { UI_ACTIONS };