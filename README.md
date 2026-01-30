# ShipMode CLI v0.2.0 — Full Claude Agent SDK Integration

**Your codebase's autopilot.** From idea to production with AI crew.

## What's New in v0.2.0

### ✅ Phase 1: Configuration Generation (Complete)
- Multi-LLM provider support (Anthropic, OpenAI)
- AI-enhanced codebase analysis
- Project-specific skill generation
- CLAUDE.md / CODEX.md generation

### ✅ Phase 2: Commands & Hooks (Complete)
- Custom slash commands (`/build`, `/test`, `/deploy`)
- PreToolUse/PostToolUse hooks for safety & automation
- Framework-aware command generation

### ✅ Phase 3: Agent Execution (Complete)
- Full agent loop: Planning → Execution → Verification
- Multi-step task execution
- Autonomous coding with Claude SDK

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      ShipMode CLI                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Phase 1: CONFIGURATION                                     │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐ │
│  │   Analyzer  │───→│  Generator  │───→│  SHIPMODE.md    │ │
│  │  (40+ fwks) │    │  (AI-enh)   │    │  Skills/Crew    │ │
│  └─────────────┘    └─────────────┘    └─────────────────┘ │
│                                                             │
│  Phase 2: COMMANDS & HOOKS                                  │
│  ┌─────────────┐    ┌─────────────┐                        │
│  │  Commands   │    │    Hooks    │                        │
│  │   /build    │    │ PreToolUse  │                        │
│  │   /test     │    │ PostToolUse │                        │
│  │   /deploy   │    │   OnError   │                        │
│  └─────────────┘    └─────────────┘                        │
│                                                             │
│  Phase 3: AGENT EXECUTION                                   │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐ │
│  │   Planner   │───→│  Executor   │───→│  Verifier       │ │
│  │  (Create    │    │  (Execute   │    │  (Validate &    │ │
│  │   steps)    │    │   steps)    │    │   summarize)    │ │
│  └─────────────┘    └─────────────┘    └─────────────────┘ │
│         ↑                                              │    │
│         └──────────────── Loop ←───────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Installation

```bash
npm install -g shipmode
```

Or use with npx:
```bash
npx shipmode
```

---

## Quick Start

### 1. Configure Your LLM Provider

```bash
# Interactive wizard
shipmode config wizard

# Or set manually
shipmode config set-provider anthropic
shipmode config set-model anthropic claude-sonnet-4-5
shipmode config set-api-key anthropic
```

### 2. Initialize Your Project

```bash
# From existing code (analyzes and generates config)
shipmode init --from-code

# From an idea (interactive stack proposal)
shipmode init --from-idea

# With specific provider
shipmode init --from-code --provider openai --model codex
```

### 3. Run the Agent

```bash
# Execute a task with your AI crew
shipmode run "Build a checkout flow with Stripe"

# Dry run (plan only)
shipmode run "Refactor auth module" --dry-run

# With specific provider
shipmode run "Add tests" --provider anthropic
```

---

## Multi-LLM Provider Support

| Provider | Models | Status |
|----------|--------|--------|
| **Anthropic** | Claude Opus 4.5, Sonnet 4.5, Haiku 3.5 | ✅ Ready |
| **OpenAI** | GPT-5.2, GPT-4o, GPT-4o-mini, Codex | ✅ Ready |
| Google | Gemini 3 Pro, Gemini 3 Flash | 📝 Planned |
| Moonshot | Kimi 2.5 | 📝 Planned |
| MiniMax | M2.1 | 📝 Planned |
| Ollama | Llama 3, Mistral, etc. | 📝 Planned |

### Usage Examples

```bash
# Use Claude (default)
shipmode init --from-code --provider anthropic --model claude-opus-4-5

# Use OpenAI Codex
shipmode init --from-code --provider openai --model codex

# Use GPT-4o
shipmode run "Add feature" --provider openai --model gpt-4o
```

---

## Generated Structure

```
.shipmode/
├── SHIPMODE.md              # Project context (read by Claude Code)
├── commands/
│   └── index.md             # Custom slash commands
├── hooks/
│   └── hooks.json           # Pre/Post tool hooks
├── skills/
│   ├── nextjs.md            # Framework-specific patterns
│   ├── react.md             # Learned from your code
│   └── prisma.md            # Your DB conventions
└── crew/
    ├── frontend-engineer.md # Agent definitions
    ├── backend-engineer.md
    └── devops-engineer.md
```

---

## Commands

### Configuration
```bash
shipmode config show                    # Display current config
shipmode config wizard                  # Interactive setup
shipmode config set-provider <name>     # Set default provider
shipmode config set-model <provider> <model>
shipmode config set-api-key <provider>  # Set API key
```

### Initialization
```bash
shipmode init --from-idea               # Start from scratch
shipmode init --from-code               # Analyze existing project
shipmode init --provider <name>         # Use specific LLM
shipmode init --model <name>            # Use specific model
shipmode init --target <claude|codex>   # Output format
```

### Analysis
```bash
shipmode analyze [path]                 # Analyze codebase
shipmode analyze --json                 # Output as JSON
```

### Execution
```bash
shipmode run "task description"         # Execute with AI crew
shipmode run "task" --dry-run           # Plan only
shipmode run "task" --provider <name>   # Use specific LLM
```

---

## How It Works

### Phase 1: Configuration

```bash
shipmode init --from-code
```

1. **Analysis**: Detects 40+ frameworks, languages, patterns
2. **Generation**: Uses LLM to create project-specific config
3. **Output**: SHIPMODE.md + Skills + Crew Agents

### Phase 2: Commands & Hooks

Generated automatically during init:

**Commands** (`.shipmode/commands/index.md`):
```markdown
## /build
Build the Next.js application

### Steps
1. Run `npm run build`
2. Check for TypeScript errors
3. Verify output in .next/
```

**Hooks** (`.shipmode/hooks/hooks.json`):
```json
[
  {
    "trigger": "PreToolUse",
    "tool": "Bash",
    "script": "echo '[ShipMode] Executing: $1'"
  }
]
```

### Phase 3: Agent Execution

```bash
shipmode run "Build a checkout flow"
```

1. **Planning**: LLM creates step-by-step plan
2. **Execution**: Each step executed with tool use
3. **Verification**: Results validated and summarized
4. **Loop**: Continue until complete or max iterations

---

## Environment Variables

```bash
# API Keys (alternatives to config wizard)
export ANTHROPIC_API_KEY=sk-ant-...
export OPENAI_API_KEY=sk-...
export GOOGLE_API_KEY=...
export MOONSHOT_API_KEY=...
export MINIMAX_API_KEY=...
```

---

## Configuration File

`~/.shipmode/config.json`:
```json
{
  "defaultProvider": "anthropic",
  "providers": {
    "anthropic": {
      "defaultModel": "claude-sonnet-4-5-20250929"
    },
    "openai": {
      "defaultModel": "codex"
    }
  }
}
```

---

## Examples

### Initialize a Next.js Project
```bash
cd my-nextjs-app
shipmode init --from-code --provider anthropic
```

**Generated Output:**
- Detects: TypeScript, Next.js, React, Tailwind
- Creates: SHIPMODE.md with Next.js conventions
- Skills: nextjs.md, react.md, tailwind-css.md
- Crew: frontend-engineer, backend-engineer, devops-engineer

### Execute a Task
```bash
shipmode run "Add Stripe checkout with webhook handling"
```

**Execution Flow:**
1. Plan: Create API route → Add UI component → Set up webhook
2. Execute: Generate code for each step
3. Verify: Check TypeScript, run tests
4. Summary: Files modified, tests passing

### Multi-Provider Workflow
```bash
# Use Claude for complex architecture
shipmode init --from-idea --provider anthropic --model claude-opus-4-5

# Use Codex for implementation
shipmode run "Implement the API routes" --provider openai --model codex
```

---

## Roadmap

### ✅ Phase 1: Configuration (Complete)
- [x] Multi-LLM support
- [x] AI-enhanced analysis
- [x] Project-specific skills
- [x] CLAUDE.md generation

### ✅ Phase 2: Commands & Hooks (Complete)
- [x] Custom slash commands
- [x] Pre/Post tool hooks
- [x] Framework-aware commands

### ✅ Phase 3: Agent Execution (Complete)
- [x] Planning agent
- [x] Execution loop
- [x] Verification step

### Phase 4: Advanced Features (Next)
- [ ] Remaining LLM providers (Google, Moonshot, MiniMax, Ollama)
- [ ] Smart model routing (cheap → expensive)
- [ ] Provider fallback chains
- [ ] Cost tracking
- [ ] Local caching

### Phase 5: Cloud Features (Future)
- [ ] Team collaboration
- [ ] CI/CD integration
- [ ] Hosted agents
- [ ] Usage analytics

---

## License

MIT

---

Built with ❤️ for developers who want to ship faster.
