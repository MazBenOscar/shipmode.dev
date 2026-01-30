import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import type { LLMAdapter, AdapterConfig } from './adapters/base.js';
import type { SupportedProvider, ProviderConfig } from './types.js';
import { AdapterFactory, getDefaultConfig } from './adapters/factory.js';
import { COLORS } from '../utils/ui.js';

export interface ShipModeConfig {
  defaultProvider: SupportedProvider;
  providers: Record<SupportedProvider, ProviderConfig>;
  lastUsed?: {
    provider: SupportedProvider;
    model: string;
    timestamp: string;
  };
}

const DEFAULT_CONFIG: ShipModeConfig = {
  defaultProvider: 'anthropic',
  providers: {
    anthropic: {
      provider: 'anthropic',
      apiKey: '',
      defaultModel: 'claude-sonnet-4-5-20250929',
      availableModels: [
        'claude-opus-4-5-20250929',
        'claude-sonnet-4-5-20250929',
        'claude-haiku-3-5-20250929',
      ],
    },
    openai: {
      provider: 'openai',
      apiKey: '',
      defaultModel: 'codex',
      availableModels: ['gpt-5.2', 'gpt-4o', 'gpt-4o-mini', 'codex'],
    },
    google: {
      provider: 'google',
      apiKey: '',
      defaultModel: 'gemini-3-pro',
      availableModels: ['gemini-3-pro', 'gemini-3-flash'],
    },
    moonshot: {
      provider: 'moonshot',
      apiKey: '',
      defaultModel: 'kimi-2-5',
      availableModels: ['kimi-2-5'],
    },
    minimax: {
      provider: 'minimax',
      apiKey: '',
      defaultModel: 'minimax-m2-1',
      availableModels: ['minimax-m2-1'],
    },
    ollama: {
      provider: 'ollama',
      apiKey: '',
      defaultModel: 'llama3',
      availableModels: ['llama3', 'llama3.1', 'mistral', 'codellama'],
    },
  },
};

export class ConfigManager {
  private configPath: string;
  private config: ShipModeConfig;
  
  constructor() {
    this.configPath = path.join(os.homedir(), '.shipmode', 'config.json');
    this.config = DEFAULT_CONFIG;
  }
  
  async load(): Promise<ShipModeConfig> {
    try {
      const data = await fs.readFile(this.configPath, 'utf-8');
      const loaded = JSON.parse(data);
      this.config = { ...DEFAULT_CONFIG, ...loaded };
      
      // Merge provider configs deeply
      for (const provider of Object.keys(DEFAULT_CONFIG.providers)) {
        if (loaded.providers?.[provider]) {
          this.config.providers[provider as SupportedProvider] = {
            ...DEFAULT_CONFIG.providers[provider as SupportedProvider],
            ...loaded.providers[provider],
          };
        }
      }
      
      // Load API keys from environment if not in config
      this.loadEnvApiKeys();
      
    } catch (error) {
      // Config doesn't exist yet, use defaults
      this.loadEnvApiKeys();
    }
    
    return this.config;
  }
  
  async save(): Promise<void> {
    const dir = path.dirname(this.configPath);
    await fs.mkdir(dir, { recursive: true });
    
    // Don't save API keys to file for security (unless explicitly requested)
    const configToSave = {
      ...this.config,
      providers: Object.fromEntries(
        Object.entries(this.config.providers).map(([key, value]) => [
          key,
          { ...value, apiKey: '' }, // Clear API keys before saving
        ])
      ),
    };
    
    await fs.writeFile(this.configPath, JSON.stringify(configToSave, null, 2));
  }
  
  getConfig(): ShipModeConfig {
    return this.config;
  }
  
  getProviderConfig(provider: SupportedProvider): ProviderConfig {
    return this.config.providers[provider];
  }
  
  setDefaultProvider(provider: SupportedProvider): void {
    this.config.defaultProvider = provider;
  }
  
  setProviderApiKey(provider: SupportedProvider, apiKey: string): void {
    this.config.providers[provider].apiKey = apiKey;
  }
  
  setProviderModel(provider: SupportedProvider, model: string): void {
    this.config.providers[provider].defaultModel = model;
  }
  
  recordUsage(provider: SupportedProvider, model: string): void {
    this.config.lastUsed = {
      provider,
      model,
      timestamp: new Date().toISOString(),
    };
  }
  
  private loadEnvApiKeys(): void {
    const envMap: Record<SupportedProvider, string> = {
      anthropic: 'ANTHROPIC_API_KEY',
      openai: 'OPENAI_API_KEY',
      google: 'GOOGLE_API_KEY',
      moonshot: 'MOONSHOT_API_KEY',
      minimax: 'MINIMAX_API_KEY',
      ollama: '',
    };
    
    for (const [provider, envKey] of Object.entries(envMap)) {
      if (envKey && process.env[envKey]) {
        this.config.providers[provider as SupportedProvider].apiKey = process.env[envKey]!;
      }
    }
  }
}

export class LLMService {
  private configManager: ConfigManager;
  private currentAdapter: LLMAdapter | null = null;
  
  constructor() {
    this.configManager = new ConfigManager();
  }
  
  async initialize(): Promise<void> {
    await this.configManager.load();
  }
  
  async getAdapter(provider?: SupportedProvider): Promise<LLMAdapter> {
    const config = this.configManager.getConfig();
    const selectedProvider = provider || config.defaultProvider;
    const providerConfig = config.providers[selectedProvider];
    
    if (!providerConfig.apiKey && selectedProvider !== 'ollama') {
      throw new Error(
        `No API key found for ${selectedProvider}. ` +
        `Set ${this.getEnvKey(selectedProvider)} environment variable or run: shipmode config set-api-key ${selectedProvider}`
      );
    }
    
    const adapterConfig: AdapterConfig = {
      apiKey: providerConfig.apiKey,
      defaultModel: providerConfig.defaultModel,
    };
    
    this.currentAdapter = AdapterFactory.create(selectedProvider, adapterConfig);
    return this.currentAdapter;
  }
  
  getConfigManager(): ConfigManager {
    return this.configManager;
  }
  
  getAvailableProviders(): SupportedProvider[] {
    return Object.keys(this.configManager.getConfig().providers) as SupportedProvider[];
  }
  
  getAvailableModels(provider: SupportedProvider): string[] {
    return this.configManager.getProviderConfig(provider).availableModels;
  }
  
  getDefaultProvider(): SupportedProvider {
    return this.configManager.getConfig().defaultProvider;
  }
  
  displayConfig(): void {
    const config = this.configManager.getConfig();
    
    console.log(COLORS.bold.cyan('\n⚙️  ShipMode Configuration\n'));
    console.log(COLORS.cyan('Default Provider:'), config.defaultProvider);
    console.log();
    
    console.log(COLORS.bold('Configured Providers:\n'));
    
    for (const [provider, pc] of Object.entries(config.providers)) {
      const hasKey = pc.apiKey ? COLORS.green('✓') : COLORS.gray('○');
      console.log(`  ${hasKey}  ${COLORS.bold(provider.padEnd(12))} ${pc.defaultModel}`);
    }
    
    if (config.lastUsed) {
      console.log();
      console.log(COLORS.muted(`Last used: ${config.lastUsed.provider} (${config.lastUsed.model})`));
    }
    
    console.log();
  }
  
  private getEnvKey(provider: SupportedProvider): string {
    const map: Record<SupportedProvider, string> = {
      anthropic: 'ANTHROPIC_API_KEY',
      openai: 'OPENAI_API_KEY',
      google: 'GOOGLE_API_KEY',
      moonshot: 'MOONSHOT_API_KEY',
      minimax: 'MINIMAX_API_KEY',
      ollama: '',
    };
    return map[provider];
  }
}
