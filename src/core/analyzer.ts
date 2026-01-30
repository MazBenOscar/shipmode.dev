import fs from 'fs/promises';
import path from 'path';
import glob from 'fast-glob';
import type { CodebaseProfile } from '../types/index.js';

export async function analyzeCodebase(rootPath: string): Promise<CodebaseProfile> {
  const absolutePath = path.resolve(rootPath);
  
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
    hasTypeScript,
    hasDocker,
    hasCI,
  ] = await Promise.all([
    detectLanguages(absolutePath),
    detectFrameworks(absolutePath),
    detectEntryPoints(absolutePath),
    detectPackageManager(absolutePath),
    detectDatabases(absolutePath),
    detectInfra(absolutePath),
    detectTesting(absolutePath),
    checkTypeScript(absolutePath),
    fileExists(path.join(absolutePath, 'Dockerfile')),
    detectCI(absolutePath),
  ]);

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
  const counts: Record<string, number> = {};

  const files = await glob([
    '**/*.{ts,tsx,js,jsx,py,go,rs,java,rb,php,swift,kotlin}',
    '!node_modules/**',
    '!.git/**',
    '!dist/**',
    '!build/**',
  ], { cwd: rootPath });

  for (const file of files.slice(0, 1000)) { // Limit to prevent slowdown on huge repos
    const ext = path.extname(file);
    const lang = extensionToLanguage(ext);
    if (lang) {
      counts[lang] = (counts[lang] || 0) + 1;
    }
  }

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([lang]) => lang);
}

async function detectFrameworks(rootPath: string): Promise<string[]> {
  const frameworks: string[] = [];
  const detectedFeatures: string[] = [];

  try {
    const packageJsonPath = path.join(rootPath, 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    // Comprehensive framework detection
    const frameworkMap: Record<string, string> = {
      // Frontend frameworks
      'next': 'Next.js',
      'react': 'React',
      'vue': 'Vue',
      'svelte': 'Svelte',
      '@angular/core': 'Angular',
      'astro': 'Astro',
      'nuxt': 'Nuxt',
      'remix': 'Remix',
      'gatsby': 'Gatsby',
      
      // Backend frameworks
      'express': 'Express',
      'fastify': 'Fastify',
      'nestjs': 'NestJS',
      'hono': 'Hono',
      'koa': 'Koa',
      
      // Styling
      'tailwindcss': 'Tailwind CSS',
      'styled-components': 'Styled Components',
      '@emotion/react': 'Emotion',
      'sass': 'Sass',
      'less': 'Less',
      
      // State management
      'zustand': 'Zustand',
      'redux': 'Redux',
      '@reduxjs/toolkit': 'Redux Toolkit',
      'jotai': 'Jotai',
      'recoil': 'Recoil',
      'mobx': 'MobX',
      
      // Data fetching
      '@tanstack/react-query': 'React Query',
      'react-query': 'React Query',
      'swr': 'SWR',
      'trpc': 'tRPC',
      'graphql': 'GraphQL',
      'apollo-client': 'Apollo Client',
      'urql': 'URQL',
      
      // ORMs & DB
      'prisma': 'Prisma',
      'drizzle-orm': 'Drizzle',
      'mongoose': 'Mongoose',
      'typeorm': 'TypeORM',
      'sequelize': 'Sequelize',
      'firebase': 'Firebase',
      'supabase': 'Supabase',
      
      // Auth
      'next-auth': 'NextAuth.js',
      '@auth/core': 'Auth.js',
      'passport': 'Passport',
      'auth0': 'Auth0',
      'clerk': 'Clerk',
      'firebase-auth': 'Firebase Auth',
      
      // UI Components
      '@radix-ui/react-primitive': 'Radix UI',
      '@shadcn/ui': 'shadcn/ui',
      '@mui/material': 'Material UI',
      'antd': 'Ant Design',
      'chakra-ui': 'Chakra UI',
      
      // Testing
      'vitest': 'Vitest',
      'jest': 'Jest',
      'cypress': 'Cypress',
      '@playwright/test': 'Playwright',
      'mocha': 'Mocha',
      
      // Build tools
      'vite': 'Vite',
      'webpack': 'Webpack',
      'esbuild': 'esbuild',
      'rollup': 'Rollup',
      'parcel': 'Parcel',
      
      // AI / ML
      'openai': 'OpenAI SDK',
      '@anthropic-ai/sdk': 'Anthropic SDK',
      '@vercel/ai': 'Vercel AI SDK',
      'langchain': 'LangChain',
    };

    for (const [pkg, framework] of Object.entries(frameworkMap)) {
      if (deps[pkg]) {
        frameworks.push(framework);
      }
    }

    // Detect additional features
    if (deps['@stripe/stripe-js'] || deps['stripe']) {
      detectedFeatures.push('Stripe Payments');
    }
    if (deps['resend'] || deps['@sendgrid/mail']) {
      detectedFeatures.push('Email Service');
    }
    if (deps['zod'] || deps['yup'] || deps['joi']) {
      detectedFeatures.push('Schema Validation');
    }
    if (deps['date-fns'] || deps['dayjs'] || deps['moment']) {
      detectedFeatures.push('Date Utilities');
    }
    if (deps['lodash'] || deps['ramda']) {
      detectedFeatures.push('Utility Library');
    }
    if (deps['axios'] || deps['ky']) {
      detectedFeatures.push('HTTP Client');
    }
    if (deps['socket.io'] || deps['ws']) {
      detectedFeatures.push('WebSockets');
    }

  } catch {
    // No package.json - might not be a Node project
  }

  // Detect Python frameworks
  try {
    const requirementsPath = path.join(rootPath, 'requirements.txt');
    const requirements = await fs.readFile(requirementsPath, 'utf-8');
    
    if (requirements.includes('django')) frameworks.push('Django');
    if (requirements.includes('flask')) frameworks.push('Flask');
    if (requirements.includes('fastapi')) frameworks.push('FastAPI');
  } catch {
    // No requirements.txt
  }

  // Detect Go frameworks
  try {
    const goModPath = path.join(rootPath, 'go.mod');
    const goMod = await fs.readFile(goModPath, 'utf-8');
    
    if (goMod.includes('gin')) frameworks.push('Gin');
    if (goMod.includes('echo')) frameworks.push('Echo');
    if (goMod.includes('fiber')) frameworks.push('Fiber');
  } catch {
    // No go.mod
  }

  return [...new Set([...frameworks, ...detectedFeatures])];
}

async function detectEntryPoints(rootPath: string): Promise<string[]> {
  const entryPoints: string[] = [];

  const commonEntryPatterns = [
    // Next.js App Router
    'src/app/page.{tsx,jsx}',
    'src/app/layout.{tsx,jsx}',
    'app/page.{tsx,jsx}',
    'app/layout.{tsx,jsx}',
    
    // Next.js Pages Router
    'src/pages/index.{tsx,jsx}',
    'pages/index.{tsx,jsx}',
    
    // React
    'src/index.{tsx,jsx}',
    'src/main.{tsx,jsx}',
    'src/App.{tsx,jsx}',
    'src/client.{tsx,jsx}',
    
    // Generic
    'index.{ts,js}',
    'main.{ts,js}',
    'server.{ts,js}',
    'app.{ts,js}',
    
    // API
    'src/server.{ts,js}',
    'api/index.{ts,js}',
    'src/api/index.{ts,js}',
  ];

  for (const pattern of commonEntryPatterns) {
    const matches = await glob(pattern, {
      cwd: rootPath,
      absolute: false,
    });
    entryPoints.push(...matches);
  }

  // Remove duplicates and limit
  return [...new Set(entryPoints)].slice(0, 5);
}

async function detectPackageManager(rootPath: string): Promise<CodebaseProfile['packageManager']> {
  // Check in order of preference
  const checks = [
    { file: 'bun.lockb', manager: 'bun' as const },
    { file: 'pnpm-lock.yaml', manager: 'pnpm' as const },
    { file: 'yarn.lock', manager: 'yarn' as const },
    { file: 'package-lock.json', manager: 'npm' as const },
  ];

  for (const check of checks) {
    if (await fileExists(path.join(rootPath, check.file))) {
      return check.manager;
    }
  }
  return undefined;
}

async function detectDatabases(rootPath: string): Promise<string[] | undefined> {
  const dbs: string[] = [];

  // Check for Prisma
  if (await fileExists(path.join(rootPath, 'prisma/schema.prisma'))) {
    dbs.push('PostgreSQL via Prisma');
  }

  // Check for Drizzle
  if (await glob('**/drizzle.config.{ts,js}', { cwd: rootPath }).then(f => f.length > 0)) {
    dbs.push('Drizzle ORM');
  }

  // Check package.json for DB libraries
  try {
    const packageJson = JSON.parse(await fs.readFile(path.join(rootPath, 'package.json'), 'utf-8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    if (deps.mongoose || deps.mongodb) dbs.push('MongoDB');
    if (deps.mysql2 || deps.mysql) dbs.push('MySQL');
    if (deps.pg) dbs.push('PostgreSQL (pg)');
    if (deps.sqlite3 || deps.better-sqlite3) dbs.push('SQLite');
    if (deps.redis || deps.ioredis) dbs.push('Redis');
    if (deps['@supabase/supabase-js']) dbs.push('Supabase');
    if (deps.firebase) dbs.push('Firebase');
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

  if (await glob('.github/workflows/*.yaml', { cwd: rootPath }).then(files => files.length > 0)) {
    infra.push('GitHub Actions');
  }

  const k8sFiles = await glob('**/k8s/**/*.yaml', { cwd: rootPath });
  if (k8sFiles.length > 0) {
    infra.push('Kubernetes');
  }

  if (await fileExists(path.join(rootPath, 'terraform'))) {
    infra.push('Terraform');
  }

  if (await fileExists(path.join(rootPath, 'serverless.yml'))) {
    infra.push('Serverless Framework');
  }

  if (await fileExists(path.join(rootPath, '.vercel'))) {
    infra.push('Vercel');
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
    if (deps.ava) testing.push('AVA');
    if (deps.tap) testing.push('TAP');
  } catch {
    // Ignore
  }

  // Check for test directories
  const testDirs = await glob('**/{test,tests,__tests__}/', { cwd: rootPath, onlyDirectories: true });
  if (testDirs.length > 0 && testing.length === 0) {
    testing.push('Tests present');
  }

  return testing.length > 0 ? testing : undefined;
}

async function checkTypeScript(rootPath: string): Promise<boolean> {
  return (
    await fileExists(path.join(rootPath, 'tsconfig.json')) ||
    await glob('**/*.ts', { cwd: rootPath }).then(files => files.length > 0)
  );
}

async function detectCI(rootPath: string): Promise<boolean> {
  return (
    await fileExists(path.join(rootPath, '.github/workflows')) ||
    await fileExists(path.join(rootPath, '.gitlab-ci.yml')) ||
    await fileExists(path.join(rootPath, 'azure-pipelines.yml')) ||
    await fileExists(path.join(rootPath, 'bitrise.yml')) ||
    await fileExists(path.join(rootPath, '.circleci'))
  );
}

function determineAppType(
  frameworks: string[],
  entryPoints: string[]
): CodebaseProfile['appType'] {
  // Check for monorepo indicators
  if (entryPoints.some(ep => ep.includes('apps/') || ep.includes('packages/'))) {
    return 'monorepo';
  }

  if (frameworks.includes('Next.js') || frameworks.includes('Nuxt') || frameworks.includes('Remix')) {
    return 'fullstack-web';
  }
  
  if (frameworks.includes('React') || frameworks.includes('Vue') || frameworks.includes('Svelte') || frameworks.includes('Angular')) {
    return 'frontend';
  }
  
  if (frameworks.includes('Express') || frameworks.includes('Fastify') || frameworks.includes('NestJS') || frameworks.includes('Hono') || frameworks.includes('FastAPI') || frameworks.includes('Django')) {
    return 'backend';
  }
  
  // Check for API patterns
  const hasApiRoutes = entryPoints.some(ep => 
    ep.includes('api/') || 
    ep.includes('routes/') ||
    ep.includes('server')
  );
  if (hasApiRoutes) {
    return 'api';
  }

  // Check for mobile
  if (frameworks.includes('React Native') || frameworks.includes('Expo') || frameworks.includes('Flutter')) {
    return 'mobile';
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
    '.swift': 'Swift',
    '.kt': 'Kotlin',
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
