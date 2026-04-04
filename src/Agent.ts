import { AgentConfig, ConversationMessage, LLMAdapter, ToolDefinition } from './types';
import { ToolRegistry } from './ToolRegistry';

/**
 * Agent - Individual reasoning unit with LLM and tool access
 */
export class Agent {
  public readonly id: string;
  public readonly name: string;
  public readonly capabilities: string[];
  private llm: LLMAdapter;
  private toolRegistry: ToolRegistry;
  private conversationHistory: ConversationMessage[] = [];
  private systemPrompt: string;
  private maxIterations: number = 10;

  constructor(config: AgentConfig, llm: LLMAdapter, toolRegistry: ToolRegistry) {
    this.id = config.id;
    this.name = config.name;
    this.capabilities = config.capabilities;
    this.llm = llm;
    this.toolRegistry = toolRegistry;
    this.systemPrompt = config.systemPrompt || this.buildDefaultSystemPrompt();
  }

  /**
   * Execute a task with the agent
   */
  async execute(taskDescription: string, context?: any): Promise<any> {
    // Initialize conversation with system prompt
    if (this.conversationHistory.length === 0) {
      this.conversationHistory.push({
        role: 'system',
        content: this.systemPrompt,
      });
    }

    // Add user message
    const userMessage = context
      ? `${taskDescription}\n\nContext: ${JSON.stringify(context, null, 2)}`
      : taskDescription;

    this.conversationHistory.push({
      role: 'user',
      content: userMessage,
    });

    // Reasoning loop with tool use
    let iteration = 0;
    while (iteration < this.maxIterations) {
      iteration++;

      const tools = this.toolRegistry.getAllTools();
      const response = await this.llm.generate(this.conversationHistory, tools);

      // Add assistant response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: response.content,
      });

      // Handle tool calls
      if (response.toolCalls && response.toolCalls.length > 0) {
        for (const toolCall of response.toolCalls) {
          try {
            const result = await this.toolRegistry.execute(toolCall.name, toolCall.arguments);

            // Add tool result to conversation
            this.conversationHistory.push({
              role: 'user',
              content: `Tool ${toolCall.name} result: ${JSON.stringify(result)}`,
            });
          } catch (error) {
            this.conversationHistory.push({
              role: 'user',
              content: `Tool ${toolCall.name} error: ${error}`,
            });
          }
        }
        // Continue loop to process tool results
        continue;
      }

      // If no tool calls and finish reason is stop, we're done
      if (response.finishReason === 'stop') {
        return response.content;
      }
    }

    throw new Error(`Agent ${this.name} exceeded max iterations`);
  }

  /**
   * Reset conversation history
   */
  reset(): void {
    this.conversationHistory = [];
  }

  /**
   * Get conversation history
   */
  getConversation(): ConversationMessage[] {
    return [...this.conversationHistory];
  }

  /**
   * Build default system prompt
   */
  private buildDefaultSystemPrompt(): string {
    return `You are ${this.name}, an AI agent with the following capabilities: ${this.capabilities.join(', ')}.

You have access to tools that can help you complete tasks. Use them when needed.
Always provide clear, actionable responses.
When you have completed the task, provide a final answer without requesting more tools.`;
  }
}
