import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BellIcon, 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  InformationCircleIcon,
  XMarkIcon,
  ClockIcon,
  TrashIcon,
  Cog6ToothIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon
} from '@heroicons/react/24/outline';
import { 
  CheckCircleIcon as CheckCircleSolidIcon,
  ExclamationCircleIcon as ExclamationCircleSolidIcon,
  InformationCircleIcon as InformationCircleSolidIcon 
} from '@heroicons/react/24/solid';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { useSSE } from '../hooks/useSSE';
import { formatDistanceToNow } from 'date-fns';
import { notificationSlideIn } from '../utils/animations';
import { announceToScreenReader } from '../utils/accessibility';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  category: 'payment' | 'security' | 'system' | 'account' | 'marketing';
  actionUrl?: string;
  actionText?: string;
  persistent?: boolean;
  expiresAt?: Date;
}

export interface NotificationSettings {
  enabled: boolean;
  soundEnabled: boolean;
  desktopNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  categories: {
    payment: boolean;
    security: boolean;
    system: boolean;
    account: boolean;
    marketing: boolean;
  };
  priorities: {
    low: boolean;
    medium: boolean;
    high: boolean;
  };
}

const NotificationCenter: React.FC = () => {
  const { user } = useAuth();
  const { notifications, addNotification, markAsRead, markAllAsRead, removeNotification, clearAll } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'payment' | 'security' | 'system' | 'account'>('all');
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    soundEnabled: true,
    desktopNotifications: false,
    emailNotifications: true,
    smsNotifications: false,
    categories: {
      payment: true,
      security: true,
      system: true,
      account: true,
      marketing: false
    },
    priorities: {
      low: true,
      medium: true,
      high: true
    }
  });
  const [showSettings, setShowSettings] = useState(false);

  // WebSocket connection for real-time notifications
  const { isConnected: wsConnected } = useWebSocket({
    url: `wss://api.bankingapp.com/notifications/${user?.id}`,
    onMessage: useCallback((message: any) => {
      if (message.type === 'notification') {
        addNotification(message.notification);
        
        // Play sound if enabled
        if (settings.soundEnabled) {
          playNotificationSound();
        }
        
        // Show desktop notification if enabled
        if (settings.desktopNotifications && message.notification.priority === 'high') {
          showDesktopNotification(message.notification);
        }
      }
    }, [settings.soundEnabled, settings.desktopNotifications]),
    enabled: settings.enabled && !!user
  });

  // SSE connection for backup real-time notifications
  const { isConnected: sseConnected } = useSSE({
    url: `https://api.bankingapp.com/notifications/stream/${user?.id}`,
    onMessage: useCallback((message: any) => {
      if (message.type === 'notification') {
        addNotification(message.notification);
      }
    }, []),
    enabled: settings.enabled && !!user && !wsConnected
  });

  // Filter notifications based on active tab and settings
  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    // Filter by tab
    if (activeTab === 'unread') {
      filtered = filtered.filter(n => !n.read);
    } else if (activeTab !== 'all') {
      filtered = filtered.filter(n => n.category === activeTab);
    }

    // Filter by settings
    filtered = filtered.filter(n => 
      settings.categories[n.category] && 
      settings.priorities[n.priority]
    );

    return filtered;
  }, [notifications, activeTab, settings]);

  // Calculate notification statistics
  const stats = useMemo(() => {
    const unread = notifications.filter(n => !n.read).length;
    const total = notifications.length;
    const highPriority = notifications.filter(n => n.priority === 'high' && !n.read).length;
    
    return { unread, total, highPriority };
  }, [notifications]);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    try {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignore audio play errors
      });
    } catch {
      // Ignore audio errors
    }
  }, []);

  // Show desktop notification
  const showDesktopNotification = useCallback((notification: Notification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        tag: notification.id,
        requireInteraction: notification.priority === 'high'
      });
    }
  }, []);

  // Request desktop notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      setSettings(prev => ({ ...prev, desktopNotifications: permission === 'granted' }));
    }
  }, []);

  // Handle notification click
  const handleNotificationClick = useCallback((notification: Notification) => {
    markAsRead(notification.id);
    
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
    
    announceToScreenReader(`Notification "${notification.title}" marked as read`);
  }, [markAsRead]);

  // Handle mark all as read
  const handleMarkAllAsRead = useCallback(() => {
    markAllAsRead();
    announceToScreenReader('All notifications marked as read');
  }, [markAllAsRead]);

  // Handle clear all
  const handleClearAll = useCallback(() => {
    clearAll();
    announceToScreenReader('All notifications cleared');
  }, [clearAll]);

  // Handle settings change
  const handleSettingsChange = useCallback((key: keyof NotificationSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  // Handle category settings change
  const handleCategoryChange = useCallback((category: keyof NotificationSettings['categories'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      categories: { ...prev.categories, [category]: value }
    }));
  }, []);

  // Handle priority settings change
  const handlePriorityChange = useCallback((priority: keyof NotificationSettings['priorities'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      priorities: { ...prev.priorities, [priority]: value }
    }));
  }, []);

  // Get notification icon based on type
  const getNotificationIcon = (type: Notification['type']) => {
    const iconClass = "w-5 h-5";
    switch (type) {
      case 'success':
        return <CheckCircleSolidIcon className={`${iconClass} text-green-500`} />;
      case 'warning':
        return <ExclamationCircleSolidIcon className={`${iconClass} text-yellow-500`} />;
      case 'error':
        return <ExclamationCircleSolidIcon className={`${iconClass} text-red-500`} />;
      default:
        return <InformationCircleSolidIcon className={`${iconClass} text-blue-500`} />;
    }
  };

  // Get priority color
  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500';
      case 'medium':
        return 'border-l-yellow-500';
      default:
        return 'border-l-blue-500';
    }
  };

  // Get relative time
  const getRelativeTime = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true });
  };

  // Auto-announce new high-priority notifications
  useEffect(() => {
    const newHighPriorityNotifications = notifications.filter(
      n => n.priority === 'high' && !n.read && 
      n.timestamp.getTime() > Date.now() - 5000 // Last 5 seconds
    );

    newHighPriorityNotifications.forEach(notification => {
      announceToScreenReader(`High priority notification: ${notification.title}. ${notification.message}`);
    });
  }, [notifications]);

  // Cleanup expired notifications
  useEffect(() => {
    const expiredNotifications = notifications.filter(
      n => n.expiresAt && n.expiresAt < new Date()
    );

    expiredNotifications.forEach(notification => {
      removeNotification(notification.id);
    });
  }, [notifications, removeNotification]);

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
        aria-label={`Notifications (${stats.unread} unread)`}
        aria-expanded={isOpen}
      >
        <BellIcon className="w-6 h-6" />
        {stats.unread > 0 && (
          <span className="absolute top-0 right-0 block h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
            {stats.unread > 99 ? '99+' : stats.unread}
          </span>
        )}
        {stats.highPriority > 0 && (
          <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
        )}
      </button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Notifications
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Notification settings"
                  >
                    <Cog6ToothIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Close notifications"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Connection Status */}
              <div className="mt-2 flex items-center text-sm">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  wsConnected ? 'bg-green-500' : sseConnected ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <span className="text-gray-600">
                  {wsConnected ? 'Real-time connected' : sseConnected ? 'Backup connected' : 'Offline'}
                </span>
              </div>
            </div>

            {/* Settings Panel */}
            {showSettings && (
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="space-y-4">
                  {/* Sound Settings */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Sound notifications</span>
                    <button
                      onClick={() => handleSettingsChange('soundEnabled', !settings.soundEnabled)}
                      className={`p-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        settings.soundEnabled ? 'text-blue-600' : 'text-gray-400'
                      }`}
                    >
                      {settings.soundEnabled ? (
                        <SpeakerWaveIcon className="w-5 h-5" />
                      ) : (
                        <SpeakerXMarkIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {/* Desktop Notifications */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Desktop notifications</span>
                    <button
                      onClick={() => {
                        if (!settings.desktopNotifications) {
                          requestNotificationPermission();
                        } else {
                          handleSettingsChange('desktopNotifications', false);
                        }
                      }}
                      className={`px-3 py-1 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        settings.desktopNotifications
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {settings.desktopNotifications ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>

                  {/* Categories */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Categories</h4>
                    <div className="space-y-2">
                      {Object.entries(settings.categories).map(([category, enabled]) => (
                        <label key={category} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={enabled}
                            onChange={(e) => handleCategoryChange(category as keyof NotificationSettings['categories'], e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-600 capitalize">{category}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Priorities */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Priorities</h4>
                    <div className="space-y-2">
                      {Object.entries(settings.priorities).map(([priority, enabled]) => (
                        <label key={priority} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={enabled}
                            onChange={(e) => handlePriorityChange(priority as keyof NotificationSettings['priorities'], e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-600 capitalize">{priority}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              {[
                { key: 'all', label: 'All', count: stats.total },
                { key: 'unread', label: 'Unread', count: stats.unread },
                { key: 'payment', label: 'Payments', count: notifications.filter(n => n.category === 'payment').length },
                { key: 'security', label: 'Security', count: notifications.filter(n => n.category === 'security').length }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex-1 px-3 py-2 text-sm font-medium border-b-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className="ml-1 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="p-3 border-b border-gray-200 bg-gray-50 flex justify-between">
              <button
                onClick={handleMarkAllAsRead}
                disabled={stats.unread === 0}
                className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
              >
                Mark all as read
              </button>
              <button
                onClick={handleClearAll}
                disabled={notifications.length === 0}
                className="text-sm text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-2 py-1"
              >
                Clear all
              </button>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {filteredNotifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <BellIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredNotifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      variants={notificationSlideIn}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className={`p-4 hover:bg-gray-50 cursor-pointer border-l-4 ${
                        getPriorityColor(notification.priority)
                      } ${!notification.read ? 'bg-blue-50' : ''}`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className={`text-sm font-medium ${
                                !notification.read ? 'text-gray-900' : 'text-gray-700'
                              }`}>
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                {notification.message}
                              </p>
                              {notification.actionText && notification.actionUrl && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.location.href = notification.actionUrl!;
                                  }}
                                  className="text-sm text-blue-600 hover:text-blue-800 font-medium mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                                >
                                  {notification.actionText}
                                </button>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 ml-3">
                              <span className="text-xs text-gray-500">
                                {getRelativeTime(notification.timestamp)}
                              </span>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeNotification(notification.id);
                                }}
                                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded"
                                aria-label="Remove notification"
                              >
                                <XMarkIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center mt-2 space-x-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              notification.priority === 'high' ? 'bg-red-100 text-red-800' :
                              notification.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {notification.priority}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              notification.category === 'payment' ? 'bg-green-100 text-green-800' :
                              notification.category === 'security' ? 'bg-red-100 text-red-800' :
                              notification.category === 'system' ? 'bg-purple-100 text-purple-800' :
                              notification.category === 'account' ? 'bg-indigo-100 text-indigo-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {notification.category}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default NotificationCenter;