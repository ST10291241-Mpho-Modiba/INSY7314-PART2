import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BellIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { useNotifications } from '../../contexts/NotificationContext';
import { useAccessibility } from '../../hooks/useAccessibility';
import { useResponsive } from '../../hooks/useResponsive';
import { 
  slideInFromRight, 
  scaleIn, 
  staggerContainer, 
  staggerItem,
  getAnimationVariant
} from '../../utils/animations';

const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    removeNotification, 
    clearAll 
  } = useNotifications();
  const { announce, shouldReduceMotion } = useAccessibility();
  const { isMobile } = useResponsive();

  // Auto-announce new notifications
  useEffect(() => {
    if (unreadCount > 0) {
      announce(`You have ${unreadCount} new notification${unreadCount > 1 ? 's' : ''}`);
    }
  }, [unreadCount, announce]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-success-500" />;
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-error-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-warning-500" />;
      case 'info':
      default:
        return <InformationCircleIcon className="h-5 w-5 text-primary-500" />;
    }
  };



  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.read;
    return notification.type === filter;
  });

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Execute action if available
    if (notification.action) {
      notification.action();
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <motion.button
        onClick={() => {
          setIsOpen(!isOpen);
          announce(isOpen ? 'Notification center closed' : 'Notification center opened');
        }}
        className="relative p-2 text-white/80 hover:text-white transition-colors rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/50"
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
        {...(shouldReduceMotion ? {} : {
          whileHover: { scale: 1.05 },
          whileTap: { scale: 0.95 }
        })}
      >
        <BellIcon className="h-6 w-6" />
        
        {/* Unread Badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.div
              variants={getAnimationVariant(scaleIn, shouldReduceMotion)}
              initial="initial"
              animate="animate"
              exit="exit"
              className="absolute -top-1 -right-1 bg-error-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for mobile */}
            {isMobile && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                onClick={() => setIsOpen(false)}
              />
            )}
            
            <motion.div
              variants={getAnimationVariant(slideInFromRight, shouldReduceMotion)}
              initial="initial"
              animate="animate"
              exit="exit"
              className={`absolute ${
                isMobile 
                  ? 'fixed top-0 right-0 h-full w-full max-w-sm z-50' 
                  : 'top-full right-0 mt-2 w-96 z-30'
              } bg-white rounded-lg shadow-xl border border-neutral-200 overflow-hidden`}
              role="dialog"
              aria-modal={isMobile}
              aria-labelledby="notification-center-title"
            >
              {/* Header */}
              <div className="p-4 border-b border-neutral-200 bg-neutral-50">
                <div className="flex items-center justify-between">
                  <h3 id="notification-center-title" className="text-lg font-semibold text-neutral-900">
                    Notifications
                  </h3>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={() => {
                          markAllAsRead();
                          announce('All notifications marked as read');
                        }}
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2 py-1"
                        aria-label="Mark all as read"
                      >
                        Mark all read
                      </button>
                    )}
                    <button
                      onClick={() => setIsOpen(false)}
                      className="text-neutral-500 hover:text-neutral-700 p-1 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                      aria-label="Close notifications"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-1 mt-3">
                  {['all', 'unread', 'success', 'error', 'warning', 'info'].map((filterType) => (
                    <button
                      key={filterType}
                      onClick={() => setFilter(filterType)}
                      className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                        filter === filterType
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100'
                      }`}
                      aria-pressed={filter === filterType}
                    >
                      {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                      {filterType === 'unread' && unreadCount > 0 && (
                        <span className="ml-1 bg-error-500 text-white text-xs rounded-full px-1">
                          {unreadCount}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notification List */}
              <div className={`${isMobile ? 'h-full' : 'max-h-96'} overflow-y-auto`}>
                {filteredNotifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <BellIcon className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                    <p className="text-neutral-500 text-sm">
                      {filter === 'all' 
                        ? 'No notifications yet' 
                        : `No ${filter} notifications`
                      }
                    </p>
                  </div>
                ) : (
                  <motion.div
                    variants={getAnimationVariant(staggerContainer, shouldReduceMotion)}
                    initial="initial"
                    animate="animate"
                    className="divide-y divide-neutral-100"
                  >
                    {filteredNotifications.map((notification, index) => (
                      <motion.div
                        key={notification.id}
                        variants={getAnimationVariant(staggerItem, shouldReduceMotion)}
                        className={`p-4 hover:bg-neutral-50 transition-colors cursor-pointer group ${
                          !notification.read ? 'bg-primary-25' : ''
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleNotificationClick(notification);
                          }
                        }}
                        aria-label={`${notification.title}: ${notification.message}`}
                      >
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {getNotificationIcon(notification.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium ${
                                  !notification.read ? 'text-neutral-900' : 'text-neutral-700'
                                }`}>
                                  {notification.title}
                                </p>
                                <p className="text-sm text-neutral-600 mt-1 line-clamp-2">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-neutral-500 mt-2">
                                  {formatTimeAgo(notification.timestamp)}
                                </p>
                              </div>
                              
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {!notification.read && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markAsRead(notification.id);
                                      announce('Notification marked as read');
                                    }}
                                    className="p-1 text-neutral-400 hover:text-primary-600 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    aria-label="Mark as read"
                                  >
                                    <EyeIcon className="h-4 w-4" />
                                  </button>
                                )}
                                
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeNotification(notification.id);
                                    announce('Notification removed');
                                  }}
                                  className="p-1 text-neutral-400 hover:text-error-600 rounded focus:outline-none focus:ring-2 focus:ring-error-500"
                                  aria-label="Remove notification"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                            
                            {/* Action Buttons */}
                            {notification.actions && notification.actions.length > 0 && (
                              <div className="flex gap-2 mt-3">
                                {notification.actions.map((action, actionIndex) => (
                                  <button
                                    key={actionIndex}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      action.handler();
                                    }}
                                    className="text-xs font-medium text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-2 py-1 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                                  >
                                    {action.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          {/* Unread Indicator */}
                          {!notification.read && (
                            <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-2" />
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </div>

              {/* Footer Actions */}
              {notifications.length > 0 && (
                <div className="p-4 border-t border-neutral-200 bg-neutral-50">
                  <button
                    onClick={() => {
                      clearAll();
                      announce('All notifications cleared');
                      setIsOpen(false);
                    }}
                    className="w-full text-sm text-error-600 hover:text-error-700 font-medium py-2 hover:bg-error-50 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-error-500"
                  >
                    Clear All Notifications
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// Notification Bell Component (for use in header/navbar)
export const NotificationBell = ({ onClick, className = "" }) => {
  const { unreadCount } = useNotifications();
  const { shouldReduceMotion } = useAccessibility();

  return (
    <motion.button
      onClick={onClick}
      className={`relative p-2 text-neutral-600 hover:text-neutral-800 transition-colors rounded-lg hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 ${className}`}
      aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      {...(shouldReduceMotion ? {} : {
        whileHover: { scale: 1.05 },
        whileTap: { scale: 0.95 }
      })}
    >
      <BellIcon className="h-6 w-6" />
      
      {/* Unread Badge */}
      <AnimatePresence>
        {unreadCount > 0 && (
          <motion.div
            variants={getAnimationVariant(scaleIn, shouldReduceMotion)}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute -top-1 -right-1 bg-error-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

export default NotificationCenter;