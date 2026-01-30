import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';

interface RunOptions {
  dryRun?: boolean;
}

export async function runCommand(task: string, options: RunOptions): Promise<void> {
  // Check if ShipMode is initialized
  const shipmodeDir = path.join(process.cwd(), '.shipmode');
  
  try {
    await fs.access(shipmodeDir);
  } catch {
    console.error(chalk.red('Error: ShipMode not initialized.'));
    console.log(chalk.gray('Run: shipmode init --from-code  (or --from-idea)'));
    process.exit(1);
  }

  console.log(chalk.bold.cyan('\n🚀 ShipMode Crew\n'));
  console.log(chalk.gray('Task:'), task);
  console.log();

  if (options.dryRun) {
    console.log(chalk.yellow('📋 Dry Run Mode - Planning only\n'));
    await simulatePlanning(task);
  } else {
    console.log(chalk.yellow('⚠️  Note: Full agent execution coming in Phase 3'));
    console.log(chalk.gray('For now, here\'s what your AI crew would do:\n'));
    await simulatePlanning(task);
  }
}

async function simulatePlanning(task: string): Promise<void> {
  const spinner = ora('Planning implementation...').start();
  await delay(1000);
  
  const steps = [
    'Reading SHIPMODE.md for project context',
    'Loading relevant skills from .shipmode/skills/',
    'Identifying affected files and modules',
    'Drafting implementation plan',
    'Estimating effort and dependencies',
  ];
  
  spinner.succeed('Planning complete');
  console.log();
  
  console.log(chalk.bold('Proposed Plan:\n'));
  
  steps.forEach((step, i) => {
    console.log(chalk.cyan(`${i + 1}.`), step);
  });
  
  console.log();
  console.log(chalk.gray('This is a simulation. In Phase 3, this will:'));
  console.log(chalk.gray('  - Actually write code'));
  console.log(chalk.gray('  - Run tests'));
  console.log(chalk.gray('  - Open PRs'));
  console.log();
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
