import { Agent } from './Agent';
import { Task } from './types';

/**
 * Semaphore for controlling concurrency
 */
class Semaphore {
  private permits: number;
  private waiting: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }

    return new Promise<void>(resolve => {
      this.waiting.push(resolve);
    });
  }

  release(): void {
    const next = this.waiting.shift();
    if (next) {
      next();
    } else {
      this.permits++;
    }
  }

  available(): number {
    return this.permits;
  }
}

/**
 * Agent Pool - Manages parallel agent execution with concurrency control
 */
export class AgentPool {
  private agents: Map<string, Agent> = new Map();
  private semaphore: Semaphore;
  private activeExecutions: Map<string, Promise<any>> = new Map();

  constructor(maxConcurrent: number = 5) {
    this.semaphore = new Semaphore(maxConcurrent);
  }

  /**
   * Register an agent in the pool
   */
  registerAgent(agent: Agent): void {
    this.agents.set(agent.id, agent);
  }

  /**
   * Unregister an agent
   */
  unregisterAgent(agentId: string): boolean {
    return this.agents.delete(agentId);
  }

  /**
   * Get an agent by ID
   */
  getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Find an agent by capability
   */
  findAgentByCapability(capability: string): Agent | undefined {
    return Array.from(this.agents.values()).find(agent =>
      agent.capabilities.includes(capability)
    );
  }

  /**
   * Execute a task with an agent (with concurrency control)
   */
  async executeTask(task: Task, agentId: string): Promise<any> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found in pool`);
    }

    // Acquire semaphore permit
    await this.semaphore.acquire();

    try {
      // Track active execution
      const execution = agent.execute(task.payload.description || JSON.stringify(task.payload), task.payload.context);
      this.activeExecutions.set(task.id, execution);

      const result = await execution;
      return result;
    } finally {
      // Release semaphore permit
      this.semaphore.release();
      this.activeExecutions.delete(task.id);
    }
  }

  /**
   * Execute multiple tasks in parallel (respecting concurrency limits)
   */
  async executeBatch(tasks: Array<{ task: Task; agentId: string }>): Promise<any[]> {
    const promises = tasks.map(({ task, agentId }) =>
      this.executeTask(task, agentId).catch(error => ({
        error: true,
        taskId: task.id,
        message: error.message,
      }))
    );

    return Promise.all(promises);
  }

  /**
   * Get all registered agents
   */
  getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get pool statistics
   */
  getStats(): {
    totalAgents: number;
    activeExecutions: number;
    availableSlots: number;
  } {
    return {
      totalAgents: this.agents.size,
      activeExecutions: this.activeExecutions.size,
      availableSlots: this.semaphore.available(),
    };
  }

  /**
   * Wait for all active executions to complete
   */
  async waitForAll(): Promise<void> {
    const activePromises = Array.from(this.activeExecutions.values());
    await Promise.allSettled(activePromises);
  }
}
