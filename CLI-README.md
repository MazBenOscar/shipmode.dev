# ShipMode CLI

Your codebase's autopilot. From idea to production with AI crew.

## Installation

```bash
# Install globally
npm install -g shipmode

# Or use with npx (no install)
npx shipmode
```

## Quick Start

### From an Idea
```bash
shipmode init --from-idea
# Answer a few questions about your project
# Get a proposed tech stack
# Scaffold your project
```

### From Existing Code
```bash
cd your-project
shipmode init --from-code
# Analyzes your codebase
# Generates .shipmode/ configuration
# Activates your AI crew
```

## Commands

### `shipmode init`
Initialize ShipMode for your project.

```bash
shipmode init --from-idea    # Start from an idea
shipmode init --from-code    # Start from existing code
```

### `shipmode analyze`
Analyze a codebase and output its profile.

```bash
shipmode analyze             # Analyze current directory
shipmode analyze ./my-app    # Analyze specific path
shipmode analyze --json      # Output as JSON
```

### `shipmode run`
Execute a task with your AI crew (Phase 3).

```bash
shipmode run "Build a checkout flow"
shipmode run "Refactor auth to use OAuth"
shipmode run --dry-run "Add user profiles"  # Plan only
```

## Project Structure

After running `shipmode init`, you'll have:

```
.shipmode/
├── SHIPMODE.md           # Project overview and conventions
├── skills/
│   ├── nextjs.md        # Framework-specific patterns
│   ├── prisma.md        # Database conventions
│   └── ...
└── crew/
    ├── frontend-engineer.md
    ├── backend-engineer.md
    └── devops-engineer.md
```

## Development

```bash
# Install dependencies
npm install

# Run in dev mode
npm run dev -- init --from-code

# Build
npm run build

# Test
npm test
```

## Roadmap

- **Phase 1** (Current): CLI with codebase analysis and stack proposals
- **Phase 2**: Skill/agent generation improvements
- **Phase 3**: Autonomous execution loops
- **Phase 4**: Team collaboration + CI integration
- **Phase 5**: ShipMode Cloud

## License

MIT
