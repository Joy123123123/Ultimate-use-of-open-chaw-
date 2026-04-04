import { LLMAdapter, ConversationMessage, LLMResponse, ToolDefinition } from '../types';

/**
 * Mock LLM Adapter for testing
 */
export class MockAdapter implements LLMAdapter {
  private responses: string[] | ((messages: ConversationMessage[]) => string);
  private callCount: number = 0;

  constructor(responses: string[] | ((messages: ConversationMessage[]) => string) = []) {
    this.responses = responses;
  }

  async generate(messages: ConversationMessage[], tools?: ToolDefinition[]): Promise<LLMResponse> {
    this.callCount++;

    let content: string;
    if (typeof this.responses === 'function') {
      content = this.responses(messages);
    } else {
      const index = Math.min(this.callCount - 1, this.responses.length - 1);
      content = this.responses[index] || 'Mock response';
    }

    return {
      content,
      finishReason: 'stop',
    };
  }

  getCallCount(): number {
    return this.callCount;
  }

  reset(): void {
    this.callCount = 0;
  }
}
