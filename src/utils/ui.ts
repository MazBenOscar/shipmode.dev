import chalk from 'chalk';

export const LOGO = `
${chalk.cyan('╔═══════════════════════════════════════╗')}
${chalk.cyan('║')}  ${chalk.bold.white('⚡ SHIPMODE')} ${chalk.gray('v0.1.0')}               ${chalk.cyan('║')}
${chalk.cyan('║')}  ${chalk.gray('Your codebase\'s autopilot')}          ${chalk.cyan('║')}
${chalk.cyan('╚═══════════════════════════════════════╝')}
`;

export const ROCKET = `
    ${chalk.cyan('▲')}
   ${chalk.cyan('/')}${chalk.gray('│')}${chalk.cyan('\\')}
  ${chalk.cyan('/')}.${chalk.gray('│')}.${chalk.cyan('\\')}
 ${chalk.gray('│')} ${chalk.cyan('═══')} ${chalk.gray('│')}
 ${chalk.gray('│')} ${chalk.yellow('███')} ${chalk.gray('│')}
 ${chalk.gray('│')} ${chalk.yellow('███')} ${chalk.gray('│')}
 ${chalk.cyan('\\')}${chalk.gray('═════')}${chalk.cyan('/')}
`;

export function showWelcome(): void {
  console.clear();
  console.log(LOGO);
  console.log();
}

export function showSuccess(message: string): void {
  console.log(chalk.green('✔'), message);
}

export function showInfo(label: string, value: string): void {
  console.log(chalk.cyan(label.padEnd(15)), chalk.white(value));
}

export function showWarning(message: string): void {
  console.log(chalk.yellow('⚠'), message);
}

export function showError(message: string): void {
  console.log(chalk.red('✖'), message);
}

export function showStep(number: number, message: string): void {
  console.log(chalk.cyan(`  ${number}.`), message);
}

export function showDivider(): void {
  console.log(chalk.gray('─'.repeat(50)));
}

export function showNextSteps(steps: string[]): void {
  console.log();
  console.log(chalk.bold.cyan('🎯 Next Steps:\n'));
  steps.forEach((step, i) => {
    console.log(chalk.gray(`  ${i + 1}.`), step);
  });
  console.log();
}

export const COLORS = {
  primary: chalk.cyan,
  secondary: chalk.magenta,
  success: chalk.green,
  warning: chalk.yellow,
  yellow: chalk.yellow,
  error: chalk.red,
  muted: chalk.gray,
  gray: chalk.gray,
  cyan: chalk.cyan,
  bold: chalk.bold,
};
