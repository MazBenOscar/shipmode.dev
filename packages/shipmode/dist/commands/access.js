import chalk from 'chalk';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
const SHIPMODE_DIR = path.join(os.homedir(), '.shipmode');
const CONFIG_FILE = path.join(SHIPMODE_DIR, 'config.json');
export async function showAccess() {
    console.log(chalk.blue('🔐 ShipMode Access Status\n'));
    // Check if config exists
    if (!await fs.pathExists(CONFIG_FILE)) {
        console.log(chalk.yellow('No ShipMode account configured.'));
        console.log(chalk.gray('\nTo purchase access:'));
        console.log(chalk.white('  Visit https://shipmode.dev'));
        console.log(chalk.gray('\nAfter purchase, set up with:'));
        console.log(chalk.white('  shipmode login'));
        return;
    }
    const config = await fs.readJson(CONFIG_FILE);
    console.log(`Email:      ${config.email || 'Not set'}`);
    console.log(`Access:     ${config.accessLevel === 'paid' ? chalk.green('✅ Paid') : chalk.yellow('🆓 Free')}`);
    if (config.expiresAt) {
        const expires = new Date(config.expiresAt);
        const now = new Date();
        const daysLeft = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysLeft < 0) {
            console.log(`Status:     ${chalk.red('❌ Expired')}`);
        }
        else if (daysLeft < 7) {
            console.log(`Expires:    ${chalk.yellow(`${daysLeft} days`)} (${expires.toLocaleDateString()})`);
        }
        else {
            console.log(`Expires:    ${chalk.green(expires.toLocaleDateString())}`);
        }
    }
    console.log(chalk.gray('\nYou have full access to all templates and features.'));
}
//# sourceMappingURL=access.js.map