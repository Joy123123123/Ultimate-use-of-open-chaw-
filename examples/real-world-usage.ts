import { Orchestrator, OpenAIAdapter, Task } from '../src';

/**
 * Real-world example: Building a research and analysis pipeline
 *
 * This example demonstrates:
 * - Multiple agents with different specializations
 * - Task dependencies and parallel execution
 * - Tool usage for external operations
 * - Shared memory for state coordination
 *
 * Requirements:
 * - Set OPENAI_API_KEY environment variable
 */

async function researchPipeline() {
  // Initialize orchestrator
  const orchestrator = new Orchestrator();

  // Create a research team with max 3 concurrent agents
  const team = orchestrator.createTeam('research-team', 3);

  // Register tools that agents can use
  orchestrator.registerTool({
    name: 'web_search',
    description: 'Search the web for information on a topic',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query'
        },
        max_results: {
          type: 'number',
          description: 'Maximum number of results to return'
        }
      },
      required: ['query']
    },
    execute: async (params) => {
      // Simulate web search (replace with actual implementation)
      console.log(`🔍 Searching for: ${params.query}`);
      return {
        results: [
          { title: 'Multi-Agent Systems Research', url: 'https://example.com/1', snippet: 'Overview of multi-agent coordination...' },
          { title: 'Distributed AI Architectures', url: 'https://example.com/2', snippet: 'Modern approaches to distributed agents...' },
        ]
      };
    }
  });

  orchestrator.registerTool({
    name: 'save_report',
    description: 'Save a research report to storage',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        content: { type: 'string' },
        format: { type: 'string', enum: ['markdown', 'html', 'pdf'] }
      },
      required: ['title', 'content']
    },
    execute: async (params) => {
      console.log(`💾 Saving report: ${params.title}`);
      // Simulate saving (replace with actual implementation)
      return { saved: true, path: `/reports/${params.title.toLowerCase().replace(/\s/g, '-')}` };
    }
  });

  orchestrator.registerTool({
    name: 'analyze_data',
    description: 'Perform statistical analysis on data',
    parameters: {
      type: 'object',
      properties: {
        data: { type: 'array' },
        analysis_type: { type: 'string' }
      },
      required: ['data']
    },
    execute: async (params) => {
      console.log(`📊 Analyzing data: ${params.analysis_type || 'general'}`);
      // Simulate analysis
      return {
        mean: 42,
        median: 40,
        insights: ['Data shows positive trend', 'Outliers detected in recent entries']
      };
    }
  });

  // Create the LLM adapter (using OpenAI)
  const llmAdapter = new OpenAIAdapter({
    apiKey: process.env.OPENAI_API_KEY || '',
    model: 'gpt-4-turbo-preview'
  });

  // Create specialized agents
  orchestrator.createAgent('research-team', {
    id: 'researcher-1',
    name: 'Primary Researcher',
    capabilities: ['research', 'information-gathering'],
    systemPrompt: `You are a research specialist. Your job is to gather comprehensive information on topics using available tools.
Always search for multiple sources and synthesize findings. Be thorough and accurate.`
  }, llmAdapter);

  orchestrator.createAgent('research-team', {
    id: 'researcher-2',
    name: 'Secondary Researcher',
    capabilities: ['research', 'information-gathering'],
    systemPrompt: `You are a research specialist focusing on technical details and implementation aspects.
Look for specific examples, code patterns, and architectural decisions.`
  }, llmAdapter);

  orchestrator.createAgent('research-team', {
    id: 'analyst-1',
    name: 'Data Analyst',
    capabilities: ['analysis', 'synthesis'],
    systemPrompt: `You are an analytical agent. Your job is to synthesize research findings, identify patterns,
and draw meaningful conclusions. Use data analysis tools when appropriate.`
  }, llmAdapter);

  orchestrator.createAgent('research-team', {
    id: 'writer-1',
    name: 'Report Writer',
    capabilities: ['writing', 'documentation'],
    systemPrompt: `You are a technical writer. Create clear, well-structured reports from research findings.
Your reports should be comprehensive yet accessible. Use proper markdown formatting.`
  }, llmAdapter);

  // Define research tasks with dependencies
  const tasks: Task[] = [
    {
      id: 'research-architecture',
      type: 'research',
      payload: {
        description: 'Research multi-agent orchestration architectures and their key components',
      },
      dependencies: [],
      status: 'pending',
      priority: 10,
      assignedTo: 'researcher-1'
    },
    {
      id: 'research-implementation',
      type: 'research',
      payload: {
        description: 'Research implementation patterns for distributed agent systems, focusing on scheduling and coordination',
      },
      dependencies: [],
      status: 'pending',
      priority: 10,
      assignedTo: 'researcher-2'
    },
    {
      id: 'analyze-findings',
      type: 'analysis',
      payload: {
        description: 'Analyze and synthesize the research findings from both architecture and implementation research',
      },
      dependencies: ['research-architecture', 'research-implementation'],
      status: 'pending',
      priority: 5,
      assignedTo: 'analyst-1'
    },
    {
      id: 'write-report',
      type: 'writing',
      payload: {
        description: 'Write a comprehensive technical report summarizing all findings with actionable recommendations',
      },
      dependencies: ['analyze-findings'],
      status: 'pending',
      priority: 1,
      assignedTo: 'writer-1'
    }
  ];

  // Submit the task graph
  console.log('📋 Submitting task graph...\n');
  orchestrator.submitTaskGraph('research-team', tasks);

  // Set up message monitoring
  team.messageBus.subscribe('*', (message) => {
    if (message.type === 'result') {
      console.log(`✅ Task ${message.content.taskId} completed`);
    } else if (message.type === 'error') {
      console.log(`❌ Task ${message.content.taskId} failed: ${message.content.error}`);
    }
  });

  // Store initial metadata in shared memory
  await team.memory.set('research-topic', 'Multi-Agent Orchestration Systems');
  await team.memory.set('start-time', Date.now());

  // Execute the pipeline
  console.log('🚀 Starting execution...\n');
  const results = await orchestrator.executeTeam('research-team');

  // Store completion time
  await team.memory.set('end-time', Date.now());

  const startTime = await team.memory.get<number>('start-time');
  const endTime = await team.memory.get<number>('end-time');
  const duration = ((endTime! - startTime!) / 1000).toFixed(2);

  // Display results
  console.log('\n' + '='.repeat(80));
  console.log('EXECUTION COMPLETE');
  console.log('='.repeat(80));
  console.log(`\n⏱️  Total execution time: ${duration}s`);
  console.log(`📊 Tasks completed: ${results.size}\n`);

  // Show individual results
  console.log('RESULTS:\n');
  results.forEach((result, taskId) => {
    console.log(`${taskId}:`);
    console.log(`${typeof result === 'string' ? result : JSON.stringify(result, null, 2)}`);
    console.log('-'.repeat(80));
  });

  // Show statistics
  const stats = orchestrator.getStats();
  console.log('\nSTATISTICS:\n');
  console.log(JSON.stringify(stats, null, 2));

  return results;
}

// Run if executed directly
if (require.main === module) {
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ Error: OPENAI_API_KEY environment variable is required');
    console.log('\nUsage: OPENAI_API_KEY=your-key node examples/real-world-usage.js');
    process.exit(1);
  }

  researchPipeline()
    .then(() => {
      console.log('\n✨ Pipeline completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Pipeline failed:', error);
      process.exit(1);
    });
}

export { researchPipeline };
