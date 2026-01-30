import fs from 'fs/promises';
import path from 'path';
import type { CodebaseProfile, IdeaAnswers } from '../types/index.js';

interface ConfigOptions {
  mode: 'idea' | 'code';
  stack?: string[];
  idea?: IdeaAnswers;
  profile?: CodebaseProfile;
}

export async function generateShipmodeConfig(options: ConfigOptions): Promise<void> {
  const shipmodeDir = path.join(process.cwd(), '.shipmode');
  
  // Create .shipmode directory
  await fs.mkdir(shipmodeDir, { recursive: true });
  await fs.mkdir(path.join(shipmodeDir, 'skills'), { recursive: true });
  await fs.mkdir(path.join(shipmodeDir, 'crew'), { recursive: true });

  if (options.mode === 'idea' && options.stack && options.idea) {
    await generateFromIdea(shipmodeDir, options.stack, options.idea);
  } else if (options.mode === 'code' && options.profile) {
    await generateFromCode(shipmodeDir, options.profile);
  }
}

async function generateFromIdea(
  shipmodeDir: string,
  stack: string[],
  idea: IdeaAnswers
): Promise<void> {
  // Generate SHIPMODE.md
  const shipmodeMd = `# SHIPMODE.md

## Project Summary

**Idea:** ${idea.description}

**Target Users:** ${idea.targetUsers}

**Expected Scale:** ${idea.expectedUsers}

**Proposed Stack:** ${stack.join(', ')}

## Architecture

TBD - Will be generated after initial scaffolding

## Conventions

- TypeScript strict mode enabled
- Component-first architecture
- API routes co-located with pages (Next.js App Router)

## How to Run

\`\`\`bash
# Install dependencies
npm install

# Run dev server
npm run dev
\`\`\`
`;

  await fs.writeFile(path.join(shipmodeDir, 'SHIPMODE.md'), shipmodeMd);

  // Generate basic skill for the stack
  const stackSkill = `# ${stack[0]} Skill

## Overview

This project uses ${stack[0]} as the primary framework.

## Conventions

- Follow official ${stack[0]} documentation
- Use TypeScript for all new files
- Prefer server components where possible

## When to Use

- Building new pages or API routes
- Adding authentication flows
- Implementing database queries
`;

  await fs.writeFile(
    path.join(shipmodeDir, 'skills', `${stack[0].toLowerCase().replace(/[^a-z]/g, '-')}.md`),
    stackSkill
  );
}

async function generateFromCode(
  shipmodeDir: string,
  profile: CodebaseProfile
): Promise<void> {
  // Generate SHIPMODE.md based on detected profile
  const shipmodeMd = `# SHIPMODE.md

## Project Summary

**Languages:** ${profile.languages.join(', ')}

**Frameworks:** ${profile.frameworks.join(', ')}

**App Type:** ${profile.appType}

${profile.db ? `**Database:** ${profile.db.join(', ')}` : ''}

${profile.infra ? `**Infrastructure:** ${profile.infra.join(', ')}` : ''}

## Architecture

${generateArchitectureSection(profile)}

## Entry Points

${profile.entryPoints.map(ep => `- \`${ep}\``).join('\n')}

## Conventions

${generateConventionsSection(profile)}

## How to Run

\`\`\`bash
${profile.packageManager === 'pnpm' ? 'pnpm install' : profile.packageManager === 'yarn' ? 'yarn install' : 'npm install'}
${profile.packageManager === 'pnpm' ? 'pnpm dev' : profile.packageManager === 'yarn' ? 'yarn dev' : 'npm run dev'}
\`\`\`
`;

  await fs.writeFile(path.join(shipmodeDir, 'SHIPMODE.md'), shipmodeMd);

  // Generate framework-specific skills
  for (const framework of profile.frameworks) {
    const skillContent = generateFrameworkSkill(framework, profile);
    const fileName = framework.toLowerCase().replace(/[^a-z]/g, '-') + '.md';
    await fs.writeFile(path.join(shipmodeDir, 'skills', fileName), skillContent);
  }

  // Generate crew agents
  await generateCrewAgents(shipmodeDir, profile);
}

function generateArchitectureSection(profile: CodebaseProfile): string {
  const sections: string[] = [];

  if (profile.appType === 'fullstack-web') {
    sections.push('- Frontend: Next.js App Router with React Server Components');
    sections.push('- Backend: API routes co-located with pages');
    sections.push('- Database: Prisma ORM with PostgreSQL');
  } else if (profile.appType === 'frontend') {
    sections.push('- SPA architecture with React');
    sections.push('- Component-based organization');
  } else if (profile.appType === 'backend') {
    sections.push('- REST API architecture');
    sections.push('- Service layer pattern');
  }

  return sections.join('\n');
}

function generateConventionsSection(profile: CodebaseProfile): string {
  const conventions: string[] = [];

  if (profile.hasTypeScript) {
    conventions.push('- All files use TypeScript with strict mode');
  }

  if (profile.frameworks.includes('Next.js')) {
    conventions.push('- Use App Router (not Pages Router)');
    conventions.push('- Server Components by default, Client Components when needed');
  }

  if (profile.testing) {
    conventions.push(`- Testing: ${profile.testing.join(', ')}`);
  }

  return conventions.join('\n') || '- Follow existing code patterns';
}

function generateFrameworkSkill(framework: string, profile: CodebaseProfile): string {
  const frameworkGuides: Record<string, string> = {
    'Next.js': `# Next.js Skill

## Overview

This project uses Next.js with the App Router.

## Conventions

- Prefer Server Components for data fetching
- Use Client Components only for interactivity
- Place API routes in app/api/ or route handlers
- Use generateStaticParams for dynamic routes

## Patterns

- Loading states: Use loading.tsx
- Error handling: Use error.tsx
- Metadata: Export from page.tsx or layout.tsx
`,
    'Prisma': `# Prisma Skill

## Overview

Database ORM using Prisma with PostgreSQL.

## Conventions

- Schema defined in prisma/schema.prisma
- Run migrations: npx prisma migrate dev
- Generate client: npx prisma generate
- Use Prisma Client in server components/actions

## Common Patterns

- Database queries in lib/db.ts
- Use transactions for multi-table operations
`,
    'React': `# React Skill

## Overview

UI built with React and TypeScript.

## Conventions

- Functional components with hooks
- Props interface defined as ComponentProps
- Use 'use client' directive when needed

## Patterns

- Data fetching in Server Components
- Mutations in Server Actions
- Client state with useState/useReducer
`,
  };

  return frameworkGuides[framework] || `# ${framework} Skill

## Overview

This project uses ${framework}.

## Conventions

- Follow official ${framework} best practices
- Use TypeScript for type safety
- Document any custom patterns
`;
}

async function generateCrewAgents(shipmodeDir: string, profile: CodebaseProfile): Promise<void> {
  const agents = [
    {
      name: 'frontend-engineer',
      role: 'Frontend Engineer',
      responsibilities: ['Build UI components', 'Implement user interactions', 'Optimize performance'],
      skills: profile.frameworks.filter(f => ['React', 'Next.js', 'Vue', 'Svelte'].includes(f)),
    },
    {
      name: 'backend-engineer',
      role: 'Backend Engineer',
      responsibilities: ['Design APIs', 'Implement business logic', 'Database operations'],
      skills: profile.frameworks.filter(f => ['Express', 'Fastify', 'NestJS', 'tRPC'].includes(f)),
    },
    {
      name: 'devops-engineer',
      role: 'DevOps Engineer',
      responsibilities: ['CI/CD pipelines', 'Infrastructure', 'Deployments'],
      skills: profile.infra || [],
    },
  ];

  for (const agent of agents) {
    const agentContent = `# ${agent.role}

## Role

${agent.role} specializing in this codebase.

## Responsibilities

${agent.responsibilities.map(r => `- ${r}`).join('\n')}

## Skills

${agent.skills.map(s => `- ${s}`).join('\n') || '- General development'}

## Tools

- File read/write
- Terminal commands
- Test runner
`;

    await fs.writeFile(path.join(shipmodeDir, 'crew', `${agent.name}.md`), agentContent);
  }
}
