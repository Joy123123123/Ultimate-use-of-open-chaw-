import { Orchestrator, MockAdapter, Task } from '../src';

/**
 * Basic Example: Simple task execution with dependency handling
 */
async function basicExample() {
  console.log('=== Basic Example ===\n');

  // Create orchestrator
  const orchestrator = new Orchestrator();

  // Create a team
  const team = orchestrator.createTeam('research-team', 3);

  // Register some tools
  orchestrator.registerTool({
    name: 'search',
    description: 'Search for information on the internet',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string' },
      },
      required: ['query'],
    },
    execute: async (params) => {
      return { results: [`Result for: ${params.query}`] };
    },
  });

  orchestrator.registerTool({
    name: 'calculate',
    description: 'Perform mathematical calculations',
    parameters: {
      type: 'object',
      properties: {
        expression: { type: 'string' },
      },
      required: ['expression'],
    },
    execute: async (params) => {
      return { result: eval(params.expression) };
    },
  });

  // Create agents with different capabilities
  orchestrator.createAgent(
    'research-team',
    {
      id: 'researcher-1',
      name: 'Research Agent',
      capabilities: ['research', 'analysis'],
    },
    new MockAdapter(['Research complete: Found relevant information'])
  );

  orchestrator.createAgent(
    'research-team',
    {
      id: 'analyst-1',
      name: 'Analysis Agent',
      capabilities: ['analysis', 'computation'],
    },
    new MockAdapter(['Analysis complete: Data processed successfully'])
  );

  // Create tasks with dependencies
  const tasks: Task[] = [
    {
      id: 'task-1',
      type: 'research',
      payload: { description: 'Research AI multi-agent systems' },
      dependencies: [],
      status: 'pending',
      priority: 10,
    },
    {
      id: 'task-2',
      type: 'research',
      payload: { description: 'Research distributed systems' },
      dependencies: [],
      status: 'pending',
      priority: 10,
    },
    {
      id: 'task-3',
      type: 'analysis',
      payload: { description: 'Analyze research findings' },
      dependencies: ['task-1', 'task-2'], // Depends on both research tasks
      status: 'pending',
      priority: 5,
    },
  ];

  // Submit task graph
  orchestrator.submitTaskGraph('research-team', tasks);

  // Execute and get results
  console.log('Executing tasks...\n');
  const results = await orchestrator.executeTeam('research-team');

  console.log('Results:');
  results.forEach((result, taskId) => {
    console.log(`${taskId}: ${JSON.stringify(result)}`);
  });

  console.log('\nStats:', JSON.stringify(orchestrator.getStats(), null, 2));
}

/**
 * Advanced Example: Multi-team coordination with shared memory
 */
async function advancedExample() {
  console.log('\n\n=== Advanced Example ===\n');

  const orchestrator = new Orchestrator();

  // Create multiple teams
  const devTeam = orchestrator.createTeam('dev-team', 2);
  const qaTeam = orchestrator.createTeam('qa-team', 2);

  // Register tools
  orchestrator.registerTool({
    name: 'write_code',
    description: 'Write code for a feature',
    parameters: {
      type: 'object',
      properties: {
        feature: { type: 'string' },
      },
    },
    execute: async (params) => {
      return { code: `// Code for ${params.feature}` };
    },
  });

  orchestrator.registerTool({
    name: 'run_tests',
    description: 'Run tests on code',
    parameters: {
      type: 'object',
      properties: {
        code: { type: 'string' },
      },
    },
    execute: async (params) => {
      return { passed: true, coverage: 95 };
    },
  });

  // Create agents
  orchestrator.createAgent(
    'dev-team',
    {
      id: 'dev-1',
      name: 'Developer',
      capabilities: ['coding', 'development'],
    },
    new MockAdapter(['Feature implementation complete'])
  );

  orchestrator.createAgent(
    'qa-team',
    {
      id: 'qa-1',
      name: 'QA Engineer',
      capabilities: ['testing', 'quality-assurance'],
    },
    new MockAdapter(['All tests passed'])
  );

  // Use shared memory for coordination
  await devTeam.memory.set('project', 'Multi-Agent System');
  await devTeam.memory.set('sprint', 1);

  // Subscribe to messages
  devTeam.messageBus.subscribe('*', (message) => {
    console.log(`[MESSAGE] ${message.type}: ${JSON.stringify(message.content)}`);
  });

  // Submit tasks to dev team
  orchestrator.submitTask('dev-team', {
    id: 'dev-task-1',
    type: 'coding',
    payload: { description: 'Implement authentication feature' },
    dependencies: [],
    status: 'pending',
    priority: 10,
  });

  // Submit tasks to QA team
  orchestrator.submitTask('qa-team', {
    id: 'qa-task-1',
    type: 'testing',
    payload: { description: 'Test authentication feature' },
    dependencies: [],
    status: 'pending',
    priority: 5,
  });

  // Execute all teams in parallel
  console.log('Executing all teams...\n');
  const allResults = await orchestrator.executeAll();

  console.log('\nAll Results:');
  allResults.forEach((teamResults, teamName) => {
    console.log(`\n${teamName}:`);
    teamResults.forEach((result, taskId) => {
      console.log(`  ${taskId}: ${JSON.stringify(result)}`);
    });
  });

  // Check shared memory
  const project = await devTeam.memory.get('project');
  console.log(`\nShared Memory - Project: ${project}`);
}

/**
 * Failure Handling Example: Demonstrate cascade failures
 */
async function failureHandlingExample() {
  console.log('\n\n=== Failure Handling Example ===\n');

  const orchestrator = new Orchestrator();
  const team = orchestrator.createTeam('test-team', 2);

  // Create agent that will fail
  orchestrator.createAgent(
    'test-team',
    {
      id: 'agent-1',
      name: 'Failing Agent',
      capabilities: ['test'],
    },
    new MockAdapter(() => {
      throw new Error('Simulated failure');
    })
  );

  // Create tasks with dependencies
  const tasks: Task[] = [
    {
      id: 'task-1',
      type: 'test',
      payload: { description: 'This will fail' },
      dependencies: [],
      status: 'pending',
      priority: 10,
    },
    {
      id: 'task-2',
      type: 'test',
      payload: { description: 'This depends on task-1' },
      dependencies: ['task-1'],
      status: 'pending',
      priority: 5,
    },
    {
      id: 'task-3',
      type: 'test',
      payload: { description: 'This depends on task-2' },
      dependencies: ['task-2'],
      status: 'pending',
      priority: 3,
    },
  ];

  orchestrator.submitTaskGraph('test-team', tasks);

  try {
    await orchestrator.executeTeam('test-team');
  } catch (error) {
    console.log('Execution completed with failures');
  }

  // Check task statuses
  const taskQueue = team.taskQueue;
  console.log('\nTask Statuses:');
  taskQueue.getAllTasks().forEach(task => {
    console.log(`${task.id}: ${task.status} ${task.error ? `- ${task.error.message}` : ''}`);
  });

  console.log('\nStats:', JSON.stringify(team.getStats(), null, 2));
}

// Run examples
async function main() {
  await basicExample();
  await advancedExample();
  await failureHandlingExample();
}

main().catch(console.error);
