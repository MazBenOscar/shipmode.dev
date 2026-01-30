import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { analyzeCodebase } from '../core/analyzer.js';
import { proposeStack } from '../core/stack-proposer.js';
import { generateShipmodeConfig } from '../core/config-generator.js';
import type { IdeaAnswers } from '../types/index.js';

interface InitOptions {
  fromIdea?: boolean;
  fromCode?: boolean;
}

export async function initCommand(options: InitOptions): Promise<void> {
  console.log(chalk.bold.cyan('\n🚀 Welcome to ShipMode\n'));

  if (options.fromIdea) {
    await initFromIdea();
  } else if (options.fromCode) {
    await initFromCode();
  } else {
    // Interactive mode
    const { mode } = await inquirer.prompt([
      {
        type: 'list',
        name: 'mode',
        message: 'How would you like to start?',
        choices: [
          { name: '🌱  Start from an idea', value: 'idea' },
          { name: '🚀  Start from existing code', value: 'code' },
        ],
      },
    ]);

    if (mode === 'idea') {
      await initFromIdea();
    } else {
      await initFromCode();
    }
  }
}

async function initFromIdea(): Promise<void> {
  console.log(chalk.cyan("\nLet's understand your idea...\n"));

  const answers = await inquirer.prompt<IdeaAnswers>([
    {
      type: 'input',
      name: 'description',
      message: 'What are you building? (1-2 sentences)',
      validate: (input) => input.length > 10 || 'Please provide a bit more detail',
    },
    {
      type: 'input',
      name: 'targetUsers',
      message: 'Who are the users? (consumers, businesses, internal team)',
    },
    {
      type: 'list',
      name: 'expectedUsers',
      message: 'Expected users in year 1?',
      choices: [
        { name: 'Hundreds', value: 'small' },
        { name: 'Thousands', value: 'medium' },
        { name: 'Millions', value: 'large' },
      ],
    },
    {
      type: 'confirm',
      name: 'realTimeFeatures',
      message: 'Do you need real-time features (chat, notifications, live updates)?',
      default: false,
    },
    {
      type: 'list',
      name: 'teamSize',
      message: 'Team size?',
      choices: [
        { name: 'Solo founder', value: 'solo' },
        { name: 'Small team (2-10)', value: 'small' },
        { name: 'Large team (10+)', value: 'large' },
      ],
    },
    {
      type: 'input',
      name: 'preferredLanguage',
      message: 'Preferred language? (TypeScript, Python, Go, or "don\'t care")',
      default: "don't care",
    },
    {
      type: 'list',
      name: 'needsAuth',
      message: 'Authentication needs?',
      choices: [
        { name: 'None / Public', value: 'none' },
        { name: 'Simple (email/password)', value: 'simple' },
        { name: 'Enterprise (SSO, SAML)', value: 'enterprise' },
      ],
    },
    {
      type: 'list',
      name: 'needsPayments',
      message: 'Payment processing?',
      choices: [
        { name: 'None', value: 'none' },
        { name: 'Simple (subscriptions)', value: 'simple' },
        { name: 'Complex (marketplace)', value: 'complex' },
      ],
    },
    {
      type: 'list',
      name: 'needsMobile',
      message: 'Mobile app?',
      choices: [
        { name: 'No', value: 'none' },
        { name: 'PWA (web app)', value: 'pwa' },
        { name: 'Native app', value: 'native' },
      ],
    },
  ]);

  const spinner = ora('Analyzing your requirements...').start();
  
  try {
    const proposal = await proposeStack(answers);
    spinner.succeed('Analysis complete!');

    console.log(chalk.bold('\n📋 Proposed Tech Stack:\n'));
    console.log(chalk.cyan('Stack:'), proposal.stack.join(', '));
    console.log(chalk.gray('\nRationale:'), proposal.rationale);
    
    if (proposal.alternatives.length > 0) {
      console.log(chalk.gray('\nAlternatives:'), proposal.alternatives.join(', '));
    }

    const { approved } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'approved',
        message: 'Does this stack look good?',
        default: true,
      },
    ]);

    if (approved) {
      const genSpinner = ora('Generating ShipMode configuration...').start();
      await generateShipmodeConfig({
        mode: 'idea',
        stack: proposal.stack,
        idea: answers,
      });
      genSpinner.succeed('ShipMode initialized!');
      
      console.log(chalk.green('\n✓ .shipmode/ directory created'));
      console.log(chalk.gray('\nNext steps:'));
      console.log(chalk.gray('  1. Review .shipmode/SHIPMODE.md'));
      console.log(chalk.gray('  2. Run: shipmode run "Scaffold initial project"'));
    } else {
      console.log(chalk.yellow('\nNo problem! You can customize the stack later.'));
    }
  } catch (error) {
    spinner.fail('Analysis failed');
    console.error(error);
    process.exit(1);
  }
}

async function initFromCode(): Promise<void> {
  const spinner = ora('Analyzing codebase...').start();

  try {
    const profile = await analyzeCodebase('.');
    spinner.succeed('Analysis complete!');

    console.log(chalk.bold('\n📊 Codebase Profile:\n'));
    console.log(chalk.cyan('Languages:'), profile.languages.join(', '));
    console.log(chalk.cyan('Frameworks:'), profile.frameworks.join(', '));
    console.log(chalk.cyan('App Type:'), profile.appType);
    if (profile.db) console.log(chalk.cyan('Database:'), profile.db.join(', '));
    if (profile.infra) console.log(chalk.cyan('Infra:'), profile.infra.join(', '));

    const genSpinner = ora('Generating ShipMode configuration...').start();
    await generateShipmodeConfig({
      mode: 'code',
      profile,
    });
    genSpinner.succeed('ShipMode initialized!');

    console.log(chalk.green('\n✓ .shipmode/ directory created'));
    console.log(chalk.gray('\nGenerated files:'));
    console.log(chalk.gray('  - .shipmode/SHIPMODE.md'));
    console.log(chalk.gray('  - .shipmode/skills/*.md'));
    console.log(chalk.gray('  - .shipmode/crew/*.md'));
    console.log(chalk.gray('\nNext: shipmode run "Your task here"'));
  } catch (error) {
    spinner.fail('Analysis failed');
    console.error(error);
    process.exit(1);
  }
}
