export type WsStatus = 'Connecting' | 'Connected' | 'Disconnected';

type StatusListener = (status: WsStatus) => void;
type MessageListener = (data: any) => void;

class WebSocketService {
    private socket: WebSocket | null = null;
    private status: WsStatus = 'Disconnected';
    private statusListeners: Set<StatusListener> = new Set();
    private messageListeners: Set<MessageListener> = new Set();
    private messageQueue: string[] = [];

    public connect() {
        if (this.socket && this.socket.readyState < 2) return;

        const wsUrl = import.meta.env.VITE_NITROLITE_WS_URL;

        if (!wsUrl) {
            console.error('VITE_NITROLITE_WS_URL is not set');
            this.updateStatus('Disconnected');
            return;
        }

        this.updateStatus('Connecting');

        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
            console.log('WebSocket Connected');
            this.updateStatus('Connected');
            this.messageQueue.forEach((msg) => this.socket?.send(msg));
            this.messageQueue = [];
        };

        this.socket.onmessage = (event) => {
            console.log('📨 WebSocket message received:', event.data);
            
            try {
                const data = JSON.parse(event.data);
                console.log('🔍 Parsed message:', data);
                console.log('👥 Notifying', this.messageListeners.size, 'listeners...');
                this.messageListeners.forEach((listener) => listener(data));
            } catch (error) {
                console.error('❌ Error parsing message:', error);
            }
        };

        this.socket.onclose = () => this.updateStatus('Disconnected');

        this.socket.onerror = () => this.updateStatus('Disconnected');
    }

    public send(payload: string) {
        console.log('📤 WebSocket send called. Status:', this.socket?.readyState);
        console.log('📦 Payload preview:', payload.substring(0, 200) + '...');
        
        if (this.socket?.readyState === WebSocket.OPEN) {
            console.log('✅ WebSocket is open, sending message...');
            this.socket.send(payload);
        } else {
            console.log('⏳ WebSocket not ready, queueing message. Current state:', this.socket?.readyState);
            this.messageQueue.push(payload);
        }
    }

    private updateStatus(newStatus: WsStatus) {
        this.status = newStatus;
        this.statusListeners.forEach((listener) => listener(this.status));
    }

    public addStatusListener(listener: StatusListener) {
        this.statusListeners.add(listener);
        listener(this.status);
    }

    public removeStatusListener(listener: StatusListener) {
        this.statusListeners.delete(listener);
    }

    public addMessageListener(listener: MessageListener) {
        this.messageListeners.add(listener);
    }

    public removeMessageListener(listener: MessageListener) {
        this.messageListeners.delete(listener);
    }
}

export const webSocketService = new WebSocketService();
