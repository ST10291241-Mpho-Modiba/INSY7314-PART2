import { useEffect, useRef, useState, useCallback } from 'react';

export interface SSEOptions {
  url: string;
  headers?: Record<string, string>;
  withCredentials?: boolean;
  reconnectInterval?: number;
  reconnectAttempts?: number;
  heartbeatInterval?: number;
  onOpen?: (event: Event) => void;
  onMessage?: (data: any) => void;
  onError?: (event: Event) => void;
  onClose?: (event: Event) => void;
  enabled?: boolean;
}

export interface SSEState {
  isConnected: boolean;
  isConnecting: boolean;
  connectionAttempts: number;
  lastMessage?: any;
  lastError?: Event;
  readyState: number;
}

export const useSSE = (options: SSEOptions): SSEState & {
  disconnect: () => void;
  reconnect: () => void;
} => {
  const {
    url,
    headers = {},
    withCredentials = false,
    reconnectInterval = 5000,
    reconnectAttempts = 5,
    heartbeatInterval = 30000,
    onOpen,
    onMessage,
    onError,
    onClose,
    enabled = true
  } = options;

  const [state, setState] = useState<SSEState>({
    isConnected: false,
    isConnecting: false,
    connectionAttempts: 0,
    readyState: EventSource.CLOSED
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectCountRef = useRef(0);
  const isManualDisconnectRef = useRef(false);
  const lastHeartbeatRef = useRef(Date.now());

  // Heartbeat check function
  const checkHeartbeat = useCallback(() => {
    const now = Date.now();
    if (now - lastHeartbeatRef.current > heartbeatInterval * 2) {
      // Connection seems dead, reconnect
      console.warn('SSE heartbeat timeout, reconnecting...');
      disconnect();
      setTimeout(() => {
        reconnectCountRef.current++;
        connect();
      }, 1000);
    }
  }, [heartbeatInterval]);

  // Start heartbeat monitoring
  const startHeartbeat = useCallback(() => {
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
    }
    heartbeatTimeoutRef.current = setInterval(checkHeartbeat, heartbeatInterval);
  }, [heartbeatInterval, checkHeartbeat]);

  // Stop heartbeat monitoring
  const stopHeartbeat = useCallback(() => {
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
      heartbeatTimeoutRef.current = null;
    }
  }, []);

  // Connect to SSE
  const connect = useCallback(() => {
    if (!enabled || !url) return;

    // Clear any existing reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setState(prev => ({ 
      ...prev, 
      isConnecting: true, 
      connectionAttempts: reconnectCountRef.current + 1 
    }));

    try {
      // Create EventSource with headers (if supported)
      let eventSource: EventSource;
      
      if (Object.keys(headers).length > 0) {
        // For custom headers, we need to use a different approach
        // This is a workaround since EventSource doesn't support custom headers
        const urlWithParams = new URL(url);
        Object.entries(headers).forEach(([key, value]) => {
          urlWithParams.searchParams.append(key, value);
        });
        
        eventSource = new EventSource(urlWithParams.toString(), { withCredentials });
      } else {
        eventSource = new EventSource(url, { withCredentials });
      }

      eventSourceRef.current = eventSource;
      lastHeartbeatRef.current = Date.now();

      eventSource.onopen = (event) => {
        reconnectCountRef.current = 0;
        isManualDisconnectRef.current = false;
        
        setState(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          connectionAttempts: 0,
          readyState: EventSource.OPEN
        }));

        startHeartbeat();
        onOpen?.(event);
      };

      eventSource.onmessage = (event) => {
        try {
          lastHeartbeatRef.current = Date.now();
          const data = JSON.parse(event.data);
          
          setState(prev => ({ ...prev, lastMessage: data }));
          onMessage?.(data);
        } catch (error) {
          console.error('Failed to parse SSE message:', error);
          setState(prev => ({ ...prev, lastMessage: event.data }));
          onMessage?.(event.data);
        }
      };

      // Handle custom event types
      eventSource.addEventListener('notification', (event) => {
        try {
          const data = JSON.parse(event.data);
          setState(prev => ({ ...prev, lastMessage: data }));
          onMessage?.({ type: 'notification', data });
        } catch (error) {
          onMessage?.({ type: 'notification', data: event.data });
        }
      });

      eventSource.addEventListener('payment', (event) => {
        try {
          const data = JSON.parse(event.data);
          setState(prev => ({ ...prev, lastMessage: data }));
          onMessage?.({ type: 'payment', data });
        } catch (error) {
          onMessage?.({ type: 'payment', data: event.data });
        }
      });

      eventSource.addEventListener('security', (event) => {
        try {
          const data = JSON.parse(event.data);
          setState(prev => ({ ...prev, lastMessage: data }));
          onMessage?.({ type: 'security', data });
        } catch (error) {
          onMessage?.({ type: 'security', data: event.data });
        }
      });

      eventSource.onerror = (event) => {
        stopHeartbeat();
        
        setState(prev => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
          lastError: event,
          readyState: eventSource.readyState
        }));

        onError?.(event);

        // Handle different error scenarios
        if (eventSource.readyState === EventSource.CLOSED) {
          // Connection was closed, attempt reconnection if not manually disconnected
          if (!isManualDisconnectRef.current && reconnectCountRef.current < reconnectAttempts) {
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectCountRef.current++;
              connect();
            }, reconnectInterval);
          }
        }
      };

    } catch (error) {
      console.error('Failed to create EventSource connection:', error);
      setState(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        readyState: EventSource.CLOSED
      }));
    }
  }, [url, headers, withCredentials, enabled, reconnectInterval, reconnectAttempts, onOpen, onMessage, onError, startHeartbeat, stopHeartbeat]);

  // Disconnect SSE
  const disconnect = useCallback(() => {
    isManualDisconnectRef.current = true;
    stopHeartbeat();
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setState(prev => ({
      ...prev,
      isConnected: false,
      isConnecting: false,
      connectionAttempts: 0,
      readyState: EventSource.CLOSED
    }));
  }, [stopHeartbeat]);

  // Reconnect SSE
  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(() => {
      reconnectCountRef.current = 0;
      connect();
    }, 100);
  }, [disconnect, connect]);

  // Auto-connect on mount and URL change
  useEffect(() => {
    if (enabled && url) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [url, enabled, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
      stopHeartbeat();
    };
  }, [disconnect, stopHeartbeat]);

  return {
    ...state,
    disconnect,
    reconnect
  };
};

// SSE manager class for multiple connections
export class SSEManager {
  private connections: Map<string, EventSource> = new Map();
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  private errorHandlers: Map<string, (error: Event) => void> = new Map();

  connect(
    id: string,
    url: string,
    headers?: Record<string, string>,
    withCredentials?: boolean,
    onMessage?: (data: any) => void,
    onError?: (error: Event) => void
  ): void {
    if (this.connections.has(id)) {
      console.warn(`SSE connection ${id} already exists`);
      return;
    }

    let eventSource: EventSource;
    
    if (headers && Object.keys(headers).length > 0) {
      // For custom headers, append to URL
      const urlWithParams = new URL(url);
      Object.entries(headers).forEach(([key, value]) => {
        urlWithParams.searchParams.append(key, value);
      });
      
      eventSource = new EventSource(urlWithParams.toString(), { withCredentials });
    } else {
      eventSource = new EventSource(url, { withCredentials });
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.messageHandlers.get(id)?.(data);
        onMessage?.(data);
      } catch (error) {
        this.messageHandlers.get(id)?.(event.data);
        onMessage?.(event.data);
      }
    };

    eventSource.onerror = (event) => {
      this.errorHandlers.get(id)?.(event);
      onError?.(event);
    };

    this.connections.set(id, eventSource);
    if (onMessage) this.messageHandlers.set(id, onMessage);
    if (onError) this.errorHandlers.set(id, onError);
  }

  disconnect(id: string): void {
    const eventSource = this.connections.get(id);
    if (eventSource) {
      eventSource.close();
      this.connections.delete(id);
      this.messageHandlers.delete(id);
      this.errorHandlers.delete(id);
    }
  }

  getConnection(id: string): EventSource | undefined {
    return this.connections.get(id);
  }

  isConnected(id: string): boolean {
    const eventSource = this.connections.get(id);
    return eventSource !== undefined && eventSource.readyState === EventSource.OPEN;
  }

  getAllConnections(): string[] {
    return Array.from(this.connections.keys());
  }

  disconnectAll(): void {
    this.connections.forEach((eventSource, id) => {
      eventSource.close();
    });
    this.connections.clear();
    this.messageHandlers.clear();
    this.errorHandlers.clear();
  }
}

// Create singleton instance
export const sseManager: SSEManager = new SSEManager();