import type { CodebaseProfile } from '../types/index.js';
import type { LLMAdapter } from './adapters/base.js';

export interface GeneratedConfig {
  files: {
    path: string;
    content: string;
  }[];
}

export class ConfigGenerator {
  private adapter: LLMAdapter;
  
  constructor(adapter: LLMAdapter) {
    this.adapter = adapter;
  }
  
  async generateForClaudeCode(profile: CodebaseProfile): Promise<GeneratedConfig> {
    const systemPrompt = `You are an expert at creating CLAUDE.md files for Claude Code.
Generate a comprehensive CLAUDE.md that helps Claude understand this codebase.

The file should include:
1. Project overview and purpose
2. Key directories and their purposes
3. Coding standards and conventions
4. Common commands (build, test, lint, etc.)
5. Architecture patterns used
6. Important notes or warnings

Make it concise but comprehensive. Use the actual detected frameworks and patterns.`;

    const userPrompt = `Generate a CLAUDE.md file for this codebase:

Languages: ${profile.languages.join(', ')}
Frameworks: ${profile.frameworks.join(', ')}
App Type: ${profile.appType}
Entry Points: ${profile.entryPoints.join(', ')}
Package Manager: ${profile.packageManager || 'npm'}
TypeScript: ${profile.hasTypeScript ? 'Yes' : 'No'}
Docker: ${profile.hasDocker ? 'Yes' : 'No'}
CI/CD: ${profile.hasCI ? 'Yes' : 'No'}
${profile.db ? `Database: ${profile.db.join(', ')}` : ''}
${profile.infra ? `Infrastructure: ${profile.infra.join(', ')}` : ''}
${profile.testing ? `Testing: ${profile.testing.join(', ')}` : ''}

Generate a CLAUDE.md file:`;

    const response = await this.adapter.complete([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], {
      temperature: 0.7,
      maxTokens: 2000,
    });

    return {
      files: [
        {
          path: 'CLAUDE.md',
          content: response.content,
        },
      ],
    };
  }
  
  async generateForCodex(profile: CodebaseProfile): Promise<GeneratedConfig> {
    const systemPrompt = `You are an expert at creating Codex configuration files.
Generate instructions that help Codex CLI work effectively with this codebase.

Include:
1. Project overview
2. Build and development commands
3. Code patterns and conventions
4. Testing approach
5. File organization rules`;

    const userPrompt = `Generate a CODEX.md configuration for this codebase:

Languages: ${profile.languages.join(', ')}
Frameworks: ${profile.frameworks.join(', ')}
App Type: ${profile.appType}
Entry Points: ${profile.entryPoints.join(', ')}
Package Manager: ${profile.packageManager || 'npm'}

Generate configuration:`;

    const response = await this.adapter.complete([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], {
      temperature: 0.7,
      maxTokens: 2000,
    });

    return {
      files: [
        {
          path: 'CODEX.md',
          content: response.content,
        },
        {
          path: '.codex/instructions.md',
          content: this.generateCodexInstructions(profile),
        },
      ],
    };
  }
  
  async generateSkill(
    framework: string,
    codeSamples: string[],
    profile: CodebaseProfile
  ): Promise<string> {
    const systemPrompt = `You are an expert at writing AI crew skills.
Generate a skill file that teaches an AI coding agent how to work with ${framework} in this specific codebase.

The skill should include:
1. Overview of how ${framework} is used in this project
2. When to use it
3. Local conventions and patterns (extracted from code samples)
4. Examples referencing actual code paths
5. Common pitfalls to avoid`;

    const userPrompt = `Generate a skill file for ${framework}.

Code Samples:
${codeSamples.map((sample, i) => `--- Sample ${i + 1} ---\n${sample.slice(0, 1000)}`).join('\n\n')}

Project Context:
- Languages: ${profile.languages.join(', ')}
- Frameworks: ${profile.frameworks.join(', ')}
- App Type: ${profile.appType}

Generate the skill file content:`;

    const response = await this.adapter.complete([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], {
      temperature: 0.7,
      maxTokens: 3000,
    });

    return response.content;
  }
  
  async generateStackProposal(
    idea: {
      description: string;
      targetUsers: string;
      expectedUsers: string;
      realTimeFeatures: boolean;
      teamSize: string;
      preferredLanguage?: string;
      needsAuth: string;
      needsPayments: string;
      needsMobile: string;
    }
  ): Promise<{ stack: string[]; rationale: string; alternatives: string[] }> {
    const systemPrompt = `You are an expert software architect who recommends tech stacks.
Given a project idea, recommend the optimal tech stack with clear rationale.

Respond with JSON in this format:
{
  "stack": ["Framework", "Language", "Database", ...],
  "rationale": "Why this stack fits the requirements...",
  "alternatives": ["Alternative stack option 1", "Alternative stack option 2"]
}`;

    const userPrompt = `Recommend a tech stack for this project:

Description: ${idea.description}
Target Users: ${idea.targetUsers}
Expected Scale: ${idea.expectedUsers}
Real-time Features: ${idea.realTimeFeatures ? 'Yes' : 'No'}
Team Size: ${idea.teamSize}
Preferred Language: ${idea.preferredLanguage || 'Not specified'}
Authentication: ${idea.needsAuth}
Payments: ${idea.needsPayments}
Mobile: ${idea.needsMobile}

Recommend the optimal stack as JSON:`;

    return await this.adapter.generateObject(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      {
        type: 'object',
        properties: {
          stack: { type: 'array', items: { type: 'string' } },
          rationale: { type: 'string' },
          alternatives: { type: 'array', items: { type: 'string' } },
        },
        required: ['stack', 'rationale', 'alternatives'],
      },
      { temperature: 0.7 }
    );
  }
  
  private generateCodexInstructions(profile: CodebaseProfile): string {
    return `# Codex Instructions for ${profile.appType} Project

## Project Type
${profile.appType}

## Tech Stack
- Languages: ${profile.languages.join(', ')}
- Frameworks: ${profile.frameworks.join(', ')}

## Commands
${profile.packageManager === 'pnpm' ? '- pnpm install' : profile.packageManager === 'yarn' ? '- yarn install' : '- npm install'}
${profile.packageManager === 'pnpm' ? '- pnpm dev' : profile.packageManager === 'yarn' ? '- yarn dev' : '- npm run dev'}
${profile.testing ? `- ${profile.packageManager === 'npm' ? 'npm test' : profile.packageManager + ' test'}` : ''}

## Entry Points
${profile.entryPoints.map(ep => `- ${ep}`).join('\n')}

## Guidelines
- Follow existing code patterns in the codebase
- Use TypeScript strictly when available
- Write tests for new features
- Run linting before committing
`;
  }
}

export type TargetAgent = 'claude' | 'codex' | 'opencode' | 'generic';
