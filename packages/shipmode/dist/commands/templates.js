import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
const TEMPLATES_DIR = new URL('../../templates', import.meta.url).pathname;
export async function listTemplates() {
    console.log(chalk.blue('📦 Available Templates\n'));
    // Fresh project templates
    console.log(chalk.yellow('Fresh Projects:'));
    const freshTemplates = await fs.readdir(TEMPLATES_DIR).catch(() => []);
    const validFresh = freshTemplates.filter(t => t !== 'init');
    for (const template of validFresh) {
        const readmePath = path.join(TEMPLATES_DIR, template, 'README.md');
        let description = 'No description available';
        if (await fs.pathExists(readmePath)) {
            const content = await fs.readFile(readmePath, 'utf-8');
            const match = content.match(/# (.+)/);
            if (match)
                description = match[1];
        }
        console.log(`  ${chalk.cyan(template.padEnd(15))} ${chalk.gray(description)}`);
    }
    // Init templates
    console.log(chalk.yellow('\nExisting Projects:'));
    const initTemplates = await fs.readdir(path.join(TEMPLATES_DIR, 'init')).catch(() => []);
    for (const template of initTemplates) {
        console.log(`  ${chalk.cyan(template.padEnd(15))} ${chalk.gray('Add to existing project')}`);
    }
    console.log(chalk.gray('\nUsage:'));
    console.log(`  shipmode create my-app --template ${validFresh[0] || 'starter'}`);
    console.log(`  shipmode init --template ${initTemplates[0] || 'minimal'}`);
}
//# sourceMappingURL=templates.js.map