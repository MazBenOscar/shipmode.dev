import fs from 'fs/promises';
import path from 'path';
import type { LLMAdapter } from './adapters/base.js';
import type { Message } from './types.js';
import { COLORS } from '../utils/ui.js';

export interface AgentTask {
  description: string;
  context?: string;
  maxIterations?: number;
  allowedTools?: string[];
}

export interface AgentStep {
  id: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  result?: string;
  error?: string;
}

export interface AgentPlan {
  steps: AgentStep[];
  estimatedComplexity: 'low' | 'medium' | 'high';
  reasoning: string;
}

export interface AgentResult {
  success: boolean;
  plan: AgentPlan;
  executedSteps: AgentStep[];
  summary: string;
  filesModified: string[];
}

/**
 * The AgentExecutor implements the Claude Agent SDK pattern:
 * 1. Planning Phase - Create a step-by-step plan
 * 2. Execution Phase - Execute each step with tool use
 * 3. Verification Phase - Verify the results
 */
export class AgentExecutor {
  private adapter: LLMAdapter;
  private systemPrompt: string;
  private maxIterations: number;
  
  constructor(adapter: LLMAdapter, shipmodeDir: string = '.shipmode') {
    this.adapter = adapter;
    this.maxIterations = 50;
    this.systemPrompt = this.buildSystemPrompt(shipmodeDir);
  }
  
  /**
   * Execute a task using the full agent loop
   */
  async execute(task: AgentTask): Promise<AgentResult> {
    console.log(COLORS.bold.cyan('\n🚀 Starting Agent Execution\n'));
    console.log(COLORS.gray('Task:'), task.description);
    console.log();
    
    // Phase 1: Planning
    const plan = await this.createPlan(task);
    console.log(COLORS.cyan('📋 Plan created:'), plan.steps.length, 'steps');
    console.log(COLORS.gray('Complexity:'), plan.estimatedComplexity);
    console.log();
    
    // Display plan
    plan.steps.forEach((step, i) => {
      console.log(`  ${i + 1}. ${step.description}`);
    });
    console.log();
    
    // Phase 2: Execution
    const executedSteps: AgentStep[] = [];
    const filesModified: string[] = [];
    
    for (const step of plan.steps) {
      console.log(COLORS.cyan(`\n▶️  Executing: ${step.description}`));
      
      step.status = 'in-progress';
      
      try {
        const result = await this.executeStep(step, executedSteps);
        step.status = 'completed';
        step.result = result;
        
        // Track file modifications
        const modifiedFiles = this.extractFilePaths(result);
        filesModified.push(...modifiedFiles);
        
        console.log(COLORS.green('✓ Completed'));
        if (result.length < 200) {
          console.log(COLORS.gray(result));
        }
      } catch (error) {
        step.status = 'failed';
        step.error = error instanceof Error ? error.message : String(error);
        console.log(COLORS.red('✗ Failed:', step.error));
        
        // Try to recover or ask for guidance
        const shouldContinue = await this.handleError(step, error as Error);
        if (!shouldContinue) {
          break;
        }
      }
      
      executedSteps.push(step);
    }
    
    // Phase 3: Verification & Summary
    const summary = await this.generateSummary(task, executedSteps);
    
    return {
      success: executedSteps.every(s => s.status === 'completed'),
      plan,
      executedSteps,
      summary,
      filesModified: [...new Set(filesModified)],
    };
  }
  
  /**
   * Create a plan for the task
   */
  private async createPlan(task: AgentTask): Promise<AgentPlan> {
    const messages: Message[] = [
      {
        role: 'system',
        content: `${this.systemPrompt}

You are a planning agent. Break down the task into clear, executable steps.
Each step should be specific and actionable.

Respond with JSON:
{
  "steps": [
    { "id": "1", "description": "Step description", "status": "pending" }
  ],
  "estimatedComplexity": "low|medium|high",
  "reasoning": "Why this approach"
}`,
      },
      {
        role: 'user',
        content: `Create a plan for this task: ${task.description}
${task.context ? `\nContext: ${task.context}` : ''}`,
      },
    ];
    
    const response = await this.adapter.generateObject<AgentPlan>(
      messages,
      {
        type: 'object',
        properties: {
          steps: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                description: { type: 'string' },
                status: { type: 'string', enum: ['pending'] },
              },
              required: ['id', 'description', 'status'],
            },
          },
          estimatedComplexity: { type: 'string', enum: ['low', 'medium', 'high'] },
          reasoning: { type: 'string' },
        },
        required: ['steps', 'estimatedComplexity', 'reasoning'],
      },
      { temperature: 0.7 }
    );
    
    return response;
  }
  
  /**
   * Execute a single step
   */
  private async executeStep(step: AgentStep, previousSteps: AgentStep[]): Promise<string> {
    const context = previousSteps
      .filter(s => s.result)
      .map(s => `Previous: ${s.description}\nResult: ${s.result}`)
      .join('\n\n');
    
    const messages: Message[] = [
      {
        role: 'system',
        content: `${this.systemPrompt}

You are an execution agent. Execute the current step using available tools.
Tools: Read, Write, Edit, Bash, Glob, Grep

Use the most appropriate tool for the task.`,
      },
      {
        role: 'user',
        content: `Execute this step: ${step.description}

${context ? `Previous steps:\n${context}\n\n` : ''}
Execute the step and return the result.`,
      },
    ];
    
    // For now, we simulate tool use - in full implementation, this would:
    // 1. Call the LLM to decide which tool to use
    // 2. Execute the tool
    // 3. Return the result
    
    const response = await this.adapter.complete(messages, {
      temperature: 0.7,
      maxTokens: 2000,
    });
    
    return response.content;
  }
  
  /**
   * Handle execution errors
   */
  private async handleError(step: AgentStep, error: Error): Promise<boolean> {
    console.log(COLORS.yellow('\n⚠️  Error handling...'));
    
    // Simple retry logic for now
    // Full implementation would analyze error and decide:
    // - Retry with modified approach
    // - Ask user for guidance
    // - Skip step and continue
    // - Abort
    
    return true; // Continue by default
  }
  
  /**
   * Generate final summary
   */
  private async generateSummary(task: AgentTask, steps: AgentStep[]): Promise<string> {
    const completedSteps = steps.filter(s => s.status === 'completed').length;
    const failedSteps = steps.filter(s => s.status === 'failed').length;
    
    if (failedSteps === 0) {
      return `Successfully completed "${task.description}" in ${completedSteps} steps.`;
    } else {
      return `Partially completed "${task.description}". ${completedSteps} steps succeeded, ${failedSteps} failed.`;
    }
  }
  
  /**
   * Build system prompt from ShipMode config
   */
  private buildSystemPrompt(shipmodeDir: string): string {
    return `You are ShipMode, an AI coding assistant.
You have access to the following tools:
- Read: Read file contents
- Write: Write new files
- Edit: Modify existing files
- Bash: Execute shell commands
- Glob: Find files matching patterns
- Grep: Search file contents

You are working in a project with ShipMode configuration in ${shipmodeDir}/.
Always follow the conventions defined in the skills and SHIPMODE.md.`;
  }
  
  /**
   * Extract file paths from execution result
   */
  private extractFilePaths(result: string): string[] {
    // Simple regex to find file paths
    const filePathRegex = /(?:\/[^\s\/]+)+\.[a-zA-Z]+/g;
    return result.match(filePathRegex) || [];
  }
}
