# ShipMode Starter Template

A minimal AI agent project to get you started quickly.

## Quick Start

```bash
npm install
export OPENAI_API_KEY=your_key_here
npm run dev "Your question here"
```

## Project Structure

```
.
├── src/
│   └── index.ts          # Main agent entry point
├── dist/                 # Compiled output
├── package.json
├── tsconfig.json
└── README.md
```

## Customizing Your Agent

Edit `src/index.ts`:
- Modify `SYSTEM_PROMPT` to change agent behavior
- Change the model in `generateText()`
- Add tools, memory, or multi-agent workflows

## Next Steps

- Add tools with the `tools` parameter
- Implement memory with a vector store
- Build multi-agent workflows
- Deploy to Vercel, AWS, or your preferred platform

## Documentation

Visit https://shipmode.dev/docs for full documentation.