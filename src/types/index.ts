export interface CodebaseProfile {
  languages: string[];
  frameworks: string[];
  appType: 'fullstack-web' | 'frontend' | 'backend' | 'api' | 'mobile' | 'library' | 'monorepo';
  db?: string[];
  infra?: string[];
  entryPoints: string[];
  packageManager?: 'npm' | 'yarn' | 'pnpm' | 'bun';
  testing?: string[];
  hasTypeScript: boolean;
  hasDocker: boolean;
  hasCI: boolean;
}

export interface StackProposal {
  stack: string[];
  rationale: string;
  alternatives: string[];
}

export interface IdeaAnswers {
  description: string;
  targetUsers: string;
  expectedUsers: 'small' | 'medium' | 'large';
  realTimeFeatures: boolean;
  teamSize: 'solo' | 'small' | 'large';
  preferredLanguage?: string;
  deploymentPreference?: string;
  needsAuth: 'none' | 'simple' | 'enterprise';
  needsPayments: 'none' | 'simple' | 'complex';
  needsMobile: 'none' | 'pwa' | 'native';
}

export interface SkillDefinition {
  name: string;
  description: string;
  whenToUse: string[];
  conventions: string[];
  examples: string[];
}

export interface AgentDefinition {
  name: string;
  role: string;
  responsibilities: string[];
  allowedTools: string[];
  skills: string[];
}
