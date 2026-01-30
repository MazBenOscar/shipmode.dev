export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface Chunk {
  content: string;
  done: boolean;
  usage?: TokenUsage;
}

export interface LLMResponse {
  content: string;
  usage: TokenUsage;
  model: string;
  provider: string;
}

export interface TokenUsage {
  input: number;
  output: number;
  cacheRead?: number;
  cacheWrite?: number;
}

export interface GenerateOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  stream?: boolean;
  abortSignal?: AbortSignal;
}

export interface ProviderConfig {
  provider: string;
  apiKey: string;
  baseUrl?: string;
  defaultModel: string;
  availableModels: string[];
}

export type SupportedProvider = 
  | 'anthropic' 
  | 'openai' 
  | 'google' 
  | 'moonshot' 
  | 'minimax' 
  | 'ollama';

export const PROVIDER_MODELS: Record<SupportedProvider, string[]> = {
  anthropic: [
    'claude-opus-4-5-20250929',
    'claude-sonnet-4-5-20250929',
    'claude-haiku-3-5-20250929',
  ],
  openai: [
    'gpt-5.2',
    'gpt-4o',
    'gpt-4o-mini',
    'codex',
  ],
  google: [
    'gemini-3-pro',
    'gemini-3-flash',
  ],
  moonshot: [
    'kimi-2-5',
  ],
  minimax: [
    'minimax-m2-1',
  ],
  ollama: [
    'llama3',
    'llama3.1',
    'mistral',
    'codellama',
  ],
};

export const DEFAULT_MODELS: Record<SupportedProvider, string> = {
  anthropic: 'claude-sonnet-4-5-20250929',
  openai: 'codex',
  google: 'gemini-3-pro',
  moonshot: 'kimi-2-5',
  minimax: 'minimax-m2-1',
  ollama: 'llama3',
};
