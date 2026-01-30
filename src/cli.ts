#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from './commands/init.js';
import { analyzeCommand } from './commands/analyze.js';
import { runCommand } from './commands/run.js';
import { configCommand } from './commands/config.js';

const program = new Command();

program
  .name('shipmode')
  .description('Your codebase\'s autopilot. From idea to production with AI crew.')
  .version('0.2.0');

program
  .command('init')
  .description('Initialize ShipMode for your project')
  .option('--from-idea', 'Start from an idea (interview mode)')
  .option('--from-code', 'Start from existing codebase (analysis mode)')
  .option('--provider <provider>', 'LLM provider (anthropic, openai, google, moonshot, minimax, ollama)')
  .option('--model <model>', 'Specific model to use')
  .option('--target <target>', 'Target agent format (claude, codex, generic)', 'claude')
  .action(initCommand);

program
  .command('analyze')
  .description('Analyze codebase and output profile JSON')
  .argument('[path]', 'Path to analyze', '.')
  .option('--json', 'Output as JSON')
  .action(analyzeCommand);

program
  .command('run')
  .description('Execute a task with your AI crew')
  .argument('<task>', 'Task description')
  .option('--dry-run', 'Show plan without executing')
  .option('--provider <provider>', 'LLM provider to use')
  .option('--model <model>', 'Model to use')
  .action(runCommand);

// Add config commands
configCommand(program);

program.on('--help', () => {
  console.log('');
  console.log(chalk.cyan('Examples:'));
  console.log('  $ shipmode init --from-idea');
  console.log('  $ shipmode init --from-code --provider openai --model codex');
  console.log('  $ shipmode init --from-code --target codex');
  console.log('  $ shipmode analyze ./my-project --json');
  console.log('  $ shipmode run "Build a checkout flow with Stripe"');
  console.log('  $ shipmode config wizard');
});

program.parse();
