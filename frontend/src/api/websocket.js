class WebSocketManager {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.status = 'DISCONNECTED';
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.baseDelay = 1000;
    this.onMessageCallback = null;
    this.onStatusChangeCallback = null;
    this.shouldReconnect = true;
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.updateStatus('CONNECTING');
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.updateStatus('CONNECTED');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        if (this.onMessageCallback) {
          try {
            const data = JSON.parse(event.data);
            this.onMessageCallback(data);
          } catch (e) {
            console.error('Error parsing WS message:', e);
          }
        }
      };

      this.ws.onclose = () => {
        this.updateStatus('DISCONNECTED');
        this.handleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket Error:', error);
        this.ws.close();
      };
    } catch (e) {
      console.error('Failed to create WebSocket:', e);
      this.updateStatus('DISCONNECTED');
      this.handleReconnect();
    }
  }

  handleReconnect() {
    if (!this.shouldReconnect) return;

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.updateStatus('RECONNECTING');
      const delay = Math.min(this.baseDelay * Math.pow(1.5, this.reconnectAttempts), 10000);
      this.reconnectAttempts++;
      setTimeout(() => this.connect(), delay);
    } else {
      this.updateStatus('DISCONNECTED');
    }
  }

  disconnect() {
    this.shouldReconnect = false;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.updateStatus('DISCONNECTED');
  }

  updateStatus(newStatus) {
    this.status = newStatus;
    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback(newStatus);
    }
  }

  onMessage(callback) {
    this.onMessageCallback = callback;
  }

  onStatusChange(callback) {
    this.onStatusChangeCallback = callback;
  }
}

export default WebSocketManager;
