import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { Notification } from '../components/NotificationCenter';
import { useAuth } from './AuthContext';
import { useOfflineData } from '../hooks/useServiceWorker';
import { v4 as uuidv4 } from 'uuid';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}

interface NotificationAction {
  type: 
    | 'SET_NOTIFICATIONS'
    | 'ADD_NOTIFICATION'
    | 'UPDATE_NOTIFICATION'
    | 'REMOVE_NOTIFICATION'
    | 'MARK_AS_READ'
    | 'MARK_ALL_AS_READ'
    | 'CLEAR_ALL'
    | 'SET_LOADING'
    | 'SET_ERROR';
  payload?: any;
}

interface NotificationContextType extends NotificationState {
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  updateNotification: (id: string, updates: Partial<Notification>) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  clearCategory: (category: Notification['category']) => void;
  clearByPriority: (priority: Notification['priority']) => void;
  syncWithServer: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Initial state
const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null
};

// Reducer function
const notificationReducer = (state: NotificationState, action: NotificationAction): NotificationState => {
  switch (action.type) {
    case 'SET_NOTIFICATIONS':
      return {
        ...state,
        notifications: action.payload,
        unreadCount: action.payload.filter((n: Notification) => !n.read).length,
        isLoading: false,
        error: null
      };

    case 'ADD_NOTIFICATION':
      const newNotification = action.payload;
      const updatedNotifications = [newNotification, ...state.notifications];
      return {
        ...state,
        notifications: updatedNotifications,
        unreadCount: state.unreadCount + (newNotification.read ? 0 : 1)
      };

    case 'UPDATE_NOTIFICATION':
      const { id, updates } = action.payload;
      const updatedNotificationsList = state.notifications.map(notification =>
        notification.id === id ? { ...notification, ...updates } : notification
      );
      return {
        ...state,
        notifications: updatedNotificationsList,
        unreadCount: updatedNotificationsList.filter(n => !n.read).length
      };

    case 'REMOVE_NOTIFICATION':
      const remainingNotifications = state.notifications.filter(n => n.id !== action.payload);
      return {
        ...state,
        notifications: remainingNotifications,
        unreadCount: remainingNotifications.filter(n => !n.read).length
      };

    case 'MARK_AS_READ':
      const markedNotifications = state.notifications.map(notification =>
        notification.id === action.payload ? { ...notification, read: true } : notification
      );
      return {
        ...state,
        notifications: markedNotifications,
        unreadCount: markedNotifications.filter(n => !n.read).length
      };

    case 'MARK_ALL_AS_READ':
      const allReadNotifications = state.notifications.map(notification => ({ ...notification, read: true }));
      return {
        ...state,
        notifications: allReadNotifications,
        unreadCount: 0
      };

    case 'CLEAR_ALL':
      return {
        ...state,
        notifications: [],
        unreadCount: 0
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
        error: null
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };

    default:
      return state;
  }
};

// Notification provider component
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const { user, isAuthenticated } = useAuth();
  const { cacheData: cacheOfflineData, getCachedData: getOfflineData } = useOfflineData();

  // Load notifications from offline storage on mount
  useEffect(() => {
    const loadOfflineNotifications = async () => {
      try {
        const offlineNotifications = await getOfflineData('notifications');
        if (offlineNotifications && Array.isArray(offlineNotifications)) {
          // Convert timestamp strings back to Date objects
          const notificationsWithDates = offlineNotifications.map(n => ({
            ...n,
            timestamp: new Date(n.timestamp)
          }));
          dispatch({ type: 'SET_NOTIFICATIONS', payload: notificationsWithDates });
        }
      } catch (error) {
        console.error('Failed to load offline notifications:', error);
      }
    };

    loadOfflineNotifications();
  }, [getOfflineData]);

  // Fetch notifications from server
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      
      // Convert timestamp strings to Date objects
      const notificationsWithDates = data.notifications.map((n: any) => ({
        ...n,
        timestamp: new Date(n.timestamp)
      }));

      dispatch({ type: 'SET_NOTIFICATIONS', payload: notificationsWithDates });
      
      // Cache notifications for offline use
      await cacheOfflineData('notifications', notificationsWithDates);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load notifications' });
    }
  }, [isAuthenticated, user, cacheOfflineData]);

  // Add notification
  const addNotification = useCallback((notificationData: Omit<Notification, 'id' | 'timestamp'>) => {
    const notification: Notification = {
      ...notificationData,
      id: uuidv4(),
      timestamp: new Date()
    };

    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
    
    // Cache updated notifications for offline use
    cacheOfflineData('notifications', [notification, ...state.notifications]);
  }, [state.notifications, cacheOfflineData]);

  // Update notification
  const updateNotification = useCallback((id: string, updates: Partial<Notification>) => {
    dispatch({ type: 'UPDATE_NOTIFICATION', payload: { id, updates } });
    
    // Update cached notifications
    const updatedNotifications = state.notifications.map(n =>
      n.id === id ? { ...n, ...updates } : n
    );
    cacheOfflineData('notifications', updatedNotifications);
  }, [state.notifications, cacheOfflineData]);

  // Remove notification
  const removeNotification = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
    
    // Update cached notifications
    const remainingNotifications = state.notifications.filter(n => n.id !== id);
    cacheOfflineData('notifications', remainingNotifications);
  }, [state.notifications, cacheOfflineData]);

  // Mark notification as read
  const markAsRead = useCallback((id: string) => {
    dispatch({ type: 'MARK_AS_READ', payload: id });
    
    // Update cached notifications
    const updatedNotifications = state.notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    );
    cacheOfflineData('notifications', updatedNotifications);
  }, [state.notifications, cacheOfflineData]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    dispatch({ type: 'MARK_ALL_AS_READ' });
    
    // Update cached notifications
    const allReadNotifications = state.notifications.map(n => ({ ...n, read: true }));
    cacheOfflineData('notifications', allReadNotifications);
  }, [state.notifications, cacheOfflineData]);

  // Clear all notifications
  const clearAll = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL' });
    cacheOfflineData('notifications', []);
  }, [cacheOfflineData]);

  // Clear notifications by category
  const clearCategory = useCallback((category: Notification['category']) => {
    const remainingNotifications = state.notifications.filter(n => n.category !== category);
    dispatch({ type: 'SET_NOTIFICATIONS', payload: remainingNotifications });
    cacheOfflineData('notifications', remainingNotifications);
  }, [state.notifications, cacheOfflineData]);

  // Clear notifications by priority
  const clearByPriority = useCallback((priority: Notification['priority']) => {
    const remainingNotifications = state.notifications.filter(n => n.priority !== priority);
    dispatch({ type: 'SET_NOTIFICATIONS', payload: remainingNotifications });
    cacheOfflineData('notifications', remainingNotifications);
  }, [state.notifications, cacheOfflineData]);

  // Sync notifications with server
  const syncWithServer = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      // Send local notifications to server
      const localNotifications = state.notifications.filter(n => !n.persistent);
      
      if (localNotifications.length > 0) {
        const response = await fetch('/api/notifications/sync', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ notifications: localNotifications })
        });

        if (!response.ok) {
          throw new Error('Failed to sync notifications');
        }
      }

      // Fetch latest notifications from server
      await fetchNotifications();
    } catch (error) {
      console.error('Failed to sync notifications with server:', error);
    }
  }, [isAuthenticated, user, state.notifications, fetchNotifications]);

  // Fetch notifications on mount and when user changes
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchNotifications();
    }
  }, [isAuthenticated, user, fetchNotifications]);

  // Periodically sync with server
  useEffect(() => {
    if (!isAuthenticated) return;

    const syncInterval = setInterval(() => {
      syncWithServer();
    }, 300000); // Sync every 5 minutes

    return () => clearInterval(syncInterval);
  }, [isAuthenticated, syncWithServer]);

  const contextValue: NotificationContextType = {
    ...state,
    addNotification,
    updateNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    clearCategory,
    clearByPriority,
    syncWithServer
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use notification context
export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;