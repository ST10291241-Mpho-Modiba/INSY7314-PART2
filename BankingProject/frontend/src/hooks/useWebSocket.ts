import { useEffect, useRef, useState, useCallback } from 'react';

export interface WebSocketOptions {
  url: string;
  protocols?: string[];
  reconnectInterval?: number;
  reconnectAttempts?: number;
  heartbeatInterval?: number;
  onOpen?: (event: Event) => void;
  onMessage?: (data: any) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  enabled?: boolean;
}

export interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  connectionAttempts: number;
  lastMessage?: any;
  lastError?: Event;
  readyState: number;
}

export const useWebSocket = (options: WebSocketOptions): WebSocketState & {
  send: (data: any) => void;
  disconnect: () => void;
  reconnect: () => void;
} => {
  const {
    url,
    protocols,
    reconnectInterval = 5000,
    reconnectAttempts = 5,
    heartbeatInterval = 30000,
    onOpen,
    onMessage,
    onClose,
    onError,
    enabled = true
  } = options;

  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isConnecting: false,
    connectionAttempts: 0,
    readyState: WebSocket.CLOSED
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectCountRef = useRef(0);
  const isManualDisconnectRef = useRef(false);

  // Heartbeat function to keep connection alive
  const sendHeartbeat = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'ping' }));
    }
  }, []);

  // Start heartbeat
  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
    heartbeatIntervalRef.current = setInterval(sendHeartbeat, heartbeatInterval);
  }, [heartbeatInterval, sendHeartbeat]);

  // Stop heartbeat
  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!enabled || !url) return;

    // Clear any existing reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setState(prev => ({ ...prev, isConnecting: true, connectionAttempts: reconnectCountRef.current + 1 }));

    try {
      const ws = protocols ? new WebSocket(url, protocols) : new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = (event) => {
        reconnectCountRef.current = 0;
        isManualDisconnectRef.current = false;
        
        setState(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          connectionAttempts: 0,
          readyState: WebSocket.OPEN
        }));

        startHeartbeat();
        onOpen?.(event);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle heartbeat responses
          if (data.type === 'pong') {
            return;
          }
          
          setState(prev => ({ ...prev, lastMessage: data }));
          onMessage?.(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
          setState(prev => ({ ...prev, lastMessage: event.data }));
          onMessage?.(event.data);
        }
      };

      ws.onclose = (event) => {
        stopHeartbeat();
        wsRef.current = null;
        
        setState(prev => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
          readyState: WebSocket.CLOSED
        }));

        onClose?.(event);

        // Attempt reconnection if not manually disconnected
        if (!isManualDisconnectRef.current && reconnectCountRef.current < reconnectAttempts) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectCountRef.current++;
            connect();
          }, reconnectInterval);
        }
      };

      ws.onerror = (event) => {
        setState(prev => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
          lastError: event,
          readyState: WebSocket.CLOSED
        }));

        onError?.(event);
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setState(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        readyState: WebSocket.CLOSED
      }));
    }
  }, [url, protocols, enabled, reconnectInterval, reconnectAttempts, onOpen, onMessage, onClose, onError, startHeartbeat, stopHeartbeat]);

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    isManualDisconnectRef.current = true;
    stopHeartbeat();
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setState(prev => ({
      ...prev,
      isConnected: false,
      isConnecting: false,
      connectionAttempts: 0,
      readyState: WebSocket.CLOSED
    }));
  }, [stopHeartbeat]);

  // Reconnect WebSocket
  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(() => {
      reconnectCountRef.current = 0;
      connect();
    }, 100);
  }, [disconnect, connect]);

  // Send message through WebSocket
  const send = useCallback((data: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        const message = typeof data === 'string' ? data : JSON.stringify(data);
        wsRef.current.send(message);
        return true;
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
        return false;
      }
    } else {
      console.warn('WebSocket is not connected');
      return false;
    }
  }, []);

  // Auto-connect on mount and URL change
  useEffect(() => {
    if (enabled && url) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [url, protocols, enabled, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
      stopHeartbeat();
    };
  }, [disconnect, stopHeartbeat]);

  return {
    ...state,
    send,
    disconnect,
    reconnect
  };
};

// WebSocket manager class for multiple connections
export class WebSocketManager {
  private connections: Map<string, WebSocket> = new Map();
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  private errorHandlers: Map<string, (error: Event) => void> = new Map();

  connect(
    id: string,
    url: string,
    protocols?: string[],
    onMessage?: (data: any) => void,
    onError?: (error: Event) => void
  ): void {
    if (this.connections.has(id)) {
      console.warn(`WebSocket connection ${id} already exists`);
      return;
    }

    const ws = protocols ? new WebSocket(url, protocols) : new WebSocket(url);
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.messageHandlers.get(id)?.(data);
        onMessage?.(data);
      } catch (error) {
        this.messageHandlers.get(id)?.(event.data);
        onMessage?.(event.data);
      }
    };

    ws.onerror = (event) => {
      this.errorHandlers.get(id)?.(event);
      onError?.(event);
    };

    ws.onclose = () => {
      this.disconnect(id);
    };

    this.connections.set(id, ws);
    if (onMessage) this.messageHandlers.set(id, onMessage);
    if (onError) this.errorHandlers.set(id, onError);
  }

  disconnect(id: string): void {
    const ws = this.connections.get(id);
    if (ws) {
      ws.close();
      this.connections.delete(id);
      this.messageHandlers.delete(id);
      this.errorHandlers.delete(id);
    }
  }

  send(id: string, data: any): boolean {
    const ws = this.connections.get(id);
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        const message = typeof data === 'string' ? data : JSON.stringify(data);
        ws.send(message);
        return true;
      } catch (error) {
        console.error(`Failed to send message to ${id}:`, error);
        return false;
      }
    }
    return false;
  }

  getConnection(id: string): WebSocket | undefined {
    return this.connections.get(id);
  }

  isConnected(id: string): boolean {
    const ws = this.connections.get(id);
    return ws !== undefined && ws.readyState === WebSocket.OPEN;
  }

  getAllConnections(): string[] {
    return Array.from(this.connections.keys());
  }

  disconnectAll(): void {
    this.connections.forEach((ws, id) => {
      ws.close();
    });
    this.connections.clear();
    this.messageHandlers.clear();
    this.errorHandlers.clear();
  }
}

// Create singleton instance
export const webSocketManager = new WebSocketManager();

export default useWebSocket;