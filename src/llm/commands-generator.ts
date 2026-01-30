import fs from 'fs/promises';
import path from 'path';
import type { CodebaseProfile } from '../../types/index.js';
import type { LLMAdapter } from '../adapters/base.js';

export interface CommandDefinition {
  name: string;
  description: string;
  steps: string[];
  shortcuts?: string[];
}

export interface HookDefinition {
  trigger: 'PreToolUse' | 'PostToolUse' | 'PreExit' | 'OnError';
  tool?: string;
  script: string;
}

export class CommandsGenerator {
  private adapter: LLMAdapter;
  
  constructor(adapter: LLMAdapter) {
    this.adapter = adapter;
  }
  
  async generateCommands(profile: CodebaseProfile): Promise<CommandDefinition[]> {
    const systemPrompt = `You are an expert at defining Claude Code commands.
Generate useful slash commands for this ${profile.appType} project.

Commands should cover:
1. Build/compile
2. Test
3. Lint/format
4. Database operations (if applicable)
5. Deployment
6. Common development tasks

Each command should have 3-5 clear steps.

Respond with JSON array of commands.`;

    const userPrompt = `Generate commands for this codebase:

Languages: ${profile.languages.join(', ')}
Frameworks: ${profile.frameworks.join(', ')}
App Type: ${profile.appType}
Package Manager: ${profile.packageManager || 'npm'}
Testing: ${profile.testing?.join(', ') || 'none'}
Database: ${profile.db?.join(', ') || 'none'}

Generate commands as JSON:`;

    try {
      const response = await this.adapter.generateObject<CommandDefinition[]>(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              steps: { type: 'array', items: { type: 'string' } },
              shortcuts: { type: 'array', items: { type: 'string' } },
            },
            required: ['name', 'description', 'steps'],
          },
        },
        { temperature: 0.7 }
      );
      
      return response;
    } catch (error) {
      // Fallback to default commands
      return this.getDefaultCommands(profile);
    }
  }
  
  async generateHooks(profile: CodebaseProfile): Promise<HookDefinition[]> {
    const hooks: HookDefinition[] = [];
    
    // PreToolUse hook for Bash commands (safety check)
    hooks.push({
      trigger: 'PreToolUse',
      tool: 'Bash',
      script: `echo "[ShipMode] Executing: $1"
if [[ "$1" == *"rm -rf"* ]] || [[ "$1" == *"drop"* ]]; then
  echo "⚠️  Destructive command detected. Confirm with user."
fi`,
    });
    
    // PreToolUse hook for Write/Edit (backup)
    hooks.push({
      trigger: 'PreToolUse',
      tool: 'Write',
      script: `echo "[ShipMode] Creating backup before write..."
cp "$1" "$1.bak" 2>/dev/null || true`,
    });
    
    // OnError hook (recovery suggestion)
    hooks.push({
      trigger: 'OnError',
      script: `echo "[ShipMode] An error occurred. Checking for common issues..."
if [[ "$1" == *"port"* ]]; then
  echo "💡 Tip: Port might be in use. Try: lsof -ti:3000 | xargs kill"
fi`,
    });
    
    return hooks;
  }
  
  async writeCommandsToFile(commands: CommandDefinition[]): Promise<string> {
    const content = commands.map(cmd => `
## /${cmd.name}

${cmd.description}

${cmd.shortcuts ? `Shortcuts: ${cmd.shortcuts.join(', ')}` : ''}

### Steps
${cmd.steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}
`).join('\n---\n');

    return content;
  }
  
  private getDefaultCommands(profile: CodebaseProfile): CommandDefinition[] {
    const commands: CommandDefinition[] = [];
    
    // Build command
    if (profile.frameworks.includes('Next.js')) {
      commands.push({
        name: 'build',
        description: 'Build the Next.js application',
        steps: [
          'Run `npm run build` or `next build`',
          'Check for TypeScript errors',
          'Verify output in .next/ directory',
        ],
        shortcuts: ['b'],
      });
    }
    
    // Test command
    if (profile.testing && profile.testing.length > 0) {
      commands.push({
        name: 'test',
        description: 'Run the test suite',
        steps: [
          `Run tests with ${profile.testing[0]}`,
          'Check for failing tests',
          'Run coverage report if available',
        ],
        shortcuts: ['t'],
      });
    }
    
    // Lint command
    commands.push({
      name: 'lint',
      description: 'Lint and format code',
      steps: [
        'Run `npm run lint` or `eslint`',
        'Auto-fix issues where possible',
        'Report remaining issues',
      ],
      shortcuts: ['l'],
    });
    
    // Database commands
    if (profile.db && profile.db.some(d => d.includes('Prisma'))) {
      commands.push({
        name: 'db-migrate',
        description: 'Run database migrations',
        steps: [
          'Run `npx prisma migrate dev`',
          'Generate Prisma Client',
          'Verify schema is up to date',
        ],
      });
      
      commands.push({
        name: 'db-studio',
        description: 'Open Prisma Studio',
        steps: [
          'Run `npx prisma studio`',
          'Open browser to http://localhost:5555',
        ],
      });
    }
    
    // Dev server command
    commands.push({
      name: 'dev',
      description: 'Start development server',
      steps: [
        'Run `npm run dev` or equivalent',
        'Wait for server to start',
        'Open browser if needed',
      ],
      shortcuts: ['d'],
    });
    
    return commands;
  }
}
