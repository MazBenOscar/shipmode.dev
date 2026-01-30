# ShipMode.dev 🚀

> **Your codebase's autopilot. Get in ship mode.**

Stop teaching AI about your stack. Stop writing boilerplate. Stop repeating yourself.

ShipMode puts your codebase on **autopilot** — analyzing your project, understanding your patterns, and shipping features while you focus on what matters.

---

## What is ShipMode?

ShipMode is an **AI-native development toolkit** that transforms ideas and codebases into self-driving software projects. Whether you're starting from scratch or optimizing an existing project, ShipMode generates a complete AI crew that can:

- 🔍 **Analyze** your tech stack, architecture, and patterns
- 🧠 **Learn** your coding conventions and best practices
- ✨ **Ship** features end-to-end with minimal human oversight
- 🔄 **Iterate** continuously — planning, executing, testing, deploying

## Two Ways to Ship

### 🌱 Mode 1: Idea → Scaffold → Ship
**Starting from zero?** ShipMode interviews you about your idea, proposes an optimal tech stack, scaffolds your initial project, then activates your AI crew to build it out.

```bash
npx shipmode init --from-idea
```

**The flow:**
1. **Interview** — Answer 5-7 diagnostic questions about your idea
2. **Stack Proposal** — Get a recommended tech stack based on your needs
3. **Approval** — Accept or customize the proposed stack
4. **Scaffold** — ShipMode generates your initial project structure
5. **Activate** — AI crew takes over to build features autonomously

### 🚀 Mode 2: Existing Codebase → Ship
**Already have code?** ShipMode analyzes your existing project, learns your patterns, and immediately activates your AI crew.

```bash
npx shipmode init --from-code
```

**The flow:**
1. **Analyze** — Deep scan of your codebase (languages, frameworks, patterns)
2. **Generate** — Create SHIPMODE.md, skills/, and crew/ configuration
3. **Activate** — AI crew starts shipping features in your style

---

## The Problem

```
Developer: "Build a checkout flow with Stripe"
Generic AI: "Here's basic React code..."
Developer: "No, we use Next.js App Router with tRPC"
Generic AI: "Here's tRPC code..."
Developer: "No, we put mutations in mutations/ not routes/"
Generic AI: "Here's different code..."
Developer: "Still wrong. Let me just do it myself."
```

**Hours lost. Context misunderstood. Momentum killed.**

---

## The Solution

**From Idea:**
```
Developer: "I want to build a marketplace for vintage watches"
ShipMode: *Asks diagnostic questions*
ShipMode: *Proposes: Next.js + tRPC + Prisma + Stripe*
Developer: "Looks good!" ✓
ShipMode: *Scaffolds project + generates crew*
ShipMode: *Builds core features autonomously*
Developer: *Reviews and ships*

Time to first feature: 30 minutes
```

**From Code:**
```
Developer: "Build a checkout flow with Stripe"
ShipMode: *Analyzes codebase*
ShipMode: *Generates crew specialized for your stack*
ShipMode: *Plans, codes, tests, and opens PR*
Developer: *Reviews and ships*

Time saved: 4 hours
Sanity preserved: 100%
```

---

## How It Works

### Initialize (Choose Your Path)

**From Idea:**
```bash
npx shipmode init --from-idea
```
ShipMode interviews you, proposes a stack, scaffolds your project.

**From Code:**
```bash
npx shipmode init --from-code
```
ShipMode scans your codebase and builds a complete understanding of your stack.

### Generate

After initialization, ShipMode creates your AI crew configuration:

```
.shipmode/
├── SHIPMODE.md          # Your project's AI manifesto
├── skills/
│   ├── nextjs.md        # Your Next.js patterns
│   ├── prisma.md        # Your database conventions
│   └── stripe.md        # Your payment flow patterns
└── crew/
    ├── frontend-engineer.md
    ├── backend-engineer.md
    └── devops-engineer.md
```

### Ship
```bash
npx shipmode run "Build a checkout flow with Stripe"
```

Your AI crew:
1. **Plans** the implementation
2. **Codes** following your conventions
3. **Tests** against your existing suite
4. **Opens a PR** with full context

---

## Features

- 🧬 **Deep Codebase Analysis** — AST parsing, dependency mapping, pattern detection
- 🎯 **Stack-Specific Skills** — Not generic templates. YOUR patterns.
- 👥 **Specialized AI Crew** — Frontend, backend, DevOps agents that know your project
- 🔄 **Autonomous Execution** — Plan → Code → Test → PR loops
- 🛡️ **Safety First** — Dry-run mode, approval gates, undo anything
- 🌐 **Multi-Model** — Route tasks to Claude Haiku, Sonnet, or Opus based on complexity

---

## Why ShipMode?

| Without ShipMode | With ShipMode |
|-----------------|---------------|
| Explain your stack every session | Stack is learned once, remembered forever |
| Generic code that doesn't fit your patterns | Code that matches YOUR conventions |
| You write the boilerplate | AI writes the boilerplate |
| Context switching kills flow | Stay in creative mode, ship faster |
| Junior tasks eat senior time | AI crew handles the routine |

---

## Tech Stack

ShipMode works with whatever you're building:

- **Frontend**: React, Vue, Svelte, Next.js, Astro
- **Backend**: Node.js, Python, Go, Rust, Java
- **Mobile**: React Native, Flutter, Swift
- **Databases**: PostgreSQL, MongoDB, Prisma, Drizzle
- **Infra**: Docker, Kubernetes, GitHub Actions, AWS

---

## Roadmap

- [ ] **Phase 1**: CLI + codebase analysis engine
- [ ] **Phase 2**: Skill/agent generation for major frameworks
- [ ] **Phase 3**: Autonomous execution loops
- [ ] **Phase 4**: Team collaboration + CI integration
- [ ] **Phase 5**: ShipMode Cloud — hosted agents, analytics, enterprise features

---

## Philosophy

> **"The best code is the code you don't have to write."**

But when you do write it, it should match your style, your patterns, your conventions.

ShipMode doesn't replace developers. It **amplifies** them — handling the routine so you can focus on the remarkable.

---

## Get in Ship Mode

```bash
# Coming soon
npx shipmode init
```

**Join the waitlist** → [shipmode.dev](https://shipmode.dev)

---

Built with ❤️ by developers who were tired of explaining their stack to AI.

**Get in ship mode.** 🚀

---

## License

MIT

---

*This project is in early development. Star ⭐ the repo to follow our progress!*
