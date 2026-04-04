/**
 * Core types and interfaces for the multi-agent orchestration system
 */

export interface Message {
  id: string;
  from: string;
  to?: string;
  content: any;
  timestamp: number;
  type: 'task' | 'result' | 'error' | 'status';
}

export interface Task {
  id: string;
  type: string;
  payload: any;
  dependencies: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: Error;
  assignedTo?: string;
  priority: number;
}

export interface AgentConfig {
  id: string;
  name: string;
  capabilities: string[];
  model?: string;
  systemPrompt?: string;
  maxConcurrent?: number;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (params: any) => Promise<any>;
}

export interface ConversationMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  toolCalls?: Array<{
    name: string;
    arguments: any;
  }>;
  finishReason: 'stop' | 'tool_calls' | 'length';
}

export interface LLMAdapter {
  generate(messages: ConversationMessage[], tools?: ToolDefinition[]): Promise<LLMResponse>;
}

export interface TeamConfig {
  name: string;
  maxConcurrentAgents: number;
}

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed';
