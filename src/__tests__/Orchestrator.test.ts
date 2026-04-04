import { Orchestrator } from '../Orchestrator';
import { MockAdapter } from '../adapters/MockAdapter';
import { Task } from '../types';

describe('Orchestrator', () => {
  let orchestrator: Orchestrator;

  beforeEach(() => {
    orchestrator = new Orchestrator();
  });

  describe('team management', () => {
    it('should create and retrieve teams', () => {
      const team = orchestrator.createTeam('test-team', 5);
      expect(team).toBeDefined();
      expect(team.name).toBe('test-team');

      const retrieved = orchestrator.getTeam('test-team');
      expect(retrieved).toBe(team);
    });

    it('should not allow duplicate team names', () => {
      orchestrator.createTeam('test-team', 5);
      expect(() => {
        orchestrator.createTeam('test-team', 5);
      }).toThrow('Team test-team already exists');
    });

    it('should remove teams', () => {
      orchestrator.createTeam('test-team', 5);
      const removed = orchestrator.removeTeam('test-team');
      expect(removed).toBe(true);
      expect(orchestrator.getTeam('test-team')).toBeUndefined();
    });
  });

  describe('agent management', () => {
    it('should create agents in teams', () => {
      orchestrator.createTeam('test-team', 5);
      const agent = orchestrator.createAgent(
        'test-team',
        {
          id: 'agent-1',
          name: 'Test Agent',
          capabilities: ['test'],
        },
        new MockAdapter(['test response'])
      );

      expect(agent.id).toBe('agent-1');

      const team = orchestrator.getTeam('test-team');
      const retrieved = team?.agentPool.getAgent('agent-1');
      expect(retrieved).toBe(agent);
    });

    it('should fail to create agent in non-existent team', () => {
      expect(() => {
        orchestrator.createAgent(
          'non-existent',
          { id: 'agent-1', name: 'Test', capabilities: [] },
          new MockAdapter()
        );
      }).toThrow('Team non-existent not found');
    });
  });

  describe('tool management', () => {
    it('should register global tools', () => {
      const tool = {
        name: 'test-tool',
        description: 'A test tool',
        parameters: {},
        execute: async () => 'result',
      };

      orchestrator.registerTool(tool);

      // Tool should be available to all agents
      orchestrator.createTeam('team-1', 5);
      const agent = orchestrator.createAgent(
        'team-1',
        { id: 'agent-1', name: 'Agent', capabilities: [] },
        new MockAdapter()
      );

      // The agent should have access to the tool through the global registry
      expect(orchestrator.getStats().totalTools).toBe(1);
    });
  });

  describe('task execution', () => {
    it('should execute simple tasks', async () => {
      orchestrator.createTeam('test-team', 5);
      orchestrator.createAgent(
        'test-team',
        { id: 'agent-1', name: 'Agent', capabilities: ['test'] },
        new MockAdapter(['Task completed successfully'])
      );

      const task: Task = {
        id: 'task-1',
        type: 'test',
        payload: { description: 'Test task' },
        dependencies: [],
        status: 'pending',
        priority: 10,
      };

      orchestrator.submitTask('test-team', task);
      const results = await orchestrator.executeTeam('test-team');

      expect(results.get('task-1')).toBe('Task completed successfully');
    });

    it('should execute task graphs with dependencies', async () => {
      orchestrator.createTeam('test-team', 5);
      orchestrator.createAgent(
        'test-team',
        { id: 'agent-1', name: 'Agent', capabilities: ['test'] },
        new MockAdapter(['Result 1', 'Result 2'])
      );

      const tasks: Task[] = [
        {
          id: 'task-1',
          type: 'test',
          payload: { description: 'First task' },
          dependencies: [],
          status: 'pending',
          priority: 10,
        },
        {
          id: 'task-2',
          type: 'test',
          payload: { description: 'Second task' },
          dependencies: ['task-1'],
          status: 'pending',
          priority: 5,
        },
      ];

      orchestrator.submitTaskGraph('test-team', tasks);
      const results = await orchestrator.executeTeam('test-team');

      expect(results.size).toBe(2);
      expect(results.has('task-1')).toBe(true);
      expect(results.has('task-2')).toBe(true);
    });

    it('should validate task dependencies', () => {
      orchestrator.createTeam('test-team', 5);

      const tasks: Task[] = [
        {
          id: 'task-1',
          type: 'test',
          payload: {},
          dependencies: ['non-existent'],
          status: 'pending',
          priority: 10,
        },
      ];

      expect(() => {
        orchestrator.submitTaskGraph('test-team', tasks);
      }).toThrow('depends on non-existent task');
    });
  });

  describe('statistics', () => {
    it('should provide comprehensive stats', () => {
      orchestrator.createTeam('team-1', 5);
      orchestrator.createTeam('team-2', 3);

      orchestrator.registerTool({
        name: 'tool-1',
        description: 'Test tool',
        parameters: {},
        execute: async () => {},
      });

      const stats = orchestrator.getStats();

      expect(stats.teams['team-1']).toBeDefined();
      expect(stats.teams['team-2']).toBeDefined();
      expect(stats.totalTools).toBe(1);
      expect(stats.running).toBe(false);
    });
  });

  describe('reset', () => {
    it('should reset orchestrator state', () => {
      orchestrator.createTeam('test-team', 5);
      orchestrator.registerTool({
        name: 'tool',
        description: 'Tool',
        parameters: {},
        execute: async () => {},
      });

      orchestrator.reset();

      expect(orchestrator.getAllTeams()).toHaveLength(0);
      expect(orchestrator.isRunning()).toBe(false);
    });
  });
});
