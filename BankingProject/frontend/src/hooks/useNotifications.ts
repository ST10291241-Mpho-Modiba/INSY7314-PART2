import React from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useNotificationStore } from '../stores/notificationStore';
import { useOfflineStore } from '../stores/offlineStore';
import { QUERY_KEYS, optimisticUpdate } from '../lib/react-query';
import { toast } from 'sonner';

// API functions (these would be replaced with actual API calls)
const notificationsAPI = {
  getNotifications: async (page = 1, limit = 20, filters = {}) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const mockNotifications = Array.from({ length: limit }, (_, i) => ({
      id: `notification-${page}-${i}`,
      title: `Notification ${page}-${i}`,
      message: `This is a test notification message for item ${page}-${i}`,
      type: ['info', 'success', 'warning', 'error'][Math.floor(Math.random() * 4)] as 
        'info' | 'success' | 'warning' | 'error',
      priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 
        'low' | 'medium' | 'high',
      category: ['payment', 'security', 'account', 'system'][Math.floor(Math.random() * 4)],
      read: Math.random() > 0.3, // 70% read rate
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      actionUrl: Math.random() > 0.5 ? `/transactions/${page}-${i}` : undefined,
      expiresAt: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      persistent: Math.random() > 0.8, // 20% persistent
    }));
    
    return {
      notifications: mockNotifications,
      total: 200,
      page,
      totalPages: 10,
      hasNext: page < 10,
      unreadCount: mockNotifications.filter(n => !n.read).length,
      highPriorityCount: mockNotifications.filter(n => n.priority === 'high').length,
    };
  },
  
  getNotification: async (id: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 400));
    
    return {
      id,
      title: `Notification ${id}`,
      message: `Detailed message for notification ${id}`,
      type: 'info' as const,
      priority: 'medium' as const,
      category: 'system',
      read: false,
      timestamp: new Date().toISOString(),
      actionUrl: undefined,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      persistent: false,
    };
  },
  
  markAsRead: async (id: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return { success: true, id };
  },
  
  markAllAsRead: async (category?: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return { success: true, count: category ? 5 : 20 };
  },
  
  deleteNotification: async (id: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return { success: true, id };
  },
  
  deleteAllNotifications: async (category?: string, priority?: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 600));
    
    return { success: true, count: category ? 10 : 50 };
  },
  
  updateNotificationSettings: async (settings: any) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 400));
    
    return { success: true, settings };
  },
  
  getNotificationSettings: async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      enabled: true,
      sound: true,
      desktop: true,
      email: true,
      sms: false,
      categoryFilters: {
        payment: true,
        security: true,
        account: true,
        system: false,
      },
      priorityFilters: {
        low: true,
        medium: true,
        high: true,
      },
      quietHours: {
        enabled: true,
        start: '22:00',
        end: '08:00',
      },
    };
  },
  
  syncNotifications: async (lastSync: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      new: [],
      updated: [],
      deleted: [],
      serverTime: new Date().toISOString(),
    };
  },
};

// Notification Hooks
export const useNotifications = (filters = {}, options = {}) => {
  const { isOnline } = useOfflineStore();
  const setNotifications = useNotificationStore((state) => state.setNotifications);
  
  const query = useInfiniteQuery({
    queryKey: [QUERY_KEYS.NOTIFICATIONS[0], filters],
    queryFn: ({ pageParam = 1 }: { pageParam: number }) => notificationsAPI.getNotifications(pageParam, 20, filters),
    initialPageParam: 1,
    getNextPageParam: (lastPage: any) => lastPage.hasNext ? lastPage.page + 1 : undefined,
    enabled: isOnline,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
  
  // Update Zustand store when data changes
  React.useEffect(() => {
    if (query.data) {
      const allNotifications = query.data.pages.flatMap(page => page.notifications);
      // Ensure category is one of the valid types
      const typedNotifications = allNotifications.map((n: any) => ({
        ...n,
        category: (['payment', 'security', 'account', 'system'].includes(n.category) 
          ? n.category 
          : 'system') as 'payment' | 'security' | 'account' | 'system'
      }));
      setNotifications(typedNotifications);
    }
  }, [query.data]);
  
  return {
    ...query,
    notifications: query.data?.pages.flatMap(page => page.notifications) || [],
    total: query.data?.pages[0]?.total || 0,
    unreadCount: query.data?.pages[0]?.unreadCount || 0,
    highPriorityCount: query.data?.pages[0]?.highPriorityCount || 0,
  };
};

export const useNotification = (id: string) => {
  const { isOnline } = useOfflineStore();
  
  return useQuery({
    queryKey: QUERY_KEYS.NOTIFICATION(id),
    queryFn: () => notificationsAPI.getNotification(id),
    enabled: isOnline && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  
  return useMutation({
    mutationFn: notificationsAPI.markAsRead,
    onMutate: async (id) => {
      // Optimistic update
      markAsRead(id);
      
      // Update query data
      queryClient.setQueryData(
        [QUERY_KEYS.NOTIFICATIONS[0]],
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              notifications: page.notifications.map((n: any) =>
                n.id === id ? { ...n, read: true } : n
              ),
            })),
          };
        }
      );
      
      return { id };
    },
    onError: (error: any, variables, context) => {
      // Revert on error
      if (context?.id) {
        queryClient.setQueryData(
          [QUERY_KEYS.NOTIFICATIONS[0]],
          (old: any) => {
            if (!old) return old;
            return {
              ...old,
              pages: old.pages.map((page: any) => ({
                ...page,
                notifications: page.notifications.map((n: any) =>
                  n.id === context.id ? { ...n, read: false } : n
                ),
              })),
            };
          }
        );
      }
      toast.error(error.message || 'Failed to mark notification as read');
    },
  });
};

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);
  
  return useMutation({
    mutationFn: notificationsAPI.markAllAsRead,
    onMutate: async (category) => {
      // Optimistic update
      markAllAsRead();
      
      // Update query data
      queryClient.setQueryData(
        [QUERY_KEYS.NOTIFICATIONS[0]],
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              notifications: page.notifications.map((n: any) => ({ ...n, read: true })),
              unreadCount: 0,
            })),
          };
        }
      );
      
      return {};
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to mark all notifications as read');
    },
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();
  const removeNotification = useNotificationStore((state) => state.removeNotification);
  
  return useMutation({
    mutationFn: notificationsAPI.deleteNotification,
    onMutate: async (id) => {
      // Optimistic update
      removeNotification(id);
      
      // Update query data
      queryClient.setQueryData(
        [QUERY_KEYS.NOTIFICATIONS[0]],
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              notifications: page.notifications.filter((n: any) => n.id !== id),
              total: page.total - 1,
            })),
          };
        }
      );
      
      return { id };
    },
    onError: (error: any, variables, context) => {
      toast.error(error.message || 'Failed to delete notification');
    },
  });
};

export const useDeleteAllNotifications = () => {
  const queryClient = useQueryClient();
  const clearAll = useNotificationStore((state) => state.clearAll);
  
  return useMutation({
    mutationFn: async (params?: { category?: string; priority?: string }) => {
      return notificationsAPI.deleteAllNotifications(params?.category, params?.priority);
    },
    onMutate: async (params) => {
      // Optimistic update
      // Note: clearAll doesn't take parameters, so we'll handle filtering differently
      if (params?.category) {
        // Filter by category would need to be handled differently
      }
      if (params?.priority) {
        // Filter by priority would need to be handled differently
      }
      
      // Update query data
      queryClient.setQueryData(
        [QUERY_KEYS.NOTIFICATIONS[0]],
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              notifications: [],
              total: 0,
              unreadCount: 0,
              highPriorityCount: 0,
            })),
          };
        }
      );
      
      return {};
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to clear notifications');
    },
  });
};

export const useNotificationSettings = () => {
  const { isOnline } = useOfflineStore();
  const updateSettings = useNotificationStore((state) => state.updateSettings);
  
  const query = useQuery({
    queryKey: QUERY_KEYS.NOTIFICATION_SETTINGS,
    queryFn: notificationsAPI.getNotificationSettings,
    enabled: isOnline,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Update Zustand store when data changes
  React.useEffect(() => {
    if (query.data) {
      updateSettings(query.data);
    }
  }, [query.data]);
  
  return query;
};

export const useUpdateNotificationSettings = () => {
  const queryClient = useQueryClient();
  const updateSettings = useNotificationStore((state) => state.updateSettings);
  
  return useMutation({
    mutationFn: notificationsAPI.updateNotificationSettings,
    onSuccess: (data) => {
      updateSettings(data.settings);
      toast.success('Notification settings updated');
      queryClient.setQueryData(QUERY_KEYS.NOTIFICATION_SETTINGS, data.settings);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update notification settings');
    },
  });
};

export const useSyncNotifications = () => {
  const queryClient = useQueryClient();
  const { isOnline } = useOfflineStore();
  const lastSync = useNotificationStore((state) => state.lastSync);
  const setLastSync = useNotificationStore((state) => state.setLastSync);
  
  return useMutation({
    mutationFn: () => notificationsAPI.syncNotifications(lastSync || new Date(0).toISOString()),
    onSuccess: (data) => {
      setLastSync(data.serverTime);
      toast.success('Notifications synced successfully');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS });
    },
    // Note: enabled is not a valid option for useMutation - check isOnline before calling mutate
  });
};