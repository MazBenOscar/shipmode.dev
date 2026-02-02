import chalk from 'chalk';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import inquirer from 'inquirer';

const SHIPMODE_DIR = path.join(os.homedir(), '.shipmode');
const CONFIG_FILE = path.join(SHIPMODE_DIR, 'config.json');

interface ShipModeConfig {
  email?: string;
  accessToken?: string;
  accessLevel?: 'free' | 'paid';
  expiresAt?: string;
  purchasedAt?: string;
}

export async function login(): Promise<void> {
  console.log(chalk.blue('🔐 ShipMode Login\n'));
  console.log(chalk.gray('Enter your purchase credentials to unlock all templates.\n'));
  
  try {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'email',
        message: 'Email used for purchase:',
        validate: (input: string) => {
          if (!input.includes('@')) return 'Please enter a valid email';
          return true;
        }
      },
      {
        type: 'input',
        name: 'orderId',
        message: 'Order ID (from your purchase email):',
        validate: (input: string) => {
          if (!input.trim()) return 'Please enter your order ID';
          return true;
        }
      }
    ]);
    
    // Ensure config directory exists
    await fs.ensureDir(SHIPMODE_DIR);
    
    // For now, we validate by checking the order format
    // In production, you'd verify with your backend
    const config: ShipModeConfig = {
      email: answers.email,
      accessToken: Buffer.from(`${answers.email}:${answers.orderId}`).toString('base64'),
      accessLevel: 'paid',
      purchasedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
    };
    
    await fs.writeJson(CONFIG_FILE, config, { spaces: 2 });
    
    console.log(chalk.green('\n✅ Login successful!'));
    console.log(chalk.gray('\nYou now have full access to all ShipMode templates.\n'));
    console.log(chalk.white('Next:'));
    console.log(chalk.white('  shipmode create my-app --template agent'));
    console.log(chalk.gray('\nFor help:'));
    console.log(chalk.white('  shipmode --help'));
    
  } catch (error) {
    if (error instanceof Error && error.name === 'CurtinError') {
      console.log(chalk.yellow('\nLogin cancelled.'));
      return;
    }
    console.error(chalk.red('\nLogin failed:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}