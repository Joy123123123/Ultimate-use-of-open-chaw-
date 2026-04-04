import { Message } from './types';

/**
 * Message Bus - Pub/Sub system for inter-agent communication
 */
export class MessageBus {
  private subscribers: Map<string, Set<(message: Message) => void>> = new Map();
  private messageHistory: Message[] = [];
  private maxHistory: number = 1000;

  /**
   * Subscribe to messages for a specific agent or broadcast
   */
  subscribe(agentId: string, callback: (message: Message) => void): () => void {
    if (!this.subscribers.has(agentId)) {
      this.subscribers.set(agentId, new Set());
    }
    this.subscribers.get(agentId)!.add(callback);

    // Return unsubscribe function
    return () => {
      const subs = this.subscribers.get(agentId);
      if (subs) {
        subs.delete(callback);
        if (subs.size === 0) {
          this.subscribers.delete(agentId);
        }
      }
    };
  }

  /**
   * Publish a message to the bus
   */
  publish(message: Message): void {
    // Store in history
    this.messageHistory.push(message);
    if (this.messageHistory.length > this.maxHistory) {
      this.messageHistory.shift();
    }

    // Deliver to specific recipient
    if (message.to) {
      const subs = this.subscribers.get(message.to);
      if (subs) {
        subs.forEach(callback => callback(message));
      }
    }

    // Deliver to broadcast subscribers
    const broadcastSubs = this.subscribers.get('*');
    if (broadcastSubs) {
      broadcastSubs.forEach(callback => callback(message));
    }
  }

  /**
   * Get message history, optionally filtered
   */
  getHistory(filter?: Partial<Message>): Message[] {
    if (!filter) return [...this.messageHistory];

    return this.messageHistory.filter(msg => {
      return Object.entries(filter).every(([key, value]) => {
        return (msg as any)[key] === value;
      });
    });
  }

  /**
   * Clear message history
   */
  clearHistory(): void {
    this.messageHistory = [];
  }
}
