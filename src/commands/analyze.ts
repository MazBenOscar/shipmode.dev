import chalk from 'chalk';
import { analyzeCodebase } from '../core/analyzer.js';
import { 
  showWelcome,
  showSuccess, 
  showInfo, 
  showDivider,
  COLORS 
} from '../utils/ui.js';
import type { CodebaseProfile } from '../types/index.js';

interface AnalyzeOptions {
  json?: boolean;
}

export async function analyzeCommand(
  projectPath: string,
  options: AnalyzeOptions
): Promise<void> {
  console.log();
  console.log(COLORS.bold.cyan('🔍  ShipMode Analysis\n'));

  const analyzingSpinner = ora({
    text: COLORS.muted(`Scanning ${projectPath}...`),
    spinner: 'dots12',
  }).start();

  try {
    const profile = await analyzeCodebase(projectPath);
    analyzingSpinner.succeed(COLORS.success('Analysis complete!'));

    if (options.json) {
      console.log(JSON.stringify(profile, null, 2));
    } else {
      printProfile(profile);
    }
  } catch (error) {
    analyzingSpinner.fail(COLORS.error('Analysis failed'));
    console.error(error);
    process.exit(1);
  }
}

function printProfile(profile: CodebaseProfile): void {
  console.log();
  showDivider();
  console.log();
  
  // Languages with icons
  console.log(COLORS.bold('📊  Tech Stack\n'));
  
  if (profile.languages.length > 0) {
    console.log(COLORS.cyan('Languages:   '), profile.languages.map(l => {
      const icon = getLanguageIcon(l);
      return `${icon} ${l}`;
    }).join(', '));
  }
  
  if (profile.frameworks.length > 0) {
    console.log(COLORS.cyan('Frameworks:  '), profile.frameworks.slice(0, 8).join(', '));
    if (profile.frameworks.length > 8) {
      console.log(COLORS.muted(`              ...and ${profile.frameworks.length - 8} more`));
    }
  }
  
  console.log(COLORS.cyan('App Type:    '), getAppTypeIcon(profile.appType), profile.appType);
  
  if (profile.db) {
    console.log(COLORS.cyan('Database:    '), profile.db.join(', '));
  }
  
  if (profile.infra) {
    console.log(COLORS.cyan('Infra:       '), profile.infra.join(', '));
  }
  
  console.log();
  showDivider();
  console.log();
  
  // Entry Points
  if (profile.entryPoints.length > 0) {
    console.log(COLORS.bold('🚪  Entry Points\n'));
    profile.entryPoints.forEach(ep => {
      console.log(`   ${COLORS.gray('→')} ${ep}`);
    });
    console.log();
    showDivider();
    console.log();
  }
  
  // Project Health
  console.log(COLORS.bold('✅  Project Health\n'));
  
  const checks = [
    { label: 'TypeScript', value: profile.hasTypeScript, icon: '◈' },
    { label: 'Docker', value: profile.hasDocker, icon: '🐳' },
    { label: 'CI/CD', value: profile.hasCI, icon: '🔄' },
    { label: 'Testing', value: !!profile.testing, icon: '🧪' },
  ];
  
  checks.forEach(check => {
    const status = check.value 
      ? COLORS.green('✔') 
      : COLORS.gray('○');
    const label = check.value 
      ? COLORS.white(check.label)
      : COLORS.gray(check.label);
    console.log(`   ${status}  ${check.icon}  ${label}`);
  });
  
  if (profile.packageManager) {
    console.log(`   ${COLORS.green('✔')}  📦  ${COLORS.white(profile.packageManager)}`);
  }
  
  console.log();
  showDivider();
  console.log();
  
  // Recommendations
  console.log(COLORS.bold('💡  Recommendations\n'));
  
  const recommendations: string[] = [];
  
  if (!profile.hasTypeScript && profile.languages.includes('JavaScript')) {
    recommendations.push('Consider migrating to TypeScript for better type safety');
  }
  
  if (!profile.hasDocker) {
    recommendations.push('Add Docker for consistent development environments');
  }
  
  if (!profile.hasCI) {
    recommendations.push('Set up CI/CD with GitHub Actions for automated testing');
  }
  
  if (!profile.testing) {
    recommendations.push('Add testing framework (Vitest, Jest, or Playwright)');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Great setup! Run "shipmode init" to activate your AI crew');
  }
  
  recommendations.forEach((rec, i) => {
    console.log(`   ${COLORS.cyan(`${i + 1}.`)} ${rec}`);
  });
  
  console.log();
  console.log(COLORS.muted('Run "shipmode init --from-code" to generate AI crew configuration'));
  console.log();
}

// Helper function for ora since we need to import it
import ora from 'ora';

function getLanguageIcon(lang: string): string {
  const icons: Record<string, string> = {
    'TypeScript': '◈',
    'JavaScript': '◇',
    'Python': '🐍',
    'Go': '🐹',
    'Rust': '⚙',
    'Java': '☕',
    'Ruby': '💎',
    'PHP': '🐘',
    'Swift': '🐦',
    'Kotlin': '🔷',
  };
  return icons[lang] || '●';
}

function getAppTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    'fullstack-web': '🌐',
    'frontend': '🎨',
    'backend': '⚙️',
    'api': '🔌',
    'mobile': '📱',
    'library': '📦',
    'monorepo': '📁',
  };
  return icons[type] || '📄';
}
