import { MessageBus } from '../MessageBus';
import { Message } from '../types';

describe('MessageBus', () => {
  let bus: MessageBus;

  beforeEach(() => {
    bus = new MessageBus();
  });

  describe('publish and subscribe', () => {
    it('should deliver messages to specific subscribers', (done) => {
      const message: Message = {
        id: 'msg-1',
        from: 'agent-1',
        to: 'agent-2',
        content: 'test message',
        timestamp: Date.now(),
        type: 'status',
      };

      bus.subscribe('agent-2', (msg) => {
        expect(msg).toEqual(message);
        done();
      });

      bus.publish(message);
    });

    it('should deliver broadcast messages', (done) => {
      const message: Message = {
        id: 'msg-1',
        from: 'agent-1',
        content: 'broadcast',
        timestamp: Date.now(),
        type: 'status',
      };

      bus.subscribe('*', (msg) => {
        expect(msg).toEqual(message);
        done();
      });

      bus.publish(message);
    });

    it('should allow unsubscribe', () => {
      let callCount = 0;

      const unsubscribe = bus.subscribe('agent-1', () => {
        callCount++;
      });

      bus.publish({
        id: 'msg-1',
        from: 'system',
        to: 'agent-1',
        content: 'test',
        timestamp: Date.now(),
        type: 'status',
      });

      expect(callCount).toBe(1);

      unsubscribe();

      bus.publish({
        id: 'msg-2',
        from: 'system',
        to: 'agent-1',
        content: 'test',
        timestamp: Date.now(),
        type: 'status',
      });

      expect(callCount).toBe(1); // Should not increment
    });
  });

  describe('message history', () => {
    it('should store message history', () => {
      const message1: Message = {
        id: 'msg-1',
        from: 'agent-1',
        content: 'first',
        timestamp: Date.now(),
        type: 'status',
      };

      const message2: Message = {
        id: 'msg-2',
        from: 'agent-2',
        content: 'second',
        timestamp: Date.now(),
        type: 'status',
      };

      bus.publish(message1);
      bus.publish(message2);

      const history = bus.getHistory();
      expect(history).toHaveLength(2);
      expect(history[0]).toEqual(message1);
      expect(history[1]).toEqual(message2);
    });

    it('should filter message history', () => {
      bus.publish({
        id: 'msg-1',
        from: 'agent-1',
        content: 'test',
        timestamp: Date.now(),
        type: 'status',
      });

      bus.publish({
        id: 'msg-2',
        from: 'agent-2',
        content: 'test',
        timestamp: Date.now(),
        type: 'error',
      });

      const filtered = bus.getHistory({ type: 'error' });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('msg-2');
    });

    it('should clear history', () => {
      bus.publish({
        id: 'msg-1',
        from: 'agent-1',
        content: 'test',
        timestamp: Date.now(),
        type: 'status',
      });

      bus.clearHistory();
      expect(bus.getHistory()).toHaveLength(0);
    });
  });
});
