import type { Message, Chunk, GenerateOptions, LLMResponse } from './types.js';

export interface LLMAdapter {
  readonly provider: string;
  readonly name: string;
  
  /**
   * Generate a completion
   */
  complete(
    messages: Message[],
    options?: GenerateOptions
  ): Promise<LLMResponse>;
  
  /**
   * Stream a completion
   */
  completeStream(
    messages: Message[],
    options?: GenerateOptions
  ): AsyncGenerator<Chunk>;
  
  /**
   * Generate structured output with Zod schema
   */
  generateObject<T>(
    messages: Message[],
    schema: unknown,
    options?: GenerateOptions
  ): Promise<T>;
  
  /**
   * Validate that the adapter is properly configured
   */
  validateConfig(): Promise<boolean>;
}

export interface AdapterConfig {
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
  timeout?: number;
}
