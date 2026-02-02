import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

/**
 * ShipMode Starter Agent
 * 
 * This is your entry point. Modify the system prompt and model
 * to build your own AI agent.
 */

const SYSTEM_PROMPT = `You are a helpful assistant built with ShipMode.
You help developers build AI-powered applications.
Be concise, practical, and encouraging.`;

async function main() {
  const userInput = process.argv.slice(2).join(' ') || 'Hello, what can you help me with?';
  
  console.log('🚀 ShipMode Agent');
  console.log('----------------');
  console.log(`User: ${userInput}\n`);
  
  try {
    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      system: SYSTEM_PROMPT,
      prompt: userInput,
    });
    
    console.log(`Agent: ${text}`);
  } catch (error) {
    console.error('Error:', error);
    console.log('\n💡 Make sure you have set OPENAI_API_KEY in your environment');
    process.exit(1);
  }
}

main();