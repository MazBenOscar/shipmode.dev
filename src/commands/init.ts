import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { analyzeCodebase } from '../core/analyzer.js';
import { generateShipmodeConfig as generateBasicConfig } from '../core/config-generator.js';
import { LLMService } from '../llm/service.js';
import { ConfigGenerator } from '../llm/generators.js';
import { 
  showWelcome, 
  showSuccess, 
  showInfo, 
  showDivider,
  showNextSteps,
  COLORS,
  ROCKET 
} from '../utils/ui.js';
import type { IdeaAnswers } from '../types/index.js';
import type { SupportedProvider, TargetAgent } from '../llm/types.js';

interface InitOptions {
  fromIdea?: boolean;
  fromCode?: boolean;
  provider?: string;
  model?: string;
  target?: TargetAgent;
}

export async function initCommand(options: InitOptions): Promise<void> {
  showWelcome();

  // Initialize LLM service
  const llmService = new LLMService();
  await llmService.initialize();

  // Determine provider and model
  let provider: SupportedProvider | undefined;
  let model: string | undefined;
  
  if (options.provider) {
    provider = options.provider as SupportedProvider;
  }
  
  if (options.model) {
    model = options.model;
  }

  if (options.fromIdea) {
    await initFromIdea(llmService, provider, model);
  } else if (options.fromCode) {
    await initFromCode(llmService, provider, model, options.target);
  } else {
    // Interactive mode
    const { mode } = await inquirer.prompt([
      {
        type: 'list',
        name: 'mode',
        message: COLORS.primary('How would you like to start?'),
        choices: [
          { 
            name: `${chalk.yellow('🌱')}  Start from an idea`, 
            value: 'idea',
            short: 'From idea'
          },
          { 
            name: `${chalk.cyan('🚀')}  Start from existing code`, 
            value: 'code',
            short: 'From code'
          },
        ],
      },
    ]);

    if (mode === 'idea') {
      await initFromIdea(llmService, provider, model);
    } else {
      await initFromCode(llmService, provider, model, options.target);
    }
  }
}

async function initFromIdea(
  llmService: LLMService,
  provider?: SupportedProvider,
  model?: string
): Promise<void> {
  console.log(COLORS.bold('\n🌱  Starting from an Idea\n'));
  console.log(COLORS.muted("Let's understand what you're building...\n"));

  const answers = await inquirer.prompt<IdeaAnswers>([
    {
      type: 'input',
      name: 'description',
      message: COLORS.primary('What are you building?') + COLORS.muted(' (1-2 sentences)'),
      validate: (input) => input.length > 10 || 'Please provide a bit more detail',
    },
    {
      type: 'input',
      name: 'targetUsers',
      message: COLORS.primary('Who are the users?'),
      default: 'consumers',
    },
    {
      type: 'list',
      name: 'expectedUsers',
      message: COLORS.primary('Expected scale in year 1?'),
      choices: [
        { name: '👤  Hundreds', value: 'small' },
        { name: '👥  Thousands', value: 'medium' },
        { name: '🌎  Millions', value: 'large' },
      ],
    },
    {
      type: 'confirm',
      name: 'realTimeFeatures',
      message: COLORS.primary('Need real-time features?') + COLORS.muted(' (chat, notifications)'),
      default: false,
    },
    {
      type: 'list',
      name: 'teamSize',
      message: COLORS.primary('Team size?'),
      choices: [
        { name: '🎯  Solo founder', value: 'solo' },
        { name: '👥  Small team (2-10)', value: 'small' },
        { name: '🏢  Large team (10+)', value: 'large' },
      ],
    },
    {
      type: 'input',
      name: 'preferredLanguage',
      message: COLORS.primary('Preferred language?'),
      default: "TypeScript",
    },
    {
      type: 'list',
      name: 'needsAuth',
      message: COLORS.primary('Authentication needs?'),
      choices: [
        { name: '🌐  None / Public', value: 'none' },
        { name: '🔐  Simple (email/password)', value: 'simple' },
        { name: '🏢  Enterprise (SSO)', value: 'enterprise' },
      ],
    },
    {
      type: 'list',
      name: 'needsPayments',
      message: COLORS.primary('Payment processing?'),
      choices: [
        { name: '❌  None', value: 'none' },
        { name: '💳  Simple (subscriptions)', value: 'simple' },
        { name: '🏪  Complex (marketplace)', value: 'complex' },
      ],
    },
    {
      type: 'list',
      name: 'needsMobile',
      message: COLORS.primary('Mobile app?'),
      choices: [
        { name: '🖥️  No', value: 'none' },
        { name: '📱  PWA (web app)', value: 'pwa' },
        { name: '📲  Native app', value: 'native' },
      ],
    },
  ]);

  showDivider();

  // Check if we should use LLM for stack proposal
  const useLLM = !!provider || llmService.getConfigManager().getProviderConfig(
    llmService.getDefaultProvider()
  ).apiKey;

  let proposal: { stack: string[]; rationale: string; alternatives: string[] };

  if (useLLM) {
    const spinner = ora({
      text: COLORS.muted('Consulting AI for optimal stack...'),
      spinner: 'dots12',
    }).start();

    try {
      const adapter = await llmService.getAdapter(provider);
      const generator = new ConfigGenerator(adapter);
      proposal = await generator.generateStackProposal(answers);
      spinner.succeed(COLORS.success('AI recommendation complete!'));
    } catch (error) {
      spinner.warn(COLORS.warning('AI unavailable, using rule-based fallback'));
      // Fallback to rule-based
      const { proposeStack } = await import('../core/stack-proposer.js');
      proposal = await proposeStack(answers);
    }
  } else {
    const spinner = ora({
      text: COLORS.muted('Analyzing requirements...'),
      spinner: 'dots12',
    }).start();
    
    const { proposeStack } = await import('../core/stack-proposer.js');
    proposal = await proposeStack(answers);
    spinner.succeed(COLORS.success('Analysis complete!'));
  }

  console.log();
  console.log(COLORS.bold.cyan('📋  Proposed Tech Stack\n'));
  
  proposal.stack.forEach((tech, i) => {
    const icon = getTechIcon(tech);
    console.log(`  ${icon}  ${COLORS.bold(tech)}`);
  });

  console.log();
  console.log(COLORS.muted('Why this stack?'));
  console.log(`  ${proposal.rationale}`);
  
  if (proposal.alternatives.length > 0) {
    console.log();
    console.log(COLORS.muted('Alternatives:'));
    console.log(`  ${proposal.alternatives.join(', ')}`);
  }

  console.log();

  const { approved } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'approved',
      message: COLORS.primary('Does this stack look good?'),
      default: true,
    },
  ]);

  if (approved) {
    const genSpinner = ora({
      text: COLORS.muted('Generating ShipMode configuration...'),
      spinner: 'dots',
    }).start();
    
    await generateBasicConfig({
      mode: 'idea',
      stack: proposal.stack,
      idea: answers,
    });
    
    genSpinner.succeed(COLORS.success('ShipMode initialized!'));
    
    console.log();
    console.log(ROCKET);
    console.log();
    
    showSuccess('.shipmode/ directory created');
    
    showNextSteps([
      COLORS.bold('Review ') + COLORS.muted('.shipmode/SHIPMODE.md'),
      COLORS.bold('Run ') + COLORS.muted('shipmode run "Scaffold initial project"'),
      COLORS.bold('Start building ') + COLORS.muted('your features'),
    ]);
  } else {
    console.log();
    console.log(COLORS.warning('No problem! You can customize the stack later.'));
    console.log(COLORS.muted('Run "shipmode init --from-idea" anytime to try again.'));
  }
}

async function initFromCode(
  llmService: LLMService,
  provider?: SupportedProvider,
  model?: string,
  target: TargetAgent = 'claude'
): Promise<void> {
  console.log(COLORS.bold('\n🚀  Analyzing Your Codebase\n'));

  const spinner = ora({
    text: COLORS.muted('Scanning files and detecting patterns...'),
    spinner: 'dots12',
  }).start();

  try {
    const profile = await analyzeCodebase('.');
    spinner.succeed(COLORS.success('Analysis complete!'));

    console.log();
    console.log(COLORS.bold.cyan('📊  Detected Tech Stack\n'));
    
    showInfo('Languages', profile.languages.join(', '));
    showInfo('Frameworks', profile.frameworks.join(', '));
    showInfo('App Type', profile.appType);
    
    if (profile.db) {
      showInfo('Database', profile.db.join(', '));
    }
    
    if (profile.infra) {
      showInfo('Infrastructure', profile.infra.join(', '));
    }
    
    if (profile.entryPoints.length > 0) {
      console.log();
      console.log(COLORS.muted('Entry Points:'));
      profile.entryPoints.slice(0, 3).forEach(ep => {
        console.log(`  ${COLORS.gray('→')} ${ep}`);
      });
    }

    console.log();

    const { confirmed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message: COLORS.primary('Did we get this right?'),
        default: true,
      },
    ]);

    if (!confirmed) {
      console.log();
      console.log(COLORS.warning('Let\'s fix what we missed...'));
      // TODO: Allow user to correct detection
    }

    showDivider();

    // Check if we should use LLM for enhanced generation
    const useLLM = !!provider || llmService.getConfigManager().getProviderConfig(
      llmService.getDefaultProvider()
    ).apiKey;

    const genSpinner = ora({
      text: useLLM 
        ? COLORS.muted(`Generating AI-enhanced configuration via ${provider || llmService.getDefaultProvider()}...`)
        : COLORS.muted('Generating configuration...'),
      spinner: 'dots',
    }).start();
    
    if (useLLM) {
      try {
        const adapter = await llmService.getAdapter(provider);
        const generator = new ConfigGenerator(adapter);
        
        // Generate based on target agent
        let generated;
        switch (target) {
          case 'codex':
            generated = await generator.generateForCodex(profile);
            break;
          case 'claude':
          default:
            generated = await generator.generateForClaudeCode(profile);
            break;
        }
        
        // Write generated files
        const fs = await import('fs/promises');
        const path = await import('path');
        
        for (const file of generated.files) {
          let filePath: string;
          
          // Place commands and hooks in appropriate locations
          if (file.path === 'commands.md') {
            filePath = path.default.join('.shipmode', 'commands', 'index.md');
          } else if (file.path === 'hooks.json') {
            filePath = path.default.join('.shipmode', 'hooks', 'hooks.json');
          } else {
            filePath = path.default.join('.shipmode', file.path);
          }
          
          await fs.default.mkdir(path.default.dirname(filePath), { recursive: true });
          await fs.default.writeFile(filePath, file.content);
        }
        
        // Also generate basic skills
        for (const framework of profile.frameworks.slice(0, 3)) {
          // Find code samples for this framework
          const { glob } = await import('fast-glob');
          const samples = await glob(`**/*.{ts,tsx,js,jsx}`, { 
            cwd: process.cwd(),
            absolute: false,
          });
          
          const codeSamples: string[] = [];
          for (const sample of samples.slice(0, 2)) {
            try {
              const content = await fs.default.readFile(sample, 'utf-8');
              codeSamples.push(content.slice(0, 2000));
            } catch {
              // Skip files we can't read
            }
          }
          
          if (codeSamples.length > 0) {
            const skillContent = await generator.generateSkill(framework, codeSamples, profile);
            const skillPath = path.default.join('.shipmode', 'skills', `${framework.toLowerCase().replace(/[^a-z]/g, '-')}.md`);
            await fs.default.writeFile(skillPath, skillContent);
          }
        }
        
        genSpinner.succeed(COLORS.success('AI-enhanced configuration generated!'));
      } catch (error) {
        genSpinner.warn(COLORS.warning('AI generation failed, using fallback'));
        await generateBasicConfig({ mode: 'code', profile });
      }
    } else {
      await generateBasicConfig({ mode: 'code', profile });
      genSpinner.succeed(COLORS.success('ShipMode initialized!'));
    }

    console.log();
    console.log(ROCKET);
    console.log();

    showSuccess('.shipmode/ directory created');
    
    console.log();
    console.log(COLORS.muted('Generated files:'));
    console.log(`  ${COLORS.gray('→')} .shipmode/${target === 'codex' ? 'CODEX.md' : 'SHIPMODE.md'}`);
    console.log(`  ${COLORS.gray('→')} .shipmode/skills/*.md (${profile.frameworks.length} skills)`);
    console.log(`  ${COLORS.gray('→')} .shipmode/crew/*.md (3 crew agents)`);
    console.log(`  ${COLORS.gray('→')} .shipmode/commands/index.md (custom commands)`);
    console.log(`  ${COLORS.gray('→')} .shipmode/hooks/hooks.json (automation hooks)`);

    showNextSteps([
      COLORS.bold('Review ') + COLORS.muted(`.shipmode/${target === 'codex' ? 'CODEX.md' : 'SHIPMODE.md'}`),
      COLORS.bold('Customize ') + COLORS.muted('skills in .shipmode/skills/'),
      COLORS.bold('Run ') + COLORS.muted('shipmode run "Your task here"'),
    ]);

  } catch (error) {
    spinner.fail(COLORS.error('Analysis failed'));
    console.error(error);
    process.exit(1);
  }
}

function getTechIcon(tech: string): string {
  const icons: Record<string, string> = {
    'Next.js': '▲',
    'React': '⚛',
    'TypeScript': '◈',
    'Tailwind CSS': '🌊',
    'PostgreSQL': '🐘',
    'Prisma': '◆',
    'tRPC': '⚡',
    'Stripe': '💳',
    'Vercel': '▲',
  };
  
  for (const [key, icon] of Object.entries(icons)) {
    if (tech.includes(key)) return icon;
  }
  return '●';
}
