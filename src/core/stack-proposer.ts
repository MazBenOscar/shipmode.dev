import type { IdeaAnswers, StackProposal } from '../types/index.js';

export async function proposeStack(answers: IdeaAnswers): Promise<StackProposal> {
  // Simple rule-based stack proposal (Phase 1)
  // In Phase 2+, this would use LLM for smarter recommendations
  
  const stack: string[] = [];
  const alternatives: string[] = [];
  let rationale = '';

  // Determine frontend framework
  if (answers.needsMobile === 'native') {
    stack.push('React Native + Expo');
    alternatives.push('Flutter');
  } else {
    stack.push('Next.js');
    alternatives.push('Remix', 'Astro');
  }

  // Language preference
  if (answers.preferredLanguage?.toLowerCase() === 'typescript' || 
      answers.preferredLanguage === "don't care") {
    stack.push('TypeScript');
  }

  // Styling
  stack.push('Tailwind CSS', 'shadcn/ui');

  // Database
  if (answers.expectedUsers === 'large') {
    stack.push('PostgreSQL + Prisma');
    alternatives.push('PostgreSQL + Drizzle');
  } else {
    stack.push('PostgreSQL + Prisma');
  }

  // API layer
  if (answers.realTimeFeatures) {
    stack.push('tRPC + WebSockets');
  } else {
    stack.push('tRPC');
  }

  // Auth
  if (answers.needsAuth === 'enterprise') {
    stack.push('NextAuth.js + Enterprise SSO');
  } else if (answers.needsAuth === 'simple') {
    stack.push('NextAuth.js');
  }

  // Payments
  if (answers.needsPayments === 'complex') {
    stack.push('Stripe Connect');
  } else if (answers.needsPayments === 'simple') {
    stack.push('Stripe');
  }

  // Deployment
  stack.push('Vercel');

  rationale = generateRationale(answers, stack);

  return {
    stack,
    rationale,
    alternatives,
  };
}

function generateRationale(answers: IdeaAnswers, stack: string[]): string {
  const parts: string[] = [];

  if (stack.includes('Next.js')) {
    parts.push('Next.js provides excellent developer experience and deployment on Vercel.');
  }

  if (stack.includes('tRPC')) {
    parts.push('tRPC ensures type-safe APIs from day one.');
  }

  if (stack.includes('PostgreSQL + Prisma')) {
    parts.push('PostgreSQL with Prisma gives you a robust ORM and easy migrations.');
  }

  if (answers.teamSize === 'solo') {
    parts.push('This stack is optimized for solo developers to ship fast.');
  }

  return parts.join(' ');
}
