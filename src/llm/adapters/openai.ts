import OpenAI from 'openai';
import type { LLMAdapter, AdapterConfig } from './base.js';
import type { Message, Chunk, LLMResponse, GenerateOptions } from '../types.js';

export class OpenAIAdapter implements LLMAdapter {
  readonly provider = 'openai';
  readonly name = 'OpenAI';
  
  private client: OpenAI;
  private config: AdapterConfig;
  
  constructor(config: AdapterConfig) {
    this.config = config;
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
    });
  }
  
  async validateConfig(): Promise<boolean> {
    try {
      await this.client.models.list();
      return true;
    } catch (error) {
      return false;
    }
  }
  
  async complete(
    messages: Message[],
    options: GenerateOptions = {}
  ): Promise<LLMResponse> {
    const model = options.model || this.config.defaultModel || 'gpt-4o';
    
    const response = await this.client.chat.completions.create({
      model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens,
    });
    
    const choice = response.choices[0];
    
    return {
      content: choice.message.content || '',
      usage: {
        input: response.usage?.prompt_tokens || 0,
        output: response.usage?.completion_tokens || 0,
      },
      model,
      provider: this.provider,
    };
  }
  
  async *completeStream(
    messages: Message[],
    options: GenerateOptions = {}
  ): AsyncGenerator<Chunk> {
    const model = options.model || this.config.defaultModel || 'gpt-4o';
    
    const stream = await this.client.chat.completions.create({
      model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens,
      stream: true,
    });
    
    let inputTokens = 0;
    let outputTokens = 0;
    
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        outputTokens++;
        yield {
          content,
          done: false,
        };
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
    const model = options.model || this.config.defaultModel || 'gpt-4o';
    
    const response = await this.client.chat.completions.create({
      model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      temperature: options.temperature ?? 0.2,
      response_format: { type: 'json_object' },
    });
    
    const content = response.choices[0]?.message?.content || '{}';
    
    try {
      return JSON.parse(content) as T;
    } catch (error) {
      throw new Error(`Failed to parse JSON response: ${error}`);
    }
  }
}
