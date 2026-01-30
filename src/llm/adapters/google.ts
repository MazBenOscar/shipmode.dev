import { GoogleGenAI } from '@google/genai';
import type { LLMAdapter, AdapterConfig } from './base.js';
import type { Message, Chunk, LLMResponse, GenerateOptions } from '../types.js';

export class GoogleAdapter implements LLMAdapter {
  readonly provider = 'google';
  readonly name = 'Google Gemini';
  
  private client: GoogleGenAI;
  private config: AdapterConfig;
  
  constructor(config: AdapterConfig) {
    this.config = config;
    this.client = new GoogleGenAI({ apiKey: config.apiKey });
  }
  
  async validateConfig(): Promise<boolean> {
    try {
      const model = this.config.defaultModel || 'gemini-3-pro';
      await this.client.models.getModel({ model });
      return true;
    } catch (error) {
      return false;
    }
  }
  
  async complete(
    messages: Message[],
    options: GenerateOptions = {}
  ): Promise<LLMResponse> {
    const model = options.model || this.config.defaultModel || 'gemini-3-pro';
    
    // Convert messages to Gemini format
    const contents = this.convertMessagesToContents(messages);
    
    const response = await this.client.models.generateContent({
      model,
      contents,
      config: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens,
      },
    });
    
    return {
      content: response.text || '',
      usage: {
        input: response.usageMetadata?.promptTokenCount || 0,
        output: response.usageMetadata?.candidatesTokenCount || 0,
      },
      model,
      provider: this.provider,
    };
  }
  
  async *completeStream(
    messages: Message[],
    options: GenerateOptions = {}
  ): AsyncGenerator<Chunk> {
    const model = options.model || this.config.defaultModel || 'gemini-3-pro';
    
    const contents = this.convertMessagesToContents(messages);
    
    const stream = await this.client.models.generateContentStream({
      model,
      contents,
      config: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens,
      },
    });
    
    let inputTokens = 0;
    let outputTokens = 0;
    
    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) {
        outputTokens++;
        yield {
          content: text,
          done: false,
        };
      }
      if (chunk.usageMetadata) {
        inputTokens = chunk.usageMetadata.promptTokenCount || 0;
        outputTokens = chunk.usageMetadata.candidatesTokenCount || 0;
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
    const model = options.model || this.config.defaultModel || 'gemini-3-pro';
    
    const contents = this.convertMessagesToContents(messages);
    
    // Add JSON instruction to the last user message
    const jsonInstruction = `\n\nRespond with valid JSON matching this schema: ${JSON.stringify(schema)}`;
    if (contents.length > 0) {
      const lastContent = contents[contents.length - 1];
      if (lastContent.role === 'user' && typeof lastContent.parts[0].text === 'string') {
        lastContent.parts[0].text += jsonInstruction;
      }
    }
    
    const response = await this.client.models.generateContent({
      model,
      contents,
      config: {
        temperature: options.temperature ?? 0.2,
        responseMimeType: 'application/json',
      },
    });
    
    const content = response.text || '{}';
    
    try {
      return JSON.parse(content) as T;
    } catch (error) {
      throw new Error(`Failed to parse JSON response: ${error}`);
    }
  }
  
  private convertMessagesToContents(messages: Message[]) {
    const systemMessage = messages.find(m => m.role === 'system')?.content || '';
    
    return messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: systemMessage ? `${systemMessage}\n\n${m.content}` : m.content }],
      }));
  }
}
