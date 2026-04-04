import { ToolDefinition } from './types';

/**
 * Tool Registry - Central registry for all agent capabilities
 */
export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();

  /**
   * Register a new tool
   */
  register(tool: ToolDefinition): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool ${tool.name} is already registered`);
    }
    this.tools.set(tool.name, tool);
  }

  /**
   * Unregister a tool
   */
  unregister(name: string): boolean {
    return this.tools.delete(name);
  }

  /**
   * Get a tool by name
   */
  getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  /**
   * Get all registered tools
   */
  getAllTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get tools by capability/tag
   */
  getToolsByCapability(capability: string): ToolDefinition[] {
    return this.getAllTools().filter(tool =>
      tool.description.toLowerCase().includes(capability.toLowerCase())
    );
  }

  /**
   * Execute a tool with parameters
   */
  async execute(name: string, params: any): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool ${name} not found`);
    }

    try {
      return await tool.execute(params);
    } catch (error) {
      throw new Error(`Tool ${name} execution failed: ${error}`);
    }
  }

  /**
   * Check if a tool exists
   */
  hasTool(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Get tool count
   */
  size(): number {
    return this.tools.size;
  }
}
