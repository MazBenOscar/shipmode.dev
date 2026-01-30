import type { LLMAdapter, AdapterConfig } from './base.js';
import type { SupportedProvider } from '../types.js';
import { AnthropicAdapter } from './anthropic.js';
import { OpenAIAdapter } from './openai.js';

export class AdapterFactory {
  private static adapters = new Map<string, LLMAdapter>();
  
  static create(provider: SupportedProvider, config: AdapterConfig): LLMAdapter {
    // Check if we already have an instance
    const cacheKey = `${provider}-${config.apiKey.slice(-8)}`;
    if (this.adapters.has(cacheKey)) {
      return this.adapters.get(cacheKey)!;
    }
    
    let adapter: LLMAdapter;
    
    switch (provider) {
      case 'anthropic':
        adapter = new AnthropicAdapter(config);
        break;
      case 'openai':
        adapter = new OpenAIAdapter(config);
        break;
      case 'google':
        throw new Error('Google adapter not yet implemented');
      case 'moonshot':
        throw new Error('Moonshot adapter not yet implemented');
      case 'minimax':
        throw new Error('MiniMax adapter not yet implemented');
      case 'ollama':
        throw new Error('Ollama adapter not yet implemented');
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
    
    this.adapters.set(cacheKey, adapter);
    return adapter;
  }
  
  static clearCache(): void {
    this.adapters.clear();
  }
}

export function getDefaultConfig(provider: SupportedProvider): Partial<AdapterConfig> {
  const envKeyMap: Record<SupportedProvider, string> = {
    anthropic: 'ANTHROPIC_API_KEY',
    openai: 'OPENAI_API_KEY',
    google: 'GOOGLE_API_KEY',
    moonshot: 'MOONSHOT_API_KEY',
    minimax: 'MINIMAX_API_KEY',
    ollama: '', // Ollama doesn't require API key
  };
  
  const apiKey = process.env[envKeyMap[provider]] || '';
  
  return {
    apiKey,
    defaultModel: getDefaultModel(provider),
  };
}

function getDefaultModel(provider: SupportedProvider): string {
  const defaults: Record<SupportedProvider, string> = {
    anthropic: 'claude-sonnet-4-5-20250929',
    openai: 'codex',
    google: 'gemini-3-pro',
    moonshot: 'kimi-2-5',
    minimax: 'minimax-m2-1',
    ollama: 'llama3',
  };
  
  return defaults[provider];
}
