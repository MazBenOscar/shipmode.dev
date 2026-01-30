import { Command } from 'commander';
import inquirer from 'inquirer';
import { LLMService } from '../llm/service.js';
import { COLORS, showSuccess, showError } from '../utils/ui.js';
import type { SupportedProvider } from '../llm/types.js';

export function configCommand(program: Command): void {
  const configCmd = program
    .command('config')
    .description('Manage ShipMode configuration');
  
  configCmd
    .command('show')
    .description('Display current configuration')
    .action(async () => {
      const service = new LLMService();
      await service.initialize();
      service.displayConfig();
    });
  
  configCmd
    .command('set-provider')
    .description('Set default LLM provider')
    .argument('<provider>', 'Provider name (anthropic, openai, google, etc.)')
    .action(async (provider: string) => {
      const service = new LLMService();
      await service.initialize();
      
      const validProviders = service.getAvailableProviders();
      if (!validProviders.includes(provider as SupportedProvider)) {
        showError(`Invalid provider: ${provider}`);
        console.log(COLORS.muted(`Valid providers: ${validProviders.join(', ')}`));
        process.exit(1);
      }
      
      service.getConfigManager().setDefaultProvider(provider as SupportedProvider);
      await service.getConfigManager().save();
      
      showSuccess(`Default provider set to ${provider}`);
    });
  
  configCmd
    .command('set-model')
    .description('Set default model for a provider')
    .argument('<provider>', 'Provider name')
    .argument('<model>', 'Model name')
    .action(async (provider: string, model: string) => {
      const service = new LLMService();
      await service.initialize();
      
      const validProviders = service.getAvailableProviders();
      if (!validProviders.includes(provider as SupportedProvider)) {
        showError(`Invalid provider: ${provider}`);
        process.exit(1);
      }
      
      const availableModels = service.getAvailableModels(provider as SupportedProvider);
      if (!availableModels.includes(model)) {
        showError(`Invalid model: ${model}`);
        console.log(COLORS.muted(`Available models for ${provider}: ${availableModels.join(', ')}`));
        process.exit(1);
      }
      
      service.getConfigManager().setProviderModel(provider as SupportedProvider, model);
      await service.getConfigManager().save();
      
      showSuccess(`Default model for ${provider} set to ${model}`);
    });
  
  configCmd
    .command('set-api-key')
    .description('Set API key for a provider')
    .argument('<provider>', 'Provider name')
    .action(async (provider: string) => {
      const service = new LLMService();
      await service.initialize();
      
      const validProviders = service.getAvailableProviders();
      if (!validProviders.includes(provider as SupportedProvider)) {
        showError(`Invalid provider: ${provider}`);
        process.exit(1);
      }
      
      const { apiKey } = await inquirer.prompt([
        {
          type: 'password',
          name: 'apiKey',
          message: `Enter API key for ${provider}:`,
          mask: '*',
        },
      ]);
      
      service.getConfigManager().setProviderApiKey(provider as SupportedProvider, apiKey);
      await service.getConfigManager().save();
      
      showSuccess(`API key set for ${provider}`);
    });
  
  configCmd
    .command('wizard')
    .description('Interactive configuration wizard')
    .action(async () => {
      console.log(COLORS.bold.cyan('\n⚙️  ShipMode Configuration Wizard\n'));
      
      const service = new LLMService();
      await service.initialize();
      
      // Select default provider
      const { provider } = await inquirer.prompt([
        {
          type: 'list',
          name: 'provider',
          message: 'Select your default LLM provider:',
          choices: service.getAvailableProviders().map(p => ({
            name: `${p.charAt(0).toUpperCase() + p.slice(1)}`,
            value: p,
          })),
          default: service.getDefaultProvider(),
        },
      ]);
      
      service.getConfigManager().setDefaultProvider(provider);
      
      // Select model
      const availableModels = service.getAvailableModels(provider);
      const { model } = await inquirer.prompt([
        {
          type: 'list',
          name: 'model',
          message: `Select default model for ${provider}:`,
          choices: availableModels,
          default: service.getConfigManager().getProviderConfig(provider).defaultModel,
        },
      ]);
      
      service.getConfigManager().setProviderModel(provider, model);
      
      // API key (if not set via env)
      const currentConfig = service.getConfigManager().getProviderConfig(provider);
      if (!currentConfig.apiKey) {
        const { setKey } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'setKey',
            message: `No API key found for ${provider}. Set one now?`,
            default: true,
          },
        ]);
        
        if (setKey) {
          const { apiKey } = await inquirer.prompt([
            {
              type: 'password',
              name: 'apiKey',
              message: `Enter ${provider} API key:`,
              mask: '*',
            },
          ]);
          
          service.getConfigManager().setProviderApiKey(provider, apiKey);
        }
      }
      
      // Save config
      await service.getConfigManager().save();
      
      console.log();
      showSuccess('Configuration saved!');
      console.log();
      service.displayConfig();
    });
}
