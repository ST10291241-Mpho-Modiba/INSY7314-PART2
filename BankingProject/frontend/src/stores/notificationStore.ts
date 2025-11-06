import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';

// Notification Store
interface NotificationState {
  // Notifications
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    priority: 'low' | 'medium' | 'high';
    category: 'payment' | 'security' | 'system' | 'account';
    read: boolean;
    timestamp: string;
    actionUrl?: string;
    expiresAt?: string;
    persistent: boolean;
  }>;
  
  // Settings
  settings: {
    enabled: boolean;
    sound: boolean;
    desktop: boolean;
    email: boolean;
    sms: boolean;
    categories: {
      payment: boolean;
      security: boolean;
      system: boolean;
      account: boolean;
    };
    priorities: {
      low: boolean;
      medium: boolean;
      high: boolean;
    };
  };
  
  // State
  unreadCount: number;
  highPriorityCount: number;
  lastSync: string | null;
  isSyncing: boolean;
  
  // Actions
  setNotifications: (notifications: NotificationState['notifications']) => void;
  addNotification: (notification: Omit<NotificationState['notifications'][0], 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearByCategory: (category: string) => void;
  clearByPriority: (priority: string) => void;
  clearAll: () => void;
  
  updateSettings: (settings: Partial<NotificationState['settings']>) => void;
  setLastSync: (syncTime: string) => void;
  setIsSyncing: (syncing: boolean) => void;
  
  // Helper methods
  updateCounts: () => void;
  playNotificationSound: () => void;
  showDesktopNotification: (notification: NotificationState['notifications'][0]) => void;
  
  // Computed values
  getFilteredNotifications: (filters?: {
    category?: string;
    priority?: string;
    read?: boolean;
  }) => NotificationState['notifications'];
  getUnreadNotifications: () => NotificationState['notifications'];
  getHighPriorityNotifications: () => NotificationState['notifications'];
}

export const useNotificationStore = create<NotificationState>()(
  devtools(
    persist(
      subscribeWithSelector((set, get) => ({
        notifications: [],
        
        settings: {
          enabled: true,
          sound: true,
          desktop: false,
          email: false,
          sms: false,
          categories: {
            payment: true,
            security: true,
            system: true,
            account: true,
          },
          priorities: {
            low: true,
            medium: true,
            high: true,
          },
        },
        
        unreadCount: 0,
        highPriorityCount: 0,
        lastSync: null,
        isSyncing: false,
        
        setNotifications: (notifications) => {
          set({ notifications });
          get().updateCounts();
        },
        
        addNotification: (notification) => {
          const id = Date.now().toString();
          const timestamp = new Date().toISOString();
          const newNotification = { ...notification, id, timestamp };
          
          set((state) => ({
            notifications: [newNotification, ...state.notifications].slice(0, 100), // Keep top 100
          }));
          
          get().updateCounts();
          
          // Play sound if enabled
          if (get().settings.sound && get().settings.enabled) {
            get().playNotificationSound();
          }
          
          // Show desktop notification if enabled
          if (get().settings.desktop && get().settings.enabled && notification.priority === 'high') {
            get().showDesktopNotification(newNotification);
          }
        },
        
        removeNotification: (id) => {
          set((state) => ({
            notifications: state.notifications.filter(n => n.id !== id),
          }));
          get().updateCounts();
        },
        
        markAsRead: (id) => {
          set((state) => ({
            notifications: state.notifications.map(n =>
              n.id === id ? { ...n, read: true } : n
            ),
          }));
          get().updateCounts();
        },
        
        markAllAsRead: () => {
          set((state) => ({
            notifications: state.notifications.map(n => ({ ...n, read: true })),
          }));
          get().updateCounts();
        },
        
        clearByCategory: (category) => {
          set((state) => ({
            notifications: state.notifications.filter(n => n.category !== category),
          }));
          get().updateCounts();
        },
        
        clearByPriority: (priority) => {
          set((state) => ({
            notifications: state.notifications.filter(n => n.priority !== priority),
          }));
          get().updateCounts();
        },
        
        clearAll: () => {
          set({ notifications: [] });
          get().updateCounts();
        },
        
        updateSettings: (settings) => {
          set((state) => ({
            settings: { ...state.settings, ...settings },
          }));
        },
        
        setLastSync: (syncTime) => set({ lastSync: syncTime }),
        setIsSyncing: (syncing) => set({ isSyncing: syncing }),
        
        // Helper functions
        updateCounts: () => {
          const state = get();
          const unreadCount = state.notifications.filter(n => !n.read).length;
          const highPriorityCount = state.notifications.filter(n => n.priority === 'high' && !n.read).length;
          set({ unreadCount, highPriorityCount });
        },
        
        playNotificationSound: () => {
          // Create a simple beep sound
          try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
          } catch (error) {
            console.warn('Could not play notification sound:', error);
          }
        },
        
        showDesktopNotification: (notification) => {
          if (!('Notification' in window)) return;
          
          if (Notification.permission === 'granted') {
            new Notification(notification.title, {
              body: notification.message,
              icon: '/favicon.ico',
              tag: notification.id,
            });
          } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then((permission) => {
              if (permission === 'granted') {
                new Notification(notification.title, {
                  body: notification.message,
                  icon: '/favicon.ico',
                  tag: notification.id,
                });
              }
            });
          }
        },
        
        getFilteredNotifications: (filters = {}) => {
          const state = get();
          let filtered = state.notifications;
          
          if (filters.category && filters.category !== 'all') {
            filtered = filtered.filter(n => n.category === filters.category);
          }
          
          if (filters.priority && filters.priority !== 'all') {
            filtered = filtered.filter(n => n.priority === filters.priority);
          }
          
          if (filters.read !== undefined) {
            filtered = filtered.filter(n => n.read === filters.read);
          }
          
          return filtered;
        },
        
        getUnreadNotifications: () => {
          return get().notifications.filter(n => !n.read);
        },
        
        getHighPriorityNotifications: () => {
          return get().notifications.filter(n => n.priority === 'high');
        },
      })),
      {
        name: 'notification-store',
        partialize: (state) => ({
          settings: state.settings,
          lastSync: state.lastSync,
        }),
      }
    ),
    {
      name: 'notification-store',
    }
  )
);