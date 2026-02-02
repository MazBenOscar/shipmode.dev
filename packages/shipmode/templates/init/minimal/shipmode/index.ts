import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

/**
 * ShipMode Agent
 * Add this to your existing project to add AI capabilities.
 */

export async function runAgent(prompt: string): Promise<string> {
  const { text } = await generateText({
    model: openai('gpt-4o-mini'),
    prompt,
  });
  
  return text;
}

// Run directly: npm run agent "your prompt"
if (import.meta.url === `file://${process.argv[1]}`) {
  const input = process.argv.slice(2).join(' ') || 'Hello!';
  runAgent(input).then(console.log);
}