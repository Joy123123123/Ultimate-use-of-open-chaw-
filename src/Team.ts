import { MessageBus } from './MessageBus';
import { SharedMemory } from './SharedMemory';
import { TaskQueue } from './TaskQueue';
import { AgentPool } from './AgentPool';
import { TeamConfig, Task } from './types';

/**
 * Team - Coordination unit with shared memory, message bus, and task queue
 */
export class Team {
  public readonly name: string;
  public readonly memory: SharedMemory;
  public readonly messageBus: MessageBus;
  public readonly taskQueue: TaskQueue;
  public readonly agentPool: AgentPool;

  constructor(config: TeamConfig) {
    this.name = config.name;
    this.memory = new SharedMemory();
    this.messageBus = new MessageBus();
    this.taskQueue = new TaskQueue();
    this.agentPool = new AgentPool(config.maxConcurrentAgents);
  }

  /**
   * Add a task to the team's queue
   */
  addTask(task: Task): void {
    this.taskQueue.enqueue(task);
  }

  /**
   * Execute all tasks in the queue
   */
  async executeTasks(): Promise<Map<string, any>> {
    const results = new Map<string, any>();

    while (!this.taskQueue.isComplete()) {
      const task = this.taskQueue.dequeue();

      if (!task) {
        // No runnable tasks, wait a bit
        await new Promise(resolve => setTimeout(resolve, 100));
        continue;
      }

      // Mark as running
      this.taskQueue.updateTask(task.id, { status: 'running' });

      try {
        // Find appropriate agent
        const agent = task.assignedTo
          ? this.agentPool.getAgent(task.assignedTo)
          : this.agentPool.findAgentByCapability(task.type);

        if (!agent) {
          throw new Error(`No agent found for task ${task.id} with type ${task.type}`);
        }

        // Execute task
        const result = await this.agentPool.executeTask(task, agent.id);

        // Mark as completed
        this.taskQueue.complete(task.id, result);
        results.set(task.id, result);

        // Publish completion message
        this.messageBus.publish({
          id: `${task.id}-complete`,
          from: agent.id,
          content: { taskId: task.id, result },
          timestamp: Date.now(),
          type: 'result',
        });
      } catch (error) {
        // Mark as failed and cascade
        const cascadedFailures = this.taskQueue.fail(task.id, error as Error);

        // Publish error message
        this.messageBus.publish({
          id: `${task.id}-error`,
          from: 'system',
          content: { taskId: task.id, error: (error as Error).message, cascaded: cascadedFailures },
          timestamp: Date.now(),
          type: 'error',
        });

        results.set(task.id, { error: (error as Error).message });
      }
    }

    return results;
  }

  /**
   * Get team statistics
   */
  getStats(): {
    tasks: { pending: number; running: number; completed: number; failed: number };
    agents: { totalAgents: number; activeExecutions: number; availableSlots: number };
    memory: { keys: number };
  } {
    return {
      tasks: this.taskQueue.getStats(),
      agents: this.agentPool.getStats(),
      memory: { keys: this.memory.keys().length },
    };
  }
}
