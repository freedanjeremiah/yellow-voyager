// WebSocket service for Nitrolite communication
import { webSocketService } from '../lib/websocket';
import type { WsStatus } from '../lib/websocket';

export class NitroliteWebSocket {
  private isConnected = false;

  constructor() {
    // Monitor connection status
    webSocketService.addStatusListener((status: WsStatus) => {
      this.isConnected = status === 'Connected';
      if (status === 'Connected') {
        console.log('Nitrolite WebSocket connected');
      } else if (status === 'Disconnected') {
        console.log('Nitrolite WebSocket disconnected');
      }
    });
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnected) {
        resolve();
        return;
      }

      const statusListener = (status: WsStatus) => {
        if (status === 'Connected') {
          webSocketService.removeStatusListener(statusListener);
          resolve();
        } else if (status === 'Disconnected' && !this.isConnected) {
          webSocketService.removeStatusListener(statusListener);
          reject(new Error('WebSocket connection failed'));
        }
      };

      webSocketService.addStatusListener(statusListener);
      webSocketService.connect();
    });
  }

  send(message: any): void {
    if (!this.isConnected) {
      console.warn('WebSocket not connected, message will be queued');
    }
    webSocketService.send(JSON.stringify(message));
  }

  onMessage(callback: (data: any) => void): void {
    webSocketService.addMessageListener(callback);
  }

  offMessage(callback: (data: any) => void): void {
    webSocketService.removeMessageListener(callback);
  }

  get connected(): boolean {
    return this.isConnected;
  }
}

// Export singleton instance
export const nitroliteWebSocket = new NitroliteWebSocket();
export default nitroliteWebSocket;