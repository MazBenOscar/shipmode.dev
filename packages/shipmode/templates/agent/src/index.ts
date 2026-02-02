import { generateText, tool } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

/**
 * ShipMode Agent Template
 * 
 * Features:
 * - Tool use
 * - Structured output
 * - Error handling
 */

const weatherTool = tool({
  description: 'Get the current weather for a location',
  parameters: z.object({
    location: z.string().describe('City name'),
  }),
  execute: async ({ location }) => {
    // Mock weather data - replace with real API
    return {
      location,
      temperature: 72,
      condition: 'sunny',
    };
  },
});

const calculatorTool = tool({
  description: 'Perform basic math calculations (+, -, *, /)',
  parameters: z.object({
    a: z.number().describe('First number'),
    b: z.number().describe('Second number'),
    operation: z.enum(['add', 'subtract', 'multiply', 'divide']).describe('Operation to perform'),
  }),
  execute: async ({ a, b, operation }) => {
    switch (operation) {
      case 'add': return { result: a + b };
      case 'subtract': return { result: a - b };
      case 'multiply': return { result: a * b };
      case 'divide': 
        if (b === 0) return { error: 'Cannot divide by zero' };
        return { result: a / b };
    }
  },
});

async function main() {
  const userInput = process.argv.slice(2).join(' ') || 'What can you help me with?';
  
  console.log('🤖 ShipMode Agent with Tools');
  console.log('-----------------------------');
  console.log(`User: ${userInput}\n`);
  
  try {
    const { text, toolCalls } = await generateText({
      model: openai('gpt-4o'),
      system: `You are a helpful assistant with access to tools.`,
      prompt: userInput,
      tools: {
        weather: weatherTool,
        calculator: calculatorTool,
      },
    });
    
    if (toolCalls.length > 0) {
      console.log('Tools used:', toolCalls.map(t => t.toolName).join(', '));
    }
    
    console.log(`\nAgent: ${text}`);
  } catch (error) {
    console.error('Error:', error);
    console.log('\n💡 Make sure you have set OPENAI_API_KEY');
    process.exit(1);
  }
}

main();