# API Reference

## Orchestrator

The top-level coordination engine.

### Constructor

```typescript
new Orchestrator()
```

Creates a new orchestrator instance.

### Methods

#### `createTeam(name: string, maxConcurrentAgents: number): Team`

Creates a new team with the specified name and concurrency limit.

**Parameters:**
- `name`: Unique team identifier
- `maxConcurrentAgents`: Maximum number of agents that can execute simultaneously

**Returns:** Team instance

**Throws:** Error if team already exists

#### `getTeam(name: string): Team | undefined`

Retrieves a team by name.

#### `registerTool(tool: ToolDefinition): void`

Registers a global tool available to all agents.

**Parameters:**
- `tool`: Tool definition with name, description, parameters, and execute function

#### `createAgent(teamName: string, config: AgentConfig, llm: LLMAdapter): Agent`

Creates and registers an agent in a team.

**Parameters:**
- `teamName`: Team to add the agent to
- `config`: Agent configuration
- `llm`: LLM adapter for the agent

**Returns:** Agent instance

#### `submitTask(teamName: string, task: Task): void`

Submits a single task to a team's queue.

#### `submitTaskGraph(teamName: string, tasks: Task[]): void`

Submits multiple interdependent tasks to a team.

**Validates:** All dependencies exist in the task set

#### `executeTeam(teamName: string): Promise<Map<string, any>>`

Executes all tasks for a specific team.

**Returns:** Map of task IDs to results

#### `executeAll(): Promise<Map<string, Map<string, any>>>`

Executes all teams in parallel.

**Returns:** Map of team names to their task results

#### `getStats(): object`

Returns comprehensive statistics about the orchestrator state.

#### `isRunning(): boolean`

Checks if the orchestrator is currently executing tasks.

#### `getAllTeams(): Team[]`

Returns all registered teams.

#### `removeTeam(name: string): boolean`

Removes a team from the orchestrator.

#### `reset(): void`

Clears all teams and resets orchestrator state.

---

## Team

Coordination unit with shared resources.

### Properties

- `name: string` - Team name
- `memory: SharedMemory` - Shared key-value store
- `messageBus: MessageBus` - Inter-agent communication
- `taskQueue: TaskQueue` - Dependency-aware task scheduler
- `agentPool: AgentPool` - Agent execution manager

### Methods

#### `addTask(task: Task): void`

Adds a task to the team's queue.

#### `executeTasks(): Promise<Map<string, any>>`

Executes all tasks in the queue, respecting dependencies.

#### `getStats(): object`

Returns statistics about tasks, agents, and memory usage.

---

## Agent

Individual reasoning unit with LLM capabilities.

### Properties

- `id: string` - Unique agent identifier
- `name: string` - Human-readable name
- `capabilities: string[]` - Agent capabilities/tags

### Methods

#### `execute(taskDescription: string, context?: any): Promise<any>`

Executes a task using LLM reasoning and tools.

**Parameters:**
- `taskDescription`: What the agent should do
- `context`: Optional additional context

**Returns:** Task result

#### `reset(): void`

Clears conversation history.

#### `getConversation(): ConversationMessage[]`

Returns the agent's conversation history.

---

## SharedMemory

Thread-safe key-value store.

### Methods

#### `set(key: string, value: any): Promise<void>`

Sets a value in memory.

#### `get<T>(key: string): Promise<T | undefined>`

Gets a value from memory.

#### `has(key: string): Promise<boolean>`

Checks if a key exists.

#### `delete(key: string): Promise<boolean>`

Removes a key from memory.

#### `update<T>(key: string, updater: (current: T | undefined) => T): Promise<T>`

Atomically updates a value.

**Example:**
```typescript
await memory.update('counter', (current) => (current || 0) + 1);
```

#### `keys(): string[]`

Returns all keys in memory.

#### `clear(): void`

Removes all keys from memory.

---

## MessageBus

Pub/sub messaging system.

### Methods

#### `subscribe(agentId: string, callback: (message: Message) => void): () => void`

Subscribes to messages for a specific agent or '*' for all.

**Returns:** Unsubscribe function

**Example:**
```typescript
const unsubscribe = bus.subscribe('agent-1', (msg) => {
  console.log(msg);
});

// Later...
unsubscribe();
```

#### `publish(message: Message): void`

Publishes a message to the bus.

#### `getHistory(filter?: Partial<Message>): Message[]`

Gets message history, optionally filtered.

#### `clearHistory(): void`

Clears all message history.

---

## TaskQueue

Dependency-aware task scheduler.

### Methods

#### `enqueue(task: Task): void`

Adds a task to the queue.

#### `dequeue(): Task | null`

Gets the next runnable task (no pending dependencies, highest priority).

#### `updateTask(taskId: string, updates: Partial<Task>): void`

Updates task properties.

#### `getTask(taskId: string): Task | undefined`

Retrieves a task by ID.

#### `complete(taskId: string, result?: any): void`

Marks a task as completed and updates dependency graph.

#### `fail(taskId: string, error: Error): string[]`

Marks a task as failed and cascades to dependents.

**Returns:** Array of cascaded failure task IDs

#### `getAllTasks(): Task[]`

Returns all tasks in the queue.

#### `getTasksByStatus(status: TaskStatus): Task[]`

Returns tasks with a specific status.

#### `isComplete(): boolean`

Checks if all tasks are completed or failed.

#### `getStats(): object`

Returns task statistics by status.

---

## AgentPool

Manages parallel agent execution.

### Methods

#### `registerAgent(agent: Agent): void`

Registers an agent in the pool.

#### `unregisterAgent(agentId: string): boolean`

Removes an agent from the pool.

#### `getAgent(agentId: string): Agent | undefined`

Retrieves an agent by ID.

#### `findAgentByCapability(capability: string): Agent | undefined`

Finds an agent with a specific capability.

#### `executeTask(task: Task, agentId: string): Promise<any>`

Executes a task with an agent (with concurrency control).

#### `executeBatch(tasks: Array<{task: Task, agentId: string}>): Promise<any[]>`

Executes multiple tasks in parallel.

#### `getAllAgents(): Agent[]`

Returns all registered agents.

#### `getStats(): object`

Returns pool statistics.

#### `waitForAll(): Promise<void>`

Waits for all active executions to complete.

---

## ToolRegistry

Central registry for agent tools.

### Methods

#### `register(tool: ToolDefinition): void`

Registers a new tool.

**Throws:** Error if tool name already exists

#### `unregister(name: string): boolean`

Removes a tool from the registry.

#### `getTool(name: string): ToolDefinition | undefined`

Retrieves a tool by name.

#### `getAllTools(): ToolDefinition[]`

Returns all registered tools.

#### `getToolsByCapability(capability: string): ToolDefinition[]`

Finds tools by capability (searches description).

#### `execute(name: string, params: any): Promise<any>`

Executes a tool with parameters.

#### `hasTool(name: string): boolean`

Checks if a tool exists.

#### `size(): number`

Returns the number of registered tools.

---

## LLM Adapters

### OpenAIAdapter

```typescript
new OpenAIAdapter({
  apiKey: string,
  model?: string,
  baseURL?: string
})
```

**Default model:** `gpt-4-turbo-preview`

### ClaudeAdapter

```typescript
new ClaudeAdapter({
  apiKey: string,
  model?: string,
  baseURL?: string
})
```

**Default model:** `claude-3-5-sonnet-20241022`

### MockAdapter

```typescript
new MockAdapter(
  responses: string[] | ((messages: ConversationMessage[]) => string)
)
```

For testing without API calls.

**Methods:**
- `getCallCount(): number` - Number of times generate was called
- `reset(): void` - Reset call count

---

## Types

### Task

```typescript
interface Task {
  id: string;
  type: string;
  payload: any;
  dependencies: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: Error;
  assignedTo?: string;
  priority: number;
}
```

### AgentConfig

```typescript
interface AgentConfig {
  id: string;
  name: string;
  capabilities: string[];
  model?: string;
  systemPrompt?: string;
  maxConcurrent?: number;
}
```

### ToolDefinition

```typescript
interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>; // JSON Schema
  execute: (params: any) => Promise<any>;
}
```

### Message

```typescript
interface Message {
  id: string;
  from: string;
  to?: string;
  content: any;
  timestamp: number;
  type: 'task' | 'result' | 'error' | 'status';
}
```

### ConversationMessage

```typescript
interface ConversationMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
```

### LLMResponse

```typescript
interface LLMResponse {
  content: string;
  toolCalls?: Array<{
    name: string;
    arguments: any;
  }>;
  finishReason: 'stop' | 'tool_calls' | 'length';
}
```

### LLMAdapter

```typescript
interface LLMAdapter {
  generate(
    messages: ConversationMessage[],
    tools?: ToolDefinition[]
  ): Promise<LLMResponse>;
}
```
