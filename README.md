# ShipMode

AI agent framework scaffolding tool. Ship your AI projects faster.

## Installation

```bash
npm install -g shipmode
```

## Quick Start

### Create a new project
```bash
shipmode create my-ai-app --template starter
cd my-ai-app
npm install
npm run dev "Hello, world!"
```

### Add to existing project
```bash
cd my-existing-project
shipmode init --template minimal
npm install
npm run agent "Your prompt here"
```

## Commands

| Command | Description |
|---------|-------------|
| `shipmode create <name>` | Create new project from template |
| `shipmode init` | Add ShipMode to existing project |
| `shipmode templates` | List available templates |
| `shipmode access` | Check your access status |

## Templates

- **starter** - Minimal AI agent with OpenAI
- **agent** - Agent with tools and structured output
- **minimal** (init) - Add AI to existing project

## Pricing

$49 one-time payment for full access to all templates and future updates.

Visit https://shipmode.dev to purchase.

## Documentation

Full documentation at https://shipmode.dev/docs

## License

MIT