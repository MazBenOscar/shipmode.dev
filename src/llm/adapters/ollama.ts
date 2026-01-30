import type { LLMAdapter, AdapterConfig } from './base.js';
import type { Message, Chunk, LLMResponse, GenerateOptions } from '../types.js';

/**
 * Ollama adapter - local LLM server
 * Base URL: http://localhost:11434
 */
export class OllamaAdapter implements LLMAdapter {
  readonly provider = 'ollama';
  readonly name = 'Ollama';
  
  private config: AdapterConfig;
  private baseUrl: string;
  
  constructor(config: AdapterConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || 'http://localhost:11434';
  }
  
  async validateConfig(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
  
  async complete(
    messages: Message[],
    options: GenerateOptions = {}
  ): Promise<LLMResponse> {
    const model = options.model || this.config.defaultModel || 'llama3';
    
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        stream: false,
        options: {
          temperature: options.temperature ?? 0.7,
          num_predict: options.maxTokens,
        },
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Ollama request failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return {
      content: data.message?.content || '',
      usage: {
        input: data.prompt_eval_count || 0,
        output: data.eval_count || 0,
      },
      model,
      provider: this.provider,
    };
  }
  
  async *completeStream(
    messages: Message[],
    options: GenerateOptions = {}
  ): AsyncGenerator<Chunk> {
    const model = options.model || this.config.defaultModel || 'llama3';
    
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        stream: true,
        options: {
          temperature: options.temperature ?? 0.7,
          num_predict: options.maxTokens,
        },
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Ollama request failed: ${response.statusText}`);
    }
    
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }
    
    const decoder = new TextDecoder();
    let inputTokens = 0;
    let outputTokens = 0;
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          
          if (data.message?.content) {
            outputTokens++;
            yield {
              content: data.message.content,
              done: false,
            };
          }
          
          if (data.prompt_eval_count) {
            inputTokens = data.prompt_eval_count;
          }
        } catch {
          // Ignore parse errors for incomplete chunks
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
    const model = options.model || this.config.defaultModel || 'llama3';
    
    // Add schema instruction to system prompt
    const schemaInstruction = `\n\nYou must respond with valid JSON that matches this schema:\n${JSON.stringify(schema, null, 2)}\n\nRespond ONLY with JSON, no markdown formatting.`;
    
    const modifiedMessages = messages.map(m => 
      m.role === 'system' 
        ? { ...m, content: m.content + schemaInstruction }
        : m
    );
    
    if (!modifiedMessages.find(m => m.role === 'system')) {
      modifiedMessages.unshift({
        role: 'system',
        content: `You are a helpful assistant. ${schemaInstruction}`,
      });
    }
    
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: modifiedMessages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        stream: false,
        format: 'json',
        options: {
          temperature: options.temperature ?? 0.2,
        },
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Ollama request failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    const content = data.message?.content || '{}';
    
    try {
      return JSON.parse(content) as T;
    } catch (error) {
      throw new Error(`Failed to parse JSON response: ${error}`);
    }
  }
}
