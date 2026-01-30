import fs from 'fs/promises';
import path from 'path';
import glob from 'fast-glob';
import type { CodebaseProfile } from '../types/index.js';

export async function analyzeCodebase(rootPath: string): Promise<CodebaseProfile> {
  const absolutePath = path.resolve(rootPath);
  
  // Check if directory exists
  try {
    await fs.access(absolutePath);
  } catch {
    throw new Error(`Directory not found: ${absolutePath}`);
  }

  const [
    languages,
    frameworks,
    entryPoints,
    packageManager,
    db,
    infra,
    testing,
  ] = await Promise.all([
    detectLanguages(absolutePath),
    detectFrameworks(absolutePath),
    detectEntryPoints(absolutePath),
    detectPackageManager(absolutePath),
    detectDatabases(absolutePath),
    detectInfra(absolutePath),
    detectTesting(absolutePath),
  ]);

  const hasTypeScript = languages.includes('TypeScript');
  const hasDocker = await fileExists(path.join(absolutePath, 'Dockerfile'));
  const hasCI = await detectCI(absolutePath);

  const appType = determineAppType(frameworks, entryPoints);

  return {
    languages,
    frameworks,
    appType,
    db,
    infra,
    entryPoints,
    packageManager,
    testing,
    hasTypeScript,
    hasDocker,
    hasCI,
  };
}

async function detectLanguages(rootPath: string): Promise<string[]> {
  const languages: string[] = [];
  const counts: Record<string, number> = {};

  const files = await glob(['**/*.{ts,tsx,js,jsx,py,go,rs,java,rb,php}', '!node_modules/**', '!.git/**'], {
    cwd: rootPath,
  });

  for (const file of files) {
    const ext = path.extname(file);
    const lang = extensionToLanguage(ext);
    if (lang) {
      counts[lang] = (counts[lang] || 0) + 1;
    }
  }

  // Sort by count and return top languages
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([lang]) => lang);
}

async function detectFrameworks(rootPath: string): Promise<string[]> {
  const frameworks: string[] = [];

  try {
    const packageJsonPath = path.join(rootPath, 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    const frameworkMap: Record<string, string> = {
      next: 'Next.js',
      react: 'React',
      vue: 'Vue',
      svelte: 'Svelte',
      '@angular/core': 'Angular',
      express: 'Express',
      fastify: 'Fastify',
      nestjs: 'NestJS',
      hono: 'Hono',
      astro: 'Astro',
      nuxt: 'Nuxt',
      tailwindcss: 'Tailwind CSS',
      prisma: 'Prisma',
      drizzle: 'Drizzle',
      trpc: 'tRPC',
      graphql: 'GraphQL',
      'react-query': 'React Query',
      zustand: 'Zustand',
      redux: 'Redux',
    };

    for (const [pkg, framework] of Object.entries(frameworkMap)) {
      if (deps[pkg]) {
        frameworks.push(framework);
      }
    }
  } catch {
    // No package.json found
  }

  return frameworks;
}

async function detectEntryPoints(rootPath: string): Promise<string[]> {
  const entryPoints: string[] = [];

  const commonEntryPatterns = [
    'src/index.{ts,js}',
    'src/main.{ts,js}',
    'src/app.{ts,js}',
    'src/app/page.tsx',
    'src/app/layout.tsx',
    'pages/index.{tsx,jsx}',
    'app/page.{tsx,jsx}',
    'index.{ts,js}',
    'main.{ts,js}',
  ];

  for (const pattern of commonEntryPatterns) {
    const matches = await glob(pattern, {
      cwd: rootPath,
      absolute: false,
    });
    entryPoints.push(...matches);
  }

  return [...new Set(entryPoints)];
}

async function detectPackageManager(rootPath: string): Promise<CodebaseProfile['packageManager']> {
  if (await fileExists(path.join(rootPath, 'bun.lockb'))) return 'bun';
  if (await fileExists(path.join(rootPath, 'pnpm-lock.yaml'))) return 'pnpm';
  if (await fileExists(path.join(rootPath, 'yarn.lock'))) return 'yarn';
  if (await fileExists(path.join(rootPath, 'package-lock.json'))) return 'npm';
  return undefined;
}

async function detectDatabases(rootPath: string): Promise<string[] | undefined> {
  const dbs: string[] = [];

  // Check for Prisma
  if (await fileExists(path.join(rootPath, 'prisma/schema.prisma'))) {
    dbs.push('PostgreSQL via Prisma');
  }

  // Check for Drizzle
  const drizzleFiles = await glob('**/drizzle.config.{ts,js}', { cwd: rootPath });
  if (drizzleFiles.length > 0) {
    dbs.push('Drizzle ORM');
  }

  // Check for MongoDB
  try {
    const packageJson = JSON.parse(await fs.readFile(path.join(rootPath, 'package.json'), 'utf-8'));
    if (packageJson.dependencies?.mongoose || packageJson.dependencies?.mongodb) {
      dbs.push('MongoDB');
    }
  } catch {
    // Ignore
  }

  return dbs.length > 0 ? dbs : undefined;
}

async function detectInfra(rootPath: string): Promise<string[] | undefined> {
  const infra: string[] = [];

  if (await fileExists(path.join(rootPath, 'Dockerfile'))) {
    infra.push('Docker');
  }

  if (await fileExists(path.join(rootPath, 'docker-compose.yml')) || 
      await fileExists(path.join(rootPath, 'docker-compose.yaml'))) {
    infra.push('Docker Compose');
  }

  if (await glob('.github/workflows/*.yml', { cwd: rootPath }).then(files => files.length > 0)) {
    infra.push('GitHub Actions');
  }

  const k8sFiles = await glob('**/k8s/**/*.yaml', { cwd: rootPath });
  if (k8sFiles.length > 0) {
    infra.push('Kubernetes');
  }

  return infra.length > 0 ? infra : undefined;
}

async function detectTesting(rootPath: string): Promise<string[] | undefined> {
  const testing: string[] = [];

  try {
    const packageJson = JSON.parse(await fs.readFile(path.join(rootPath, 'package.json'), 'utf-8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    if (deps.vitest) testing.push('Vitest');
    if (deps.jest) testing.push('Jest');
    if (deps.cypress) testing.push('Cypress');
    if (deps['@playwright/test']) testing.push('Playwright');
    if (deps.mocha) testing.push('Mocha');
  } catch {
    // Ignore
  }

  return testing.length > 0 ? testing : undefined;
}

async function detectCI(rootPath: string): Promise<boolean> {
  return await fileExists(path.join(rootPath, '.github/workflows')) ||
         await fileExists(path.join(rootPath, '.gitlab-ci.yml'));
}

function determineAppType(
  frameworks: string[],
  entryPoints: string[]
): CodebaseProfile['appType'] {
  if (frameworks.includes('Next.js') || frameworks.includes('Nuxt')) {
    return 'fullstack-web';
  }
  
  if (frameworks.includes('React') || frameworks.includes('Vue') || frameworks.includes('Svelte')) {
    return 'frontend';
  }
  
  if (frameworks.includes('Express') || frameworks.includes('Fastify') || frameworks.includes('NestJS')) {
    return 'backend';
  }
  
  // Check for API patterns
  const hasApiRoutes = entryPoints.some(ep => ep.includes('api/') || ep.includes('routes/'));
  if (hasApiRoutes) {
    return 'api';
  }
  
  return 'library';
}

function extensionToLanguage(ext: string): string | null {
  const map: Record<string, string> = {
    '.ts': 'TypeScript',
    '.tsx': 'TypeScript',
    '.js': 'JavaScript',
    '.jsx': 'JavaScript',
    '.py': 'Python',
    '.go': 'Go',
    '.rs': 'Rust',
    '.java': 'Java',
    '.rb': 'Ruby',
    '.php': 'PHP',
  };
  return map[ext] || null;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
