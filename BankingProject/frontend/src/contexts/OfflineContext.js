import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Initial state
const initialState = {
  isOnline: navigator.onLine,
  queuedActions: JSON.parse(localStorage.getItem('queuedActions') || '[]'),
  lastSync: localStorage.getItem('lastSync') ? new Date(localStorage.getItem('lastSync')) : null,
  syncInProgress: false,
  cachedData: JSON.parse(localStorage.getItem('cachedData') || '{}'),
};

// Action types
const OFFLINE_ACTIONS = {
  SET_ONLINE_STATUS: 'SET_ONLINE_STATUS',
  QUEUE_ACTION: 'QUEUE_ACTION',
  REMOVE_QUEUED_ACTION: 'REMOVE_QUEUED_ACTION',
  CLEAR_QUEUE: 'CLEAR_QUEUE',
  SET_SYNC_STATUS: 'SET_SYNC_STATUS',
  UPDATE_LAST_SYNC: 'UPDATE_LAST_SYNC',
  CACHE_DATA: 'CACHE_DATA',
  CLEAR_CACHE: 'CLEAR_CACHE',
};

// Reducer
const offlineReducer = (state, action) => {
  switch (action.type) {
    case OFFLINE_ACTIONS.SET_ONLINE_STATUS:
      return {
        ...state,
        isOnline: action.payload,
      };
    case OFFLINE_ACTIONS.QUEUE_ACTION:
      const newQueue = [...state.queuedActions, action.payload];
      localStorage.setItem('queuedActions', JSON.stringify(newQueue));
      return {
        ...state,
        queuedActions: newQueue,
      };
    case OFFLINE_ACTIONS.REMOVE_QUEUED_ACTION:
      const filteredQueue = state.queuedActions.filter(a => a.id !== action.payload);
      localStorage.setItem('queuedActions', JSON.stringify(filteredQueue));
      return {
        ...state,
        queuedActions: filteredQueue,
      };
    case OFFLINE_ACTIONS.CLEAR_QUEUE:
      localStorage.removeItem('queuedActions');
      return {
        ...state,
        queuedActions: [],
      };
    case OFFLINE_ACTIONS.SET_SYNC_STATUS:
      return {
        ...state,
        syncInProgress: action.payload,
      };
    case OFFLINE_ACTIONS.UPDATE_LAST_SYNC:
      const syncTime = new Date();
      localStorage.setItem('lastSync', syncTime.toISOString());
      return {
        ...state,
        lastSync: syncTime,
      };
    case OFFLINE_ACTIONS.CACHE_DATA:
      const newCachedData = { ...state.cachedData, ...action.payload };
      localStorage.setItem('cachedData', JSON.stringify(newCachedData));
      return {
        ...state,
        cachedData: newCachedData,
      };
    case OFFLINE_ACTIONS.CLEAR_CACHE:
      localStorage.removeItem('cachedData');
      return {
        ...state,
        cachedData: {},
      };
    default:
      return state;
  }
};

// Create context
const OfflineContext = createContext();

// Provider component
export const OfflineProvider = ({ children }) => {
  const [state, dispatch] = useReducer(offlineReducer, initialState);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      dispatch({ type: OFFLINE_ACTIONS.SET_ONLINE_STATUS, payload: true });
      // Trigger sync when coming back online
      if (state.queuedActions.length > 0) {
        syncQueuedActions();
      }
    };

    const handleOffline = () => {
      dispatch({ type: OFFLINE_ACTIONS.SET_ONLINE_STATUS, payload: false });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [state.queuedActions.length]);

  // Actions
  const queueAction = (action) => {
    const queuedAction = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...action,
    };
    dispatch({ type: OFFLINE_ACTIONS.QUEUE_ACTION, payload: queuedAction });
    return queuedAction.id;
  };

  const removeQueuedAction = (id) => {
    dispatch({ type: OFFLINE_ACTIONS.REMOVE_QUEUED_ACTION, payload: id });
  };

  const clearQueue = () => {
    dispatch({ type: OFFLINE_ACTIONS.CLEAR_QUEUE });
  };

  const syncQueuedActions = async () => {
    if (state.syncInProgress || !state.isOnline || state.queuedActions.length === 0) {
      return;
    }

    dispatch({ type: OFFLINE_ACTIONS.SET_SYNC_STATUS, payload: true });

    try {
      // Process queued actions
      for (const action of state.queuedActions) {
        try {
          // This would be implemented based on the specific action type
          console.log('Syncing action:', action);
          removeQueuedAction(action.id);
        } catch (error) {
          console.error('Failed to sync action:', action, error);
          // Keep failed actions in queue for retry
        }
      }

      dispatch({ type: OFFLINE_ACTIONS.UPDATE_LAST_SYNC });
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      dispatch({ type: OFFLINE_ACTIONS.SET_SYNC_STATUS, payload: false });
    }
  };

  const cacheData = (key, data) => {
    dispatch({ 
      type: OFFLINE_ACTIONS.CACHE_DATA, 
      payload: { [key]: { data, timestamp: new Date().toISOString() } }
    });
  };

  const getCachedData = (key) => {
    return state.cachedData[key]?.data || null;
  };

  const clearCache = () => {
    dispatch({ type: OFFLINE_ACTIONS.CLEAR_CACHE });
  };

  const value = {
    ...state,
    queueAction,
    removeQueuedAction,
    clearQueue,
    syncQueuedActions,
    cacheData,
    getCachedData,
    clearCache,
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
};

// Custom hook
export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};

export { OFFLINE_ACTIONS };