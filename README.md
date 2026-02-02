# ShipMode Framework

A dual-flow AI agent framework for both existing projects and fresh starts.

## 📦 Package Structure

```
shipmode/
├── packages/
│   ├── core/           @shipmode/core     → Core framework functions
│   ├── cli/            @shipmode/cli      → CLI tool (integrate mode)
│   ├── create/         @shipmode/create   → Starter kit (fresh mode)
│   └── templates/      @shipmode/templates → Scaffold templates
├── api/
│   ├── stripe/
│   │   └── webhook.ts  → Stripe payment webhook handler
│   └── github/
│       └── invite.ts   → GitHub invite API
├── src/
│   ├── lib/
│   ├── types/
│   └── utils/
└── package.json       → Monorepo root
```

## 🚀 Installation

### For Existing Projects

```bash
cd my-existing-project
npm install @shipmode/core @shipmode/cli
npx shipmode init --template api --template auth --template db
```

### For Fresh Projects

```bash
npm create @shipmode/app@latest
# Follow interactive prompts
```

## 💳 Payment Flow

```
User pays on shipmode.dev
        ↓
Stripe webhook validates payment
        ↓
GitHub API adds user to private repo
        ↓
User receives GitHub invite
        ↓
User clones repo OR runs create command
```

## 🔧 Environment Variables

```bash
# Stripe
STRIPE_WEBHOOK_SECRET=sk_test_...

# GitHub
GITHUB_TOKEN=ghp_...
GITHUB_ORG=shipmode
GITHUB_REPO=framework

# Security
WEBHOOK_SECRET=your-secret
```

## 📝 API Endpoints

### Stripe Webhook
`POST /api/stripe/webhook`
- Receives payment events
- Triggers GitHub invite

### GitHub Invite
`GET /api/github/invite?email=user@example.com`
- Check invite status

`POST /api/github/invite`
- Send invite to email

## 🛠️ Development

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm run test

# Link CLI locally
cd packages/cli && npm run link
```

## 📄 License

MIT
