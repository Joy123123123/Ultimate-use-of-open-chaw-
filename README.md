# Multi-Agent Orchestration System

A distributed systems approach to multi-agent orchestration with dependency-aware scheduling, parallel execution, and cascade failure handling.

## 🔥 Features

- **Team Abstraction**: Shared memory + message bus for agent coordination
- **Dependency-Aware Task Queue**: Intelligent scheduling based on task dependencies
- **Parallel Agent Pool**: Concurrent execution with semaphore-based concurrency control
- **Cascade Failure Handling**: Automatic propagation of failures through dependency chains
- **Tool Registry & Dispatch**: Centralized tool management with dynamic dispatch
- **Model-Agnostic LLM Adapters**: Support for OpenAI, Claude, and custom LLM providers
- **In-Process Execution**: Fast, deterministic scheduling without subprocess overhead
- **Production Ready**: Serverless-friendly, easy deployment

## 🏗️ Architecture

```
Orchestrator
  ↓
Team (memory + message bus + task queue)
  ↓
AgentPool (parallel execution with semaphores)
  ↓
Agents (reasoning + tool use)
  ↓
LLM Adapters (OpenAI / Claude / Custom)
  ↓
Tool Registry (shared capabilities)
```

## 📦 Installation

```bash
npm install multi-agent-orchestration
```

> **📱 Mobile Users:**
> - **iPhone/iOS**: Check out our [iPhone Usage Guide](./docs/IPHONE-USAGE-GUIDE.md)
> - **Android**: Check out our [Android Usage Guide](./docs/ANDROID-USAGE-GUIDE.md)
>
> Both guides include free usage instructions and step-by-step setup!

## 🚀 Quick Start

```typescript
import { Orchestrator, ClaudeAdapter } from 'multi-agent-orchestration';

// Create orchestrator
const orchestrator = new Orchestrator();

// Create a team
const team = orchestrator.createTeam('my-team', 5); // max 5 concurrent agents

// Register tools
orchestrator.registerTool({
  name: 'search',
  description: 'Search for information',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string' }
    },
    required: ['query']
  },
  execute: async (params) => {
    // Your search implementation
    return { results: [...] };
  }
});

// Create agents
orchestrator.createAgent('my-team', {
  id: 'researcher-1',
  name: 'Research Agent',
  capabilities: ['research', 'analysis']
}, new ClaudeAdapter({ apiKey: process.env.ANTHROPIC_API_KEY }));

// Submit tasks with dependencies
orchestrator.submitTaskGraph('my-team', [
  {
    id: 'task-1',
    type: 'research',
    payload: { description: 'Research topic A' },
    dependencies: [],
    status: 'pending',
    priority: 10
  },
  {
    id: 'task-2',
    type: 'analysis',
    payload: { description: 'Analyze research findings' },
    dependencies: ['task-1'], // Runs after task-1
    status: 'pending',
    priority: 5
  }
]);

// Execute
const results = await orchestrator.executeTeam('my-team');
console.log(results);
```

## 🎯 Use Cases

- **AI Copilots**: Build intelligent coding assistants with specialized agents
- **Autonomous Workflows**: Orchestrate complex multi-step processes
- **Dev Agents**: Coordinate development, testing, and deployment tasks
- **Research Agents**: Parallel research with synthesis and analysis
- **Multi-Step Reasoning**: Complex problem-solving with dependent subtasks

## 🧩 Core Components

### Orchestrator

Top-level coordination engine that manages teams, tools, and execution.

```typescript
const orchestrator = new Orchestrator();
const team = orchestrator.createTeam('team-name', maxConcurrent);
orchestrator.registerTool(toolDefinition);
orchestrator.createAgent(teamName, agentConfig, llmAdapter);
await orchestrator.executeAll();
```

### Team

Coordination unit with shared memory, message bus, and task queue.

```typescript
// Shared memory
await team.memory.set('key', value);
const value = await team.memory.get('key');

// Message bus
team.messageBus.subscribe('agent-id', (message) => {
  console.log(message);
});

team.messageBus.publish({
  id: 'msg-1',
  from: 'agent-1',
  to: 'agent-2',
  content: { data: 'hello' },
  timestamp: Date.now(),
  type: 'status'
});

// Task queue
team.addTask(task);
await team.executeTasks();
```

### Agent

Individual reasoning unit with LLM and tool access.

```typescript
const agent = new Agent(
  {
    id: 'agent-1',
    name: 'My Agent',
    capabilities: ['coding', 'testing']
  },
  llmAdapter,
  toolRegistry
);

const result = await agent.execute('Complete this task', context);
```

### LLM Adapters

Model-agnostic interfaces for different LLM providers.

```typescript
// OpenAI
const openai = new OpenAIAdapter({
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4-turbo-preview'
});

// Claude
const claude = new ClaudeAdapter({
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-3-5-sonnet-20241022'
});

// Mock (for testing)
const mock = new MockAdapter(['Response 1', 'Response 2']);
```

### Tool Registry

Centralized tool management with dynamic dispatch.

```typescript
const registry = new ToolRegistry();

registry.register({
  name: 'calculator',
  description: 'Perform calculations',
  parameters: { /* JSON schema */ },
  execute: async (params) => { /* implementation */ }
});

const result = await registry.execute('calculator', { expression: '2+2' });
```

## 📊 Task Dependencies & Scheduling

The orchestrator automatically handles task dependencies:

```typescript
const tasks = [
  { id: 'A', dependencies: [], priority: 10 },
  { id: 'B', dependencies: [], priority: 10 },
  { id: 'C', dependencies: ['A', 'B'], priority: 5 }, // Waits for A and B
  { id: 'D', dependencies: ['C'], priority: 1 }       // Waits for C
];

orchestrator.submitTaskGraph('team', tasks);
// Execution order: A and B (parallel) → C → D
```

## 🛡️ Failure Handling

Failures cascade automatically through dependency chains:

```typescript
// If task-1 fails, task-2 and task-3 automatically fail
const tasks = [
  { id: 'task-1', dependencies: [] },
  { id: 'task-2', dependencies: ['task-1'] },
  { id: 'task-3', dependencies: ['task-2'] }
];
```

## 📈 Monitoring & Statistics

```typescript
// Orchestrator stats
const stats = orchestrator.getStats();
// {
//   teams: {
//     'team-name': {
//       tasks: { pending: 2, running: 1, completed: 5, failed: 0 },
//       agents: { totalAgents: 3, activeExecutions: 1, availableSlots: 2 },
//       memory: { keys: 10 }
//     }
//   },
//   totalTools: 5,
//   running: true
// }

// Team stats
const teamStats = team.getStats();

// Agent pool stats
const poolStats = agentPool.getStats();
```

## 🧪 Testing

```typescript
import { MockAdapter } from 'multi-agent-orchestration';

// Simple responses
const mock = new MockAdapter(['Response 1', 'Response 2']);

// Dynamic responses
const mock = new MockAdapter((messages) => {
  return `Responding to: ${messages[messages.length - 1].content}`;
});
```

## 🔧 Advanced Usage

### Custom LLM Adapter

```typescript
import { LLMAdapter, ConversationMessage, LLMResponse } from 'multi-agent-orchestration';

class CustomAdapter implements LLMAdapter {
  async generate(messages: ConversationMessage[]): Promise<LLMResponse> {
    // Your custom LLM integration
    return {
      content: 'Response',
      finishReason: 'stop'
    };
  }
}
```

### Inter-Agent Communication

```typescript
// Agent 1 publishes result
team.messageBus.publish({
  id: 'msg-1',
  from: 'agent-1',
  to: 'agent-2',
  content: { result: 'data' },
  timestamp: Date.now(),
  type: 'result'
});

// Agent 2 subscribes and receives
team.messageBus.subscribe('agent-2', (message) => {
  console.log('Received:', message.content);
});
```

### Shared State

```typescript
// Store team-wide state
await team.memory.set('progress', { completed: 5, total: 10 });

// Update atomically
await team.memory.update('progress', (current) => ({
  ...current,
  completed: current.completed + 1
}));

// Read state
const progress = await team.memory.get('progress');
```

## 🌟 Why This Architecture?

Most "multi-agent frameworks" are just agents calling agents with messy loops. This system is built like a distributed scheduler:

- **Real Scheduling**: Dependency-aware task queue with priority handling
- **Concurrency Control**: Semaphore-based parallel execution limits
- **Failure Isolation**: Cascade failures contained to dependency chains
- **In-Process**: No subprocess spawning, no CLI tools, deterministic execution
- **Production-Ready**: Suitable for serverless, containerized, or traditional deployments

## 📝 Examples

See the `/examples` directory for complete examples:

- `basic-usage.ts`: Simple task execution with dependencies
- More examples coming soon...

## 🤝 Contributing

Contributions welcome! This is an open-source implementation of production-grade multi-agent orchestration patterns.

## 📄 License

MIT

## 🔗 Links

- [GitHub Repository](https://github.com/Joy123123123/Ultimate-use-of-open-chaw-)
- [Issues](https://github.com/Joy123123123/Ultimate-use-of-open-chaw-/issues)

---

**Built for production. Engineered for scale. Open-sourced for the community.**
