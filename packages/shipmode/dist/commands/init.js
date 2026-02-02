import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
const TEMPLATES_DIR = new URL('../../templates', import.meta.url).pathname;
export async function initProject(templateName) {
    console.log(chalk.blue('🔧 Initializing ShipMode in existing project...'));
    console.log(chalk.gray(`  Template: ${templateName}`));
    const cwd = process.cwd();
    const pkgPath = path.join(cwd, 'package.json');
    // Check if package.json exists
    if (!await fs.pathExists(pkgPath)) {
        throw new Error('No package.json found. Run this in a project root.');
    }
    // Validate template exists
    const templatePath = path.join(TEMPLATES_DIR, 'init', templateName);
    if (!await fs.pathExists(templatePath)) {
        const available = await fs.readdir(path.join(TEMPLATES_DIR, 'init')).catch(() => []);
        throw new Error(`Init template "${templateName}" not found.\nAvailable: ${available.join(', ') || 'minimal'}`);
    }
    // Read existing package.json
    const pkg = await fs.readJson(pkgPath);
    // Copy template files
    const files = await fs.readdir(templatePath);
    for (const file of files) {
        const src = path.join(templatePath, file);
        const dest = path.join(cwd, file);
        if (file === 'package.json') {
            // Merge package.json
            const templatePkg = await fs.readJson(src);
            pkg.dependencies = { ...pkg.dependencies, ...templatePkg.dependencies };
            pkg.devDependencies = { ...pkg.devDependencies, ...templatePkg.devDependencies };
            pkg.scripts = { ...pkg.scripts, ...templatePkg.scripts };
        }
        else {
            await fs.copy(src, dest);
        }
    }
    // Write updated package.json
    await fs.writeJson(pkgPath, pkg, { spaces: 2 });
    console.log(chalk.green('✅ ShipMode initialized!'));
    console.log(chalk.gray(`\nNext steps:`));
    console.log(chalk.white(`  npm install`));
    console.log(chalk.white(`  Check the README.md for usage`));
}
//# sourceMappingURL=init.js.map