import { LLMAdapter, ConversationMessage, LLMResponse, ToolDefinition } from '../types';

/**
 * OpenAI LLM Adapter
 */
export class OpenAIAdapter implements LLMAdapter {
  private apiKey: string;
  private model: string;
  private baseURL?: string;

  constructor(config: { apiKey: string; model?: string; baseURL?: string }) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'gpt-4-turbo-preview';
    this.baseURL = config.baseURL;
  }

  async generate(messages: ConversationMessage[], tools?: ToolDefinition[]): Promise<LLMResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
    };

    const body: any = {
      model: this.model,
      messages: messages,
    };

    if (tools && tools.length > 0) {
      body.tools = tools.map(tool => ({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
        },
      }));
    }

    const url = this.baseURL
      ? `${this.baseURL}/chat/completions`
      : 'https://api.openai.com/v1/chat/completions';

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    const choice = data.choices[0];

    const result: LLMResponse = {
      content: choice.message.content || '',
      finishReason: choice.finish_reason === 'tool_calls' ? 'tool_calls' :
                   choice.finish_reason === 'length' ? 'length' : 'stop',
    };

    if (choice.message.tool_calls) {
      result.toolCalls = choice.message.tool_calls.map((tc: any) => ({
        name: tc.function.name,
        arguments: JSON.parse(tc.function.arguments),
      }));
    }

    return result;
  }
}
