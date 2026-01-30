import Anthropic from '@anthropic-ai/sdk';
import type { LLMAdapter, AdapterConfig } from './base.js';
import type { Message, Chunk, LLMResponse, GenerateOptions } from '../types.js';

export class AnthropicAdapter implements LLMAdapter {
  readonly provider = 'anthropic';
  readonly name = 'Anthropic Claude';
  
  private client: Anthropic;
  private config: AdapterConfig;
  
  constructor(config: AdapterConfig) {
    this.config = config;
    this.client = new Anthropic({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
    });
  }
  
  async validateConfig(): Promise<boolean> {
    try {
      // Simple validation by making a minimal request
      await this.client.messages.create({
        model: this.config.defaultModel || 'claude-sonnet-4-5-20250929',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'Hi' }],
      });
      return true;
    } catch (error) {
      return false;
    }
  }
  
  async complete(
    messages: Message[],
    options: GenerateOptions = {}
  ): Promise<LLMResponse> {
    const model = options.model || this.config.defaultModel || 'claude-sonnet-4-5-20250929';
    const maxTokens = options.maxTokens || 4096;
    
    // Convert messages to Anthropic format
    const anthropicMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));
    
    const systemPrompt = messages.find(m => m.role === 'system')?.content;
    
    const response = await this.client.messages.create({
      model,
      max_tokens: maxTokens,
      messages: anthropicMessages,
      system: systemPrompt,
      temperature: options.temperature ?? 0.7,
    });
    
    return {
      content: response.content[0]?.type === 'text' 
        ? response.content[0].text 
        : '',
      usage: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
        cacheRead: response.usage.cache_read_input_tokens,
        cacheWrite: response.usage.cache_creation_input_tokens,
      },
      model,
      provider: this.provider,
    };
  }
  
  async *completeStream(
    messages: Message[],
    options: GenerateOptions = {}
  ): AsyncGenerator<Chunk> {
    const model = options.model || this.config.defaultModel || 'claude-sonnet-4-5-20250929';
    const maxTokens = options.maxTokens || 4096;
    
    const anthropicMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));
    
    const systemPrompt = messages.find(m => m.role === 'system')?.content;
    
    const stream = await this.client.messages.create({
      model,
      max_tokens: maxTokens,
      messages: anthropicMessages,
      system: systemPrompt,
      temperature: options.temperature ?? 0.7,
      stream: true,
    });
    
    let inputTokens = 0;
    let outputTokens = 0;
    
    for await (const chunk of stream) {
      if (chunk.type === 'message_start') {
        inputTokens = chunk.message.usage.input_tokens;
      } else if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        outputTokens++;
        yield {
          content: chunk.delta.text,
          done: false,
        };
      } else if (chunk.type === 'message_delta') {
        if (chunk.usage) {
          outputTokens = chunk.usage.output_tokens;
        }
      }
    }
    
    yield {
      content: '',
      done: true,
      usage: {
        input: inputTokens,
        output: outputTokens,
      },
    };
  }
  
  async generateObject<T>(
    messages: Message[],
    schema: unknown,
    options: GenerateOptions = {}
  ): Promise<T> {
    // Add schema to system prompt
    const schemaInstruction = `\n\nYou must respond with valid JSON that matches this schema:\n${JSON.stringify(schema, null, 2)}\n\nRespond ONLY with JSON, no markdown formatting.`;
    
    const modifiedMessages = messages.map(m => 
      m.role === 'system' 
        ? { ...m, content: m.content + schemaInstruction }
        : m
    );
    
    // If no system message, add one
    if (!modifiedMessages.find(m => m.role === 'system')) {
      modifiedMessages.unshift({
        role: 'system',
        content: `You are a helpful assistant. ${schemaInstruction}`,
      });
    }
    
    const response = await this.complete(modifiedMessages, {
      ...options,
      temperature: 0.2, // Lower temperature for structured output
    });
    
    // Parse JSON response
    try {
      return JSON.parse(response.content) as T;
    } catch (error) {
      throw new Error(`Failed to parse JSON response: ${error}`);
    }
  }
}
