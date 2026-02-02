/**
 * ShipMode Core Framework Types
 */

import { Provider } from './provider';
import { Agent } from './agent';
import { Memory } from './memory';
import { Tool } from './tool';

// Configuration types
export interface ShipModeConfig {
  /** Default provider to use */
  defaultProvider: string;
  
  /** Available providers */
  providers: Record<string, Provider>;
  
  /** Default model for agents */
  defaultModel?: string;
  
  /** Enable memory persistence */
  enableMemory?: boolean;
  
  /** Custom memory implementation */
  memoryAdapter?: Memory;
  
  /** Enable streaming responses */
  streaming?: boolean;
  
  /** Maximum tokens per response */
  maxTokens?: number;
  
  /** Temperature setting (0-1) */
  temperature?: number;
  
  /** Custom system prompt */
  systemPrompt?: string;
  
  /** Enable tool usage */
  enableTools?: boolean;
  
  /** Available tools */
  tools?: Tool[];
  
  /** Callbacks for lifecycle events */
  callbacks?: ShipModeCallbacks;
}

export interface ShipModeCallbacks {
  onAgentStart?: (agent: Agent) => void;
  onAgentComplete?: (agent: Agent, result: string) => void;
  onAgentError?: (agent: Agent, error: Error) => void;
  onToolCall?: (tool: Tool, args: Record<string, unknown>) => void;
  onToolResult?: (tool: Tool, result: unknown) => void;
  onMemoryStore?: (memory: Memory) => void;
  onMemoryRetrieve?: (memory: Memory[]) => void;
  onProviderSwitch?: (fromProvider: string, toProvider: string) => void;
  onRateLimit?: (provider: string, retryAfter: number) => void;
  onCostUpdate?: (cost: number) => void;
}

// Context types
export interface ExecutionContext {
  /** Unique execution ID */
  id: string;
  
  /** Current agent executing */
  agent?: Agent;
  
  /** Current conversation/memory */
  memory: Memory;
  
  /** Available tools */
  tools: Tool[];
  
  /** Current provider being used */
  currentProvider: string;
  
  /** Total cost so far */
  cost: number;
  
  /** Execution start time */
  startTime: number;
  
  /** Maximum iterations */
  maxIterations: number;
  
  /** Current iteration */
  iteration: number;
}

// Result types
export interface ExecutionResult {
  /** Success status */
  success: boolean;
  
  /** Final output */
  output: string;
  
  /** Total cost incurred */
  cost: number;
  
  /** Total tokens used */
  tokens: number;
  
  /** Execution time in ms */
  duration: number;
  
  /** Number of iterations */
  iterations: number;
  
  /** Tools used */
  toolsUsed: string[];
  
  /** Any errors encountered */
  errors: Error[];
  
  /** Memory items created */
  memoriesStored: number;
}

// Provider selection types
export interface ProviderSelection {
  /** Selected provider */
  provider: string;
  
  /** Reason for selection */
  reason: string;
  
  /** Estimated cost for this task */
  estimatedCost: number;
  
  /** Fallback providers if this fails */
  fallbacks: string[];
}

// Tool definition types
export interface ToolDefinition {
  /** Tool name */
  name: string;
  
  /** Tool description */
  description: string;
  
  /** Input schema */
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
  
  /** Function to execute */
  handler: (args: Record<string, unknown>) => Promise<unknown>;
}

// Message types
export interface Message {
  /** Message role */
  role: 'system' | 'user' | 'assistant' | 'tool';
  
  /** Message content */
  content: string;
  
  /** Tool calls (if any) */
  toolCalls?: ToolCall[];
  
  /** Tool results (if any) */
  toolResults?: ToolResult[];
  
  /** Timestamp */
  timestamp: number;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: string;
}

export interface ToolResult {
  id: string;
  result: unknown;
  error?: string;
}

// Export types
export type {
  ShipModeConfig as Config,
  ShipModeCallbacks as Callbacks,
  ExecutionContext as Context,
  ExecutionResult as Result,
  ProviderSelection as ProviderSelect,
  ToolDefinition as ToolDef,
  Message,
  ToolCall,
  ToolResult,
};
