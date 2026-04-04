/**
 * Shared Memory - Thread-safe key-value store for team state
 */
export class SharedMemory {
  private store: Map<string, any> = new Map();
  private locks: Map<string, Promise<void>> = new Map();

  /**
   * Set a value in shared memory
   */
  async set(key: string, value: any): Promise<void> {
    await this.waitForLock(key);
    this.store.set(key, value);
  }

  /**
   * Get a value from shared memory
   */
  async get<T = any>(key: string): Promise<T | undefined> {
    await this.waitForLock(key);
    return this.store.get(key);
  }

  /**
   * Check if key exists
   */
  async has(key: string): Promise<boolean> {
    await this.waitForLock(key);
    return this.store.has(key);
  }

  /**
   * Delete a key
   */
  async delete(key: string): Promise<boolean> {
    await this.waitForLock(key);
    return this.store.delete(key);
  }

  /**
   * Update a value atomically
   */
  async update<T>(key: string, updater: (current: T | undefined) => T): Promise<T> {
    const lock = this.acquireLock(key);
    try {
      await this.waitForLock(key);
      const current = this.store.get(key);
      const updated = updater(current);
      this.store.set(key, updated);
      return updated;
    } finally {
      this.releaseLock(key);
    }
  }

  /**
   * Get all keys
   */
  keys(): string[] {
    return Array.from(this.store.keys());
  }

  /**
   * Clear all memory
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Acquire a lock for a key
   */
  private acquireLock(key: string): Promise<void> {
    const lock = new Promise<void>(resolve => {
      setTimeout(resolve, 0);
    });
    this.locks.set(key, lock);
    return lock;
  }

  /**
   * Release a lock for a key
   */
  private releaseLock(key: string): void {
    this.locks.delete(key);
  }

  /**
   * Wait for any existing lock to be released
   */
  private async waitForLock(key: string): Promise<void> {
    const existingLock = this.locks.get(key);
    if (existingLock) {
      await existingLock;
    }
  }
}
