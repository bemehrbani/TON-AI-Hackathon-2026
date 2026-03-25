# ONTON Reputation API & AI Concierge Bot

> **TON AI Agent Hackathon 2026** — Building trust infrastructure for the TON Agent ecosystem.

## What is ONTON?

[ONTON](https://onton.live) is a Telegram-native event platform on the TON blockchain with **931,000+ registered users** and **2,400+ events**. Users earn reputation through event participation, community engagement, and SBT attestations.

This hackathon project exposes ONTON's production reputation data as **API infrastructure for AI agents** and demonstrates a **Telegram-native AI Concierge Bot** that leverages this data.

---

## 🏗️ Submission A: ONTON Reputation API & SDK (Track 1 — Agent Infrastructure)

A public REST API and TypeScript SDK that makes ONTON's on-chain reputation data accessible to any AI agent.

### API Endpoints

| Endpoint | Description |
|---|---|
| `GET /v1/reputation/:wallet` | Wallet reputation score, rank, activity breakdown |
| `GET /v1/reputation/:wallet/history` | Score timeline by activity type |
| `GET /v1/events` | Filterable event list (date, type, location) |
| `GET /v1/events/:uuid/stats` | Event attendance stats and check-in rates |
| `GET /v1/leaderboard` | Top users ranked by total reputation score |
| `GET /v1/verify/sbt/:wallet` | SBT holdings with collection info |
| `POST /v1/agents/query` | Natural language query endpoint for AI agents |
| `GET /health` | Health check |

### SDK Usage

```typescript
import { OntonSDK } from '@onton/agent-sdk';

const onton = new OntonSDK({ baseUrl: 'http://localhost:3100' });
const reputation = await onton.reputation.get('EQDyjL...');
const events = await onton.events.list({ type: 'offline', limit: 10 });
const tools = onton.getAgentTools(); // LangChain-compatible
```

### LangChain Integration

```typescript
import { getOntonTools } from '@onton/agent-sdk/tools';

// Plug directly into any LangChain agent
const tools = getOntonTools({ baseUrl: 'http://localhost:3100' });
```

---

## 🤖 Submission B: AI Concierge Bot (Track 2 — User-Facing AI Agents)

A Telegram bot powered by **DeepSeek LLM** that understands natural language queries and responds with real ONTON data.

### Bot: [@OntonAgentBot](https://t.me/OntonAgentBot)

**Example conversations:**
- *"What's the reputation for wallet EQDyjLJr...?"* → Returns trust score, rank, and activity breakdown
- *"Show me upcoming offline events"* → Fetches real events with dates and locations
- *"Show the leaderboard"* → Displays top-ranked community members

### Architecture

```
User Message → DeepSeek Intent Classifier → Route to Handler → SDK API Call → Formatted Response
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Access to the ONTON PostgreSQL database (via SSH tunnel or local Docker)

### Setup

```bash
# Clone & install
git clone https://github.com/bemehrbani/TON-AI-Hackathon-2026.git
cd TON-AI-Hackathon-2026
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database URL, DeepSeek API key, and Bot Token

# Start the API (port 3100)
npm run dev:api

# Start the Bot (separate terminal)
npm run dev:bot
```

### Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `DEEPSEEK_API_KEY` | DeepSeek API key for LLM |
| `BOT_TOKEN` | Telegram Bot API token |
| `API_PORT` | API server port (default: 3100) |
| `API_BASE_URL` | API base URL for SDK/Bot to connect |

---

## 📁 Project Structure

```
TON-AI-Hackathon-2026/
├── packages/
│   ├── api/             # REST API (Hono + Drizzle ORM)
│   ├── sdk/             # TypeScript SDK (@onton/agent-sdk)
│   └── concierge/       # AI Telegram Bot (grammY + DeepSeek)
├── demo-recorder/       # Playwright-based demo recording
└── docs/                # API reference & quickstart
```

## 🛠️ Tech Stack

- **API Server**: [Hono](https://hono.dev) — lightweight, edge-first
- **ORM**: [Drizzle](https://orm.drizzle.team) — type-safe SQL
- **Bot Framework**: [grammY](https://grammy.dev) — Telegram bot framework
- **LLM**: [DeepSeek](https://deepseek.com) — intent classification
- **Database**: PostgreSQL (931K+ users, 2.4K+ events)

## 📊 Live Data

This project connects to ONTON's **production database** containing:
- **931,303** registered users
- **495,195** connected wallets
- **2,415** events
- Real reputation scores up to **233,786 points**

---

## License

MIT — Built with ❤️ for the TON AI Agent Hackathon 2026
