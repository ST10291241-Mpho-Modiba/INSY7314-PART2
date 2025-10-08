import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Initialize with empty notifications - real notifications will be added through API calls

  const addNotification = useCallback((notification) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newNotification = {
      id,
      type: 'info',
      timestamp: new Date(),
      read: false,
      category: 'general',
      ...notification
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
    
    return id;
  }, []);

  const markAsRead = useCallback((id) => {
    setNotifications(prev => prev.map(notification => {
      if (notification.id === id && !notification.read) {
        setUnreadCount(count => Math.max(0, count - 1));
        return { ...notification, read: true };
      }
      return notification;
    }));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(notification => ({ ...notification, read: true })));
    setUnreadCount(0);
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === id);
      if (notification && !notification.read) {
        setUnreadCount(count => Math.max(0, count - 1));
      }
      return prev.filter(n => n.id !== id);
    });
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const getNotificationsByType = useCallback((type) => {
    return notifications.filter(notification => notification.type === type);
  }, [notifications]);

  const getUnreadNotifications = useCallback(() => {
    return notifications.filter(notification => !notification.read);
  }, [notifications]);

  const getNotificationsByCategory = useCallback((category) => {
    return notifications.filter(notification => notification.category === category);
  }, [notifications]);

  // Convenience methods for different notification types
  const addPaymentNotification = useCallback((title, message, success = true) => {
    return addNotification({
      type: success ? 'success' : 'error',
      title,
      message,
      category: 'payment'
    });
  }, [addNotification]);

  const addAccountNotification = useCallback((title, message, type = 'info') => {
    return addNotification({
      type,
      title,
      message,
      category: 'account'
    });
  }, [addNotification]);

  const addSecurityNotification = useCallback((title, message, type = 'warning') => {
    return addNotification({
      type,
      title,
      message,
      category: 'security'
    });
  }, [addNotification]);

  const addAlertNotification = useCallback((title, message, type = 'warning') => {
    return addNotification({
      type,
      title,
      message,
      category: 'alert'
    });
  }, [addNotification]);

  const value = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    getNotificationsByType,
    getUnreadNotifications,
    getNotificationsByCategory,
    addPaymentNotification,
    addAccountNotification,
    addSecurityNotification,
    addAlertNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;