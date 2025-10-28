import { io, Socket } from 'socket.io-client';

type EventCallback = (data?: any) => void;

export class WebSocketClient {
  private socket: Socket;
  private listeners: Map<string, EventCallback[]> = new Map();

  constructor(url: string) {
    this.socket = io(url, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      reconnectionAttempts: Infinity,
    });

    this.setupSocketListeners();
  }

  private setupSocketListeners() {
    this.socket.on('connect', () => {
      console.log('Socket.IO connected');
      this.emit('connected');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket.IO disconnected');
      this.emit('disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
      this.emit('error', error);
    });

    // Listen to all events from backend
    this.socket.onAny((eventName, ...args) => {
      const data = args[0];
      console.log(`Received event: ${eventName}`, data);
      this.emit(eventName, data);
    });
  }

  on(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: EventCallback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  send(data: any) {
    if (data.type) {
      this.socket.emit(data.type, data);
    } else {
      console.warn('Message must have a type property');
    }
  }

  disconnect() {
    this.socket.disconnect();
  }
}
