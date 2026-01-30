import chalk from 'chalk';
import { analyzeCodebase } from '../core/analyzer.js';
import type { CodebaseProfile } from '../types/index.js';

interface AnalyzeOptions {
  json?: boolean;
}

export async function analyzeCommand(
  projectPath: string,
  options: AnalyzeOptions
): Promise<void> {
  try {
    const profile = await analyzeCodebase(projectPath);

    if (options.json) {
      console.log(JSON.stringify(profile, null, 2));
    } else {
      printProfile(profile);
    }
  } catch (error) {
    console.error(chalk.red('Error analyzing codebase:'), error);
    process.exit(1);
  }
}

function printProfile(profile: CodebaseProfile): void {
  console.log(chalk.bold.cyan('\n📊 Codebase Profile\n'));
  
  console.log(chalk.cyan('Languages:'), profile.languages.join(', ') || 'N/A');
  console.log(chalk.cyan('Frameworks:'), profile.frameworks.join(', ') || 'N/A');
  console.log(chalk.cyan('App Type:'), profile.appType);
  
  if (profile.db) {
    console.log(chalk.cyan('Database:'), profile.db.join(', '));
  }
  
  if (profile.infra) {
    console.log(chalk.cyan('Infrastructure:'), profile.infra.join(', '));
  }
  
  if (profile.entryPoints.length > 0) {
    console.log(chalk.cyan('\nEntry Points:'));
    profile.entryPoints.forEach(ep => console.log(`  - ${ep}`));
  }
  
  if (profile.packageManager) {
    console.log(chalk.cyan('\nPackage Manager:'), profile.packageManager);
  }
  
  if (profile.testing) {
    console.log(chalk.cyan('Testing:'), profile.testing.join(', '));
  }
  
  console.log(chalk.cyan('\nTypeScript:'), profile.hasTypeScript ? '✓' : '✗');
  console.log(chalk.cyan('Docker:'), profile.hasDocker ? '✓' : '✗');
  console.log(chalk.cyan('CI/CD:'), profile.hasCI ? '✓' : '✗');
  
  console.log();
}
