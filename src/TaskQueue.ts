import { Task } from './types';

/**
 * Dependency-aware Task Queue with priority scheduling
 */
export class TaskQueue {
  private tasks: Map<string, Task> = new Map();
  private dependencyGraph: Map<string, Set<string>> = new Map(); // task -> dependencies
  private dependents: Map<string, Set<string>> = new Map(); // task -> dependents

  /**
   * Add a task to the queue
   */
  enqueue(task: Task): void {
    this.tasks.set(task.id, task);

    // Build dependency graph
    if (task.dependencies.length > 0) {
      this.dependencyGraph.set(task.id, new Set(task.dependencies));

      // Track dependents (reverse mapping)
      task.dependencies.forEach(depId => {
        if (!this.dependents.has(depId)) {
          this.dependents.set(depId, new Set());
        }
        this.dependents.get(depId)!.add(task.id);
      });
    }
  }

  /**
   * Get next runnable task (no pending dependencies, highest priority)
   */
  dequeue(): Task | null {
    const runnableTasks = Array.from(this.tasks.values()).filter(task => {
      if (task.status !== 'pending') return false;

      const deps = this.dependencyGraph.get(task.id);
      if (!deps || deps.size === 0) return true;

      // Check if all dependencies are completed
      return Array.from(deps).every(depId => {
        const depTask = this.tasks.get(depId);
        return depTask?.status === 'completed';
      });
    });

    if (runnableTasks.length === 0) return null;

    // Sort by priority (higher priority first)
    runnableTasks.sort((a, b) => b.priority - a.priority);
    return runnableTasks[0];
  }

  /**
   * Update task status
   */
  updateTask(taskId: string, updates: Partial<Task>): void {
    const task = this.tasks.get(taskId);
    if (task) {
      Object.assign(task, updates);
    }
  }

  /**
   * Get a task by ID
   */
  getTask(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Mark task as completed and remove from dependency graph
   */
  complete(taskId: string, result?: any): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = 'completed';
      task.result = result;

      // Remove from dependents' dependency lists
      const dependentTasks = this.dependents.get(taskId);
      if (dependentTasks) {
        dependentTasks.forEach(depTaskId => {
          const deps = this.dependencyGraph.get(depTaskId);
          if (deps) {
            deps.delete(taskId);
          }
        });
      }
    }
  }

  /**
   * Mark task as failed and cascade to dependents
   */
  fail(taskId: string, error: Error): string[] {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = 'failed';
      task.error = error;
    }

    // Cascade failure to all dependent tasks
    const cascadedFailures: string[] = [];
    const toFail = new Set([taskId]);
    const processed = new Set<string>();

    while (toFail.size > 0) {
      const currentId = Array.from(toFail)[0];
      toFail.delete(currentId);

      if (processed.has(currentId)) continue;
      processed.add(currentId);

      const dependentTasks = this.dependents.get(currentId);
      if (dependentTasks) {
        dependentTasks.forEach(depTaskId => {
          const depTask = this.tasks.get(depTaskId);
          if (depTask && depTask.status !== 'failed') {
            depTask.status = 'failed';
            depTask.error = new Error(`Dependency ${currentId} failed: ${error.message}`);
            cascadedFailures.push(depTaskId);
            toFail.add(depTaskId);
          }
        });
      }
    }

    return cascadedFailures;
  }

  /**
   * Get all tasks
   */
  getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Get tasks by status
   */
  getTasksByStatus(status: Task['status']): Task[] {
    return Array.from(this.tasks.values()).filter(t => t.status === status);
  }

  /**
   * Check if all tasks are completed or failed
   */
  isComplete(): boolean {
    return Array.from(this.tasks.values()).every(
      task => task.status === 'completed' || task.status === 'failed'
    );
  }

  /**
   * Get queue statistics
   */
  getStats(): { pending: number; running: number; completed: number; failed: number } {
    const stats = { pending: 0, running: 0, completed: 0, failed: 0 };
    this.tasks.forEach(task => {
      stats[task.status]++;
    });
    return stats;
  }
}
