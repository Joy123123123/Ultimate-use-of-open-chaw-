import { TaskQueue } from '../TaskQueue';
import { Task } from '../types';

describe('TaskQueue', () => {
  let queue: TaskQueue;

  beforeEach(() => {
    queue = new TaskQueue();
  });

  describe('enqueue and dequeue', () => {
    it('should enqueue and dequeue tasks', () => {
      const task: Task = {
        id: 'task-1',
        type: 'test',
        payload: {},
        dependencies: [],
        status: 'pending',
        priority: 10,
      };

      queue.enqueue(task);
      const dequeued = queue.dequeue();

      expect(dequeued).toEqual(task);
    });

    it('should return null when queue is empty', () => {
      const dequeued = queue.dequeue();
      expect(dequeued).toBeNull();
    });

    it('should respect priority order', () => {
      const lowPriority: Task = {
        id: 'low',
        type: 'test',
        payload: {},
        dependencies: [],
        status: 'pending',
        priority: 1,
      };

      const highPriority: Task = {
        id: 'high',
        type: 'test',
        payload: {},
        dependencies: [],
        status: 'pending',
        priority: 10,
      };

      queue.enqueue(lowPriority);
      queue.enqueue(highPriority);

      const first = queue.dequeue();
      expect(first?.id).toBe('high');
    });
  });

  describe('dependencies', () => {
    it('should not dequeue tasks with pending dependencies', () => {
      const task1: Task = {
        id: 'task-1',
        type: 'test',
        payload: {},
        dependencies: [],
        status: 'pending',
        priority: 10,
      };

      const task2: Task = {
        id: 'task-2',
        type: 'test',
        payload: {},
        dependencies: ['task-1'],
        status: 'pending',
        priority: 10,
      };

      queue.enqueue(task1);
      queue.enqueue(task2);

      const first = queue.dequeue();
      expect(first?.id).toBe('task-1');

      const second = queue.dequeue();
      expect(second).toBeNull(); // task-2 still has pending dependency
    });

    it('should dequeue tasks when dependencies are completed', () => {
      const task1: Task = {
        id: 'task-1',
        type: 'test',
        payload: {},
        dependencies: [],
        status: 'pending',
        priority: 10,
      };

      const task2: Task = {
        id: 'task-2',
        type: 'test',
        payload: {},
        dependencies: ['task-1'],
        status: 'pending',
        priority: 10,
      };

      queue.enqueue(task1);
      queue.enqueue(task2);

      queue.dequeue(); // Get task-1
      queue.complete('task-1', 'result');

      const next = queue.dequeue();
      expect(next?.id).toBe('task-2');
    });
  });

  describe('failure handling', () => {
    it('should cascade failures to dependent tasks', () => {
      const task1: Task = {
        id: 'task-1',
        type: 'test',
        payload: {},
        dependencies: [],
        status: 'pending',
        priority: 10,
      };

      const task2: Task = {
        id: 'task-2',
        type: 'test',
        payload: {},
        dependencies: ['task-1'],
        status: 'pending',
        priority: 10,
      };

      const task3: Task = {
        id: 'task-3',
        type: 'test',
        payload: {},
        dependencies: ['task-2'],
        status: 'pending',
        priority: 10,
      };

      queue.enqueue(task1);
      queue.enqueue(task2);
      queue.enqueue(task3);

      const cascaded = queue.fail('task-1', new Error('Test failure'));

      expect(cascaded).toContain('task-2');
      expect(cascaded).toContain('task-3');

      const task2Status = queue.getTask('task-2');
      expect(task2Status?.status).toBe('failed');
    });
  });

  describe('statistics', () => {
    it('should return correct stats', () => {
      queue.enqueue({
        id: 'task-1',
        type: 'test',
        payload: {},
        dependencies: [],
        status: 'pending',
        priority: 10,
      });

      queue.enqueue({
        id: 'task-2',
        type: 'test',
        payload: {},
        dependencies: [],
        status: 'running',
        priority: 10,
      });

      const stats = queue.getStats();
      expect(stats.pending).toBe(1);
      expect(stats.running).toBe(1);
    });

    it('should detect completion', () => {
      const task: Task = {
        id: 'task-1',
        type: 'test',
        payload: {},
        dependencies: [],
        status: 'pending',
        priority: 10,
      };

      queue.enqueue(task);
      expect(queue.isComplete()).toBe(false);

      queue.complete('task-1', 'result');
      expect(queue.isComplete()).toBe(true);
    });
  });
});
