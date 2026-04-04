import { SharedMemory } from '../SharedMemory';

describe('SharedMemory', () => {
  let memory: SharedMemory;

  beforeEach(() => {
    memory = new SharedMemory();
  });

  describe('basic operations', () => {
    it('should set and get values', async () => {
      await memory.set('key1', 'value1');
      const value = await memory.get('key1');
      expect(value).toBe('value1');
    });

    it('should return undefined for non-existent keys', async () => {
      const value = await memory.get('nonexistent');
      expect(value).toBeUndefined();
    });

    it('should check if key exists', async () => {
      await memory.set('key1', 'value1');
      expect(await memory.has('key1')).toBe(true);
      expect(await memory.has('key2')).toBe(false);
    });

    it('should delete keys', async () => {
      await memory.set('key1', 'value1');
      const deleted = await memory.delete('key1');
      expect(deleted).toBe(true);
      expect(await memory.has('key1')).toBe(false);
    });

    it('should store complex objects', async () => {
      const obj = { nested: { data: [1, 2, 3] } };
      await memory.set('complex', obj);
      const retrieved = await memory.get('complex');
      expect(retrieved).toEqual(obj);
    });
  });

  describe('atomic updates', () => {
    it('should update values atomically', async () => {
      await memory.set('counter', 0);

      const updated = await memory.update('counter', (current) => {
        return (current || 0) + 1;
      });

      expect(updated).toBe(1);
      expect(await memory.get('counter')).toBe(1);
    });

    it('should handle updates on non-existent keys', async () => {
      const updated = await memory.update('new-key', (current) => {
        return current === undefined ? 'initialized' : current;
      });

      expect(updated).toBe('initialized');
    });
  });

  describe('utility methods', () => {
    it('should list all keys', async () => {
      await memory.set('key1', 'value1');
      await memory.set('key2', 'value2');
      await memory.set('key3', 'value3');

      const keys = memory.keys();
      expect(keys).toHaveLength(3);
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys).toContain('key3');
    });

    it('should clear all memory', async () => {
      await memory.set('key1', 'value1');
      await memory.set('key2', 'value2');

      memory.clear();

      expect(memory.keys()).toHaveLength(0);
      expect(await memory.get('key1')).toBeUndefined();
    });
  });
});
