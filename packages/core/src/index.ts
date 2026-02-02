/**
 * ShipMode Core Framework
 * 
 * A lightweight AI agent framework for building intelligent applications.
 * 
 * @packageDocumentation
 */

// Core exports
export { ShipMode } from './shipmode';
export { Agent, AgentConfig, AgentRole } from './agent';
export { Memory, MemoryConfig, MemoryType } from './memory';
export { Task, TaskStatus, TaskPriority } from './task';
export { Tool, ToolResult } from './tool';
export { Provider, ModelConfig } from './provider';

// Hook exports
export { useAgent } from './hooks/useAgent';
export { useTask } from './hooks/useTask';
export { useMemory } from './hooks/useMemory';

// Utility exports
export { createTool } from './utils/createTool';
export { asyncFlow } from './utils/asyncFlow';
export { parseStructuredOutput } from './utils/structuredOutput';

// Type exports
export * from './types';

// Version
export const VERSION = '1.0.0';
