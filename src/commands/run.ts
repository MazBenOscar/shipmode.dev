import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';
import { LLMService } from '../llm/service.js';
import { AgentExecutor } from '../llm/agent-executor.js';
import { COLORS, showSuccess, showError, showDivider } from '../utils/ui.js';
import type { SupportedProvider } from '../llm/types.js';

interface RunOptions {
  dryRun?: boolean;
  provider?: string;
  model?: string;
}

export async function runCommand(task: string, options: RunOptions): Promise<void> {
  // Check if ShipMode is initialized
  const shipmodeDir = path.join(process.cwd(), '.shipmode');
  
  try {
    await fs.access(shipmodeDir);
  } catch {
    console.error(COLORS.red('Error: ShipMode not initialized.'));
    console.log(COLORS.gray('Run: shipmode init --from-code  (or --from-idea)'));
    process.exit(1);
  }

  // Check for CLAUDE.md or equivalent
  const claudeMdPath = path.join(shipmodeDir, 'SHIPMODE.md');
  const codexMdPath = path.join(process.cwd(), 'CODEX.md');
  const hasConfig = await fileExists(claudeMdPath) || await fileExists(codexMdPath);
  
  if (!hasConfig) {
    console.error(COLORS.red('Error: No configuration file found.'));
    console.log(COLORS.gray('Expected: .shipmode/SHIPMODE.md or CODEX.md'));
    process.exit(1);
  }

  console.log(COLORS.bold.cyan('\n🚀 ShipMode Agent\n'));
  console.log(COLORS.gray('Task:'), task);
  console.log();

  // Initialize LLM service
  const llmService = new LLMService();
  await llmService.initialize();

  if (options.dryRun) {
    console.log(COLORS.yellow('📋 Dry Run Mode - Planning only\n'));
    await simulatePlanning(task);
    return;
  }

  // Get provider
  let provider: SupportedProvider;
  if (options.provider) {
    provider = options.provider as SupportedProvider;
  } else {
    provider = llmService.getDefaultProvider();
  }

  console.log(COLORS.gray('Using provider:'), provider);
  console.log();

  try {
    // Get adapter
    const adapter = await llmService.getAdapter(provider);
    
    // Create executor
    const executor = new AgentExecutor(adapter, shipmodeDir);
    
    // Load context from SHIPMODE.md
    let context = '';
    try {
      context = await fs.readFile(claudeMdPath, 'utf-8');
    } catch {
      // Try CODEX.md
      try {
        context = await fs.readFile(codexMdPath, 'utf-8');
      } catch {
        // No context available
      }
    }

    // Execute task
    const result = await executor.execute({
      description: task,
      context: context.slice(0, 4000), // Limit context size
      maxIterations: 50,
    });

    // Display results
    showDivider();
    console.log();
    
    if (result.success) {
      showSuccess('Task completed successfully!');
    } else {
      console.log(COLORS.yellow('⚠️  Task completed with some issues'));
    }
    
    console.log();
    console.log(COLORS.bold('Summary:'));
    console.log(result.summary);
    
    if (result.filesModified.length > 0) {
      console.log();
      console.log(COLORS.bold('Files modified:'));
      result.filesModified.forEach(file => {
        console.log(`  ${COLORS.gray('→')} ${file}`);
      });
    }
    
    console.log();
    console.log(COLORS.gray('Steps completed:'), 
      result.executedSteps.filter(s => s.status === 'completed').length,
      '/',
      result.plan.steps.length
    );
    
    if (!result.success) {
      const failedSteps = result.executedSteps.filter(s => s.status === 'failed');
      if (failedSteps.length > 0) {
        console.log();
        console.log(COLORS.red('Failed steps:'));
        failedSteps.forEach(step => {
          console.log(`  ✗ ${step.description}`);
          if (step.error) {
            console.log(`    ${COLORS.gray(step.error)}`);
          }
        });
      }
    }
    
    console.log();

  } catch (error) {
    console.error(COLORS.red('Error executing task:'), error);
    process.exit(1);
  }
}

async function simulatePlanning(task: string): Promise<void> {
  const spinner = ora('Planning implementation...').start();
  await delay(1000);
  
  const steps = [
    'Read SHIPMODE.md for project context',
    'Load relevant skills from .shipmode/skills/',
    'Identify affected files and modules',
    'Draft implementation plan',
    'Estimate effort and dependencies',
  ];
  
  spinner.succeed('Planning complete');
  console.log();
  
  console.log(COLORS.bold('Proposed Plan:\n'));
  steps.forEach((step, i) => {
    console.log(COLORS.cyan(`${i + 1}.`), step);
  });
  
  console.log();
  console.log(COLORS.gray('This is a simulation. In actual execution, the agent would:'));
  console.log(COLORS.gray('  - Read and understand your codebase'));
  console.log(COLORS.gray('  - Generate/edit code files'));
  console.log(COLORS.gray('  - Run tests and linters'));
  console.log(COLORS.gray('  - Create commits/PRs'));
  console.log();
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
