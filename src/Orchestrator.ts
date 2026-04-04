import { Team } from './Team';
import { Agent } from './Agent';
import { ToolRegistry } from './ToolRegistry';
import { Task, AgentConfig, ToolDefinition, LLMAdapter } from './types';

/**
 * Orchestrator - Top-level coordination and scheduling engine
 */
export class Orchestrator {
  private teams: Map<string, Team> = new Map();
  private globalToolRegistry: ToolRegistry;
  private running: boolean = false;

  constructor() {
    this.globalToolRegistry = new ToolRegistry();
  }

  /**
   * Create a new team
   */
  createTeam(name: string, maxConcurrentAgents: number = 5): Team {
    if (this.teams.has(name)) {
      throw new Error(`Team ${name} already exists`);
    }

    const team = new Team({ name, maxConcurrentAgents });
    this.teams.set(name, team);
    return team;
  }

  /**
   * Get a team by name
   */
  getTeam(name: string): Team | undefined {
    return this.teams.get(name);
  }

  /**
   * Register a global tool (available to all agents)
   */
  registerTool(tool: ToolDefinition): void {
    this.globalToolRegistry.register(tool);
  }

  /**
   * Create and register an agent to a team
   */
  createAgent(teamName: string, config: AgentConfig, llm: LLMAdapter): Agent {
    const team = this.teams.get(teamName);
    if (!team) {
      throw new Error(`Team ${teamName} not found`);
    }

    const agent = new Agent(config, llm, this.globalToolRegistry);
    team.agentPool.registerAgent(agent);

    return agent;
  }

  /**
   * Submit a task to a team
   */
  submitTask(teamName: string, task: Task): void {
    const team = this.teams.get(teamName);
    if (!team) {
      throw new Error(`Team ${teamName} not found`);
    }

    team.addTask(task);
  }

  /**
   * Submit multiple tasks with dependencies
   */
  submitTaskGraph(teamName: string, tasks: Task[]): void {
    const team = this.teams.get(teamName);
    if (!team) {
      throw new Error(`Team ${teamName} not found`);
    }

    // Validate dependencies exist
    const taskIds = new Set(tasks.map(t => t.id));
    for (const task of tasks) {
      for (const depId of task.dependencies) {
        if (!taskIds.has(depId)) {
          throw new Error(`Task ${task.id} depends on non-existent task ${depId}`);
        }
      }
    }

    // Add all tasks to queue
    tasks.forEach(task => team.addTask(task));
  }

  /**
   * Execute all tasks for a team
   */
  async executeTeam(teamName: string): Promise<Map<string, any>> {
    const team = this.teams.get(teamName);
    if (!team) {
      throw new Error(`Team ${teamName} not found`);
    }

    return team.executeTasks();
  }

  /**
   * Execute all teams in parallel
   */
  async executeAll(): Promise<Map<string, Map<string, any>>> {
    this.running = true;
    const results = new Map<string, Map<string, any>>();

    const teamExecutions = Array.from(this.teams.entries()).map(async ([name, team]) => {
      const teamResults = await team.executeTasks();
      return { name, results: teamResults };
    });

    const settled = await Promise.allSettled(teamExecutions);

    settled.forEach(result => {
      if (result.status === 'fulfilled') {
        results.set(result.value.name, result.value.results);
      } else {
        results.set('error', new Map([['error', result.reason]]));
      }
    });

    this.running = false;
    return results;
  }

  /**
   * Get overall orchestrator statistics
   */
  getStats(): Record<string, any> {
    const stats: Record<string, any> = {
      teams: {},
      totalTools: this.globalToolRegistry.size(),
      running: this.running,
    };

    this.teams.forEach((team, name) => {
      stats.teams[name] = team.getStats();
    });

    return stats;
  }

  /**
   * Check if orchestrator is running
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Get all teams
   */
  getAllTeams(): Team[] {
    return Array.from(this.teams.values());
  }

  /**
   * Remove a team
   */
  removeTeam(name: string): boolean {
    return this.teams.delete(name);
  }

  /**
   * Clear all teams and reset orchestrator
   */
  reset(): void {
    this.teams.clear();
    this.running = false;
  }
}
