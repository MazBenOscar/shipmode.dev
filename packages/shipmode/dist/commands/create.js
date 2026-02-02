import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
const TEMPLATES_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'templates');
export async function createProject(name, templateName) {
    console.log(chalk.blue('🚀 Creating ShipMode project...'));
    console.log(chalk.gray(`  Name: ${name}`));
    console.log(chalk.gray(`  Template: ${templateName}`));
    // Validate project name
    if (!/^[a-z0-9-_]+$/i.test(name)) {
        throw new Error('Project name must contain only letters, numbers, hyphens, and underscores');
    }
    // Check if directory exists
    const projectPath = path.resolve(name);
    if (await fs.pathExists(projectPath)) {
        throw new Error(`Directory "${name}" already exists`);
    }
    // Validate template exists
    const templatePath = path.join(TEMPLATES_DIR, templateName);
    if (!await fs.pathExists(templatePath)) {
        const available = await fs.readdir(TEMPLATES_DIR).catch(() => []);
        throw new Error(`Template "${templateName}" not found.\nAvailable: ${available.join(', ') || 'none'}`);
    }
    // Copy template
    await fs.copy(templatePath, projectPath);
    // Update package.json with project name
    const pkgPath = path.join(projectPath, 'package.json');
    if (await fs.pathExists(pkgPath)) {
        const pkg = await fs.readJson(pkgPath);
        pkg.name = name;
        await fs.writeJson(pkgPath, pkg, { spaces: 2 });
    }
    console.log(chalk.green('✅ Project created successfully!'));
    console.log(chalk.gray(`\nNext steps:`));
    console.log(chalk.white(`  cd ${name}`));
    console.log(chalk.white(`  npm install`));
    console.log(chalk.white(`  npm run dev`));
}
//# sourceMappingURL=create.js.map