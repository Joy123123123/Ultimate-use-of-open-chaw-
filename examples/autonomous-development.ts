import { Orchestrator, ClaudeAdapter, Task } from '../src';

/**
 * Autonomous Software Development Pipeline
 *
 * This example demonstrates a complete software development workflow
 * with multiple specialized agents working together:
 * - Requirements analysis
 * - Architecture design
 * - Implementation
 * - Testing
 * - Code review
 * - Documentation
 *
 * This showcases:
 * - Complex task dependencies
 * - Multiple agent specializations
 * - Shared state coordination
 * - Tool usage for code operations
 * - Cascade failure handling
 */

async function autonomousDevelopmentPipeline() {
  const orchestrator = new Orchestrator();

  // Create development team
  const devTeam = orchestrator.createTeam('dev-team', 4);

  // Register development tools
  orchestrator.registerTool({
    name: 'analyze_codebase',
    description: 'Analyze existing codebase structure and patterns',
    parameters: {
      type: 'object',
      properties: {
        directory: { type: 'string' },
        language: { type: 'string' }
      },
      required: ['directory']
    },
    execute: async (params) => {
      console.log(`🔍 Analyzing codebase: ${params.directory}`);
      return {
        structure: {
          src: ['components/', 'utils/', 'services/'],
          tests: ['unit/', 'integration/']
        },
        patterns: ['MVC', 'Singleton', 'Factory'],
        languages: ['typescript', 'javascript'],
        complexity: 'medium'
      };
    }
  });

  orchestrator.registerTool({
    name: 'write_code',
    description: 'Write code for a specific feature or component',
    parameters: {
      type: 'object',
      properties: {
        file_path: { type: 'string' },
        code: { type: 'string' },
        language: { type: 'string' }
      },
      required: ['file_path', 'code']
    },
    execute: async (params) => {
      console.log(`📝 Writing code: ${params.file_path}`);
      await devTeam.memory.set(`code:${params.file_path}`, params.code);
      return { written: true, path: params.file_path, lines: params.code.split('\n').length };
    }
  });

  orchestrator.registerTool({
    name: 'run_tests',
    description: 'Execute test suite for code',
    parameters: {
      type: 'object',
      properties: {
        test_path: { type: 'string' },
        coverage: { type: 'boolean' }
      },
      required: ['test_path']
    },
    execute: async (params) => {
      console.log(`🧪 Running tests: ${params.test_path}`);
      // Simulate test execution
      const passed = Math.random() > 0.1; // 90% pass rate
      return {
        passed,
        total: 25,
        passed_count: passed ? 25 : 23,
        failed_count: passed ? 0 : 2,
        coverage: params.coverage ? 87.5 : undefined,
        duration: '2.3s'
      };
    }
  });

  orchestrator.registerTool({
    name: 'lint_code',
    description: 'Run linter on code to check style and quality',
    parameters: {
      type: 'object',
      properties: {
        files: { type: 'array', items: { type: 'string' } }
      },
      required: ['files']
    },
    execute: async (params) => {
      console.log(`🔧 Linting files: ${params.files.join(', ')}`);
      return {
        errors: 0,
        warnings: 2,
        issues: [
          { file: params.files[0], line: 42, message: 'Line too long', severity: 'warning' }
        ]
      };
    }
  });

  orchestrator.registerTool({
    name: 'generate_docs',
    description: 'Generate documentation from code',
    parameters: {
      type: 'object',
      properties: {
        source_files: { type: 'array' },
        format: { type: 'string', enum: ['markdown', 'html'] }
      },
      required: ['source_files']
    },
    execute: async (params) => {
      console.log(`📚 Generating ${params.format} documentation`);
      return {
        generated: true,
        output: `docs/api.${params.format === 'html' ? 'html' : 'md'}`,
        pages: 15
      };
    }
  });

  // Create LLM adapter
  const llm = new ClaudeAdapter({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    model: 'claude-3-5-sonnet-20241022'
  });

  // Create specialized agents
  orchestrator.createAgent('dev-team', {
    id: 'product-manager',
    name: 'Product Manager',
    capabilities: ['requirements', 'planning'],
    systemPrompt: `You are a product manager. Analyze requirements and create clear, actionable specifications.
Focus on user needs, edge cases, and acceptance criteria. Be thorough but concise.`
  }, llm);

  orchestrator.createAgent('dev-team', {
    id: 'architect',
    name: 'Software Architect',
    capabilities: ['architecture', 'design'],
    systemPrompt: `You are a software architect. Design scalable, maintainable system architectures.
Consider patterns, components, data flow, and integration points. Use tools to analyze existing code.`
  }, llm);

  orchestrator.createAgent('dev-team', {
    id: 'developer',
    name: 'Senior Developer',
    capabilities: ['coding', 'implementation'],
    systemPrompt: `You are a senior developer. Write clean, efficient, well-tested code.
Follow best practices, handle errors gracefully, and write self-documenting code. Use provided tools.`
  }, llm);

  orchestrator.createAgent('dev-team', {
    id: 'qa-engineer',
    name: 'QA Engineer',
    capabilities: ['testing', 'quality-assurance'],
    systemPrompt: `You are a QA engineer. Write comprehensive tests and verify quality.
Test edge cases, error handling, and performance. Use testing tools to execute test suites.`
  }, llm);

  orchestrator.createAgent('dev-team', {
    id: 'tech-writer',
    name: 'Technical Writer',
    capabilities: ['documentation'],
    systemPrompt: `You are a technical writer. Create clear, comprehensive documentation.
Explain concepts simply, provide examples, and maintain consistency. Use documentation tools.`
  }, llm);

  // Define the development pipeline
  const feature = 'User authentication with JWT tokens';

  const tasks: Task[] = [
    // Phase 1: Planning
    {
      id: 'analyze-requirements',
      type: 'requirements',
      payload: {
        description: `Analyze requirements for: ${feature}.
Consider security, UX, error handling, and integration with existing systems.`
      },
      dependencies: [],
      status: 'pending',
      priority: 100,
      assignedTo: 'product-manager'
    },

    // Phase 2: Design
    {
      id: 'design-architecture',
      type: 'architecture',
      payload: {
        description: `Design architecture for: ${feature}.
Use analyze_codebase tool to understand existing patterns.
Define components, data flow, and security measures.`
      },
      dependencies: ['analyze-requirements'],
      status: 'pending',
      priority: 90,
      assignedTo: 'architect'
    },

    // Phase 3: Implementation (parallel)
    {
      id: 'implement-auth-service',
      type: 'coding',
      payload: {
        description: `Implement authentication service with JWT token generation and validation.
Use write_code tool to create the implementation. Include error handling and logging.`
      },
      dependencies: ['design-architecture'],
      status: 'pending',
      priority: 80,
      assignedTo: 'developer'
    },
    {
      id: 'implement-auth-middleware',
      type: 'coding',
      payload: {
        description: `Implement authentication middleware for protecting routes.
Use write_code tool. Should verify JWT tokens and handle unauthorized access.`
      },
      dependencies: ['design-architecture'],
      status: 'pending',
      priority: 80,
      assignedTo: 'developer'
    },

    // Phase 4: Testing
    {
      id: 'write-tests',
      type: 'testing',
      payload: {
        description: `Write comprehensive tests for authentication service and middleware.
Cover success cases, error cases, token expiration, and security scenarios.
Use run_tests tool to execute tests.`
      },
      dependencies: ['implement-auth-service', 'implement-auth-middleware'],
      status: 'pending',
      priority: 70,
      assignedTo: 'qa-engineer'
    },

    // Phase 5: Quality checks
    {
      id: 'code-quality-check',
      type: 'quality-assurance',
      payload: {
        description: `Run linting and quality checks on implemented code.
Use lint_code tool. Verify code style and identify potential issues.`
      },
      dependencies: ['implement-auth-service', 'implement-auth-middleware'],
      status: 'pending',
      priority: 60,
      assignedTo: 'qa-engineer'
    },

    // Phase 6: Documentation
    {
      id: 'write-documentation',
      type: 'documentation',
      payload: {
        description: `Create documentation for the authentication system.
Include API reference, usage examples, security considerations, and troubleshooting.
Use generate_docs tool for API documentation.`
      },
      dependencies: ['write-tests', 'code-quality-check'],
      status: 'pending',
      priority: 50,
      assignedTo: 'tech-writer'
    }
  ];

  // Set up monitoring
  devTeam.messageBus.subscribe('*', (message) => {
    if (message.type === 'result') {
      console.log(`✅ Completed: ${message.content.taskId}`);
    } else if (message.type === 'error') {
      console.log(`❌ Failed: ${message.content.taskId} - ${message.content.error}`);
      if (message.content.cascaded && message.content.cascaded.length > 0) {
        console.log(`   Cascaded failures: ${message.content.cascaded.join(', ')}`);
      }
    }
  });

  // Initialize shared state
  await devTeam.memory.set('project', 'Authentication System');
  await devTeam.memory.set('feature', feature);
  await devTeam.memory.set('start-time', Date.now());

  // Submit task graph
  console.log('📋 Submitting development pipeline...\n');
  console.log(`Feature: ${feature}`);
  console.log(`Tasks: ${tasks.length}`);
  console.log(`Agents: ${devTeam.agentPool.getAllAgents().length}\n`);

  orchestrator.submitTaskGraph('dev-team', tasks);

  // Execute pipeline
  console.log('🚀 Starting execution...\n');
  const results = await orchestrator.executeTeam('dev-team');

  // Calculate metrics
  const endTime = Date.now();
  const startTime = await devTeam.memory.get<number>('start-time');
  const duration = ((endTime - startTime!) / 1000).toFixed(2);

  // Display results
  console.log('\n' + '='.repeat(80));
  console.log('DEVELOPMENT PIPELINE COMPLETE');
  console.log('='.repeat(80));
  console.log(`\n⏱️  Total time: ${duration}s`);
  console.log(`📊 Tasks: ${results.size}/${tasks.length}`);

  const stats = devTeam.getStats();
  console.log(`✅ Completed: ${stats.tasks.completed}`);
  console.log(`❌ Failed: ${stats.tasks.failed}`);

  // Show deliverables
  console.log('\n📦 DELIVERABLES:\n');
  const codeFiles = devTeam.memory.keys().filter(k => k.startsWith('code:'));
  codeFiles.forEach(file => {
    console.log(`  - ${file.replace('code:', '')}`);
  });

  // Show individual results
  console.log('\n📝 TASK RESULTS:\n');
  tasks.forEach(task => {
    const result = results.get(task.id);
    const status = result?.error ? '❌' : '✅';
    console.log(`${status} ${task.id}`);
    if (typeof result === 'string' && result.length < 200) {
      console.log(`   ${result}`);
    }
  });

  return results;
}

// Run if executed directly
if (require.main === module) {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ Error: ANTHROPIC_API_KEY environment variable is required');
    console.log('\nUsage: ANTHROPIC_API_KEY=your-key node examples/autonomous-development.js');
    process.exit(1);
  }

  autonomousDevelopmentPipeline()
    .then(() => {
      console.log('\n✨ Development pipeline completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Pipeline failed:', error);
      process.exit(1);
    });
}

export { autonomousDevelopmentPipeline };
