# Quick Start Guide

Get the ONTON Reputation API and AI Concierge Bot running in under 5 minutes.

## Prerequisites

- **Node.js** 18+ and **npm** 9+
- Access to ONTON PostgreSQL database (via SSH tunnel or local Docker)
- **DeepSeek API key** (for the AI Concierge Bot)
- **Telegram Bot Token** (from [@BotFather](https://t.me/BotFather))

## 1. Clone & Install

```bash
git clone https://github.com/bemehrbani/TON-AI-Hackathon-2026.git
cd TON-AI-Hackathon-2026
npm install
```

## 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
DATABASE_URL=postgres://user:pass@localhost:5432/dbname
DEEPSEEK_API_KEY=sk-your-key
BOT_TOKEN=your-telegram-bot-token
API_PORT=3100
API_BASE_URL=http://localhost:3100
```

## 3. Start the API

```bash
npm run dev:api
# 🚀 ONTON Reputation API running on port 3100
```

Test it:

```bash
curl http://localhost:3100/health
# {"status":"healthy","timestamp":"...","version":"0.1.0"}

curl http://localhost:3100/v1/leaderboard?limit=3
# Returns top 3 users by reputation score
```

## 4. Start the AI Concierge Bot

In a separate terminal:

```bash
npm run dev:bot
# 🤖 ONTON AI Concierge Bot started
```

Open [@OntonAgentBot](https://t.me/OntonAgentBot) in Telegram and try:
- "What's the reputation for wallet EQDyjLJr...?"
- "Show me upcoming events"
- "Who's on the leaderboard?"

## 5. Use the SDK

```typescript
import { OntonSDK } from '@onton/agent-sdk';

const onton = new OntonSDK({ baseUrl: 'http://localhost:3100' });
const rep = await onton.reputation.get('EQDyjLJr...');
console.log(`Score: ${rep.totalScore}, Rank: ${rep.rank}/${rep.totalUsers}`);
```

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌──────────────┐
│  Telegram User   │───▶│  AI Concierge   │───▶│  ONTON API   │
│  (natural lang)  │    │  (DeepSeek LLM) │    │  (Hono REST) │
└─────────────────┘    └─────────────────┘    └──────┬───────┘
                                                      │
                       ┌─────────────────┐    ┌──────▼───────┐
                       │  External Agent  │───▶│  PostgreSQL  │
                       │  (via SDK/Tools) │    │  (930K users)│
                       └─────────────────┘    └──────────────┘
```

## Project Structure

```
packages/
├── api/          # Hono REST API + Drizzle ORM
├── sdk/          # TypeScript SDK + LangChain tools
└── concierge/    # grammY Telegram Bot + DeepSeek
```

## Next Steps

- See [API Reference](./api-reference.md) for all endpoints and response formats
- Explore the [SDK source](../packages/sdk/src/) for LangChain tool definitions
- Check [schema.ts](../packages/api/src/db/schema.ts) for the full data model
