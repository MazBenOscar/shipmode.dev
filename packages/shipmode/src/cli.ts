#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import { createProject } from './commands/create.js';
import { initProject } from './commands/init.js';
import { listTemplates } from './commands/templates.js';
import { showAccess } from './commands/access.js';
import { login } from './commands/login.js';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgPath = path.join(__dirname, '..', 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

program
  .name('shipmode')
  .description(pkg.description)
  .version(pkg.version);

program
  .command('create <name>')
  .description('Create a new ShipMode project from a template')
  .option('-t, --template <template>', 'Template to use', 'starter')
  .action(async (name, options) => {
    try {
      await createProject(name, options.template);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('init')
  .description('Initialize ShipMode in an existing project')
  .option('-t, --template <template>', 'Template to apply', 'minimal')
  .action(async (options) => {
    try {
      await initProject(options.template);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('templates')
  .alias('list')
  .description('List available templates')
  .action(async () => {
    await listTemplates();
  });

program
  .command('access')
  .description('Check your ShipMode access status')
  .action(async () => {
    await showAccess();
  });

program
  .command('login')
  .description('Login with your purchase credentials')
  .action(async () => {
    await login();
  });

program.parse();