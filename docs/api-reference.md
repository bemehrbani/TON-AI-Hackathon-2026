# ONTON Reputation API — Reference

> Base URL: `http://localhost:3100` (local) or your deployed instance

## Authentication

No authentication required for read endpoints (hackathon demo). Production would use API key headers.

---

## Endpoints

### `GET /v1/reputation/:wallet`

Retrieve the full reputation profile for a TON wallet address.

**Parameters:**

| Name | In | Type | Description |
|---|---|---|---|
| `wallet` | path | string | TON wallet address (e.g. `EQDyjLJr...`) |

**Response (200):**

```json
{
  "wallet": "EQDyjLJrFbIbHEPhZtYV23Xwwqg7JH2B8VHQiIp3F0bzCvF7",
  "totalScore": 233786.76,
  "rank": 1,
  "totalUsers": 931303,
  "role": "user",
  "eventsParticipated": 8,
  "eventsHosted": 0,
  "isPremium": true,
  "memberSince": "2024-11-25T15:04:16.717Z",
  "latestSnapshot": {
    "totalScore": 233786.76,
    "freeOnlineEvent": 4108.76,
    "freeOfflineEvent": 229678,
    "paidOnlineEvent": 0,
    "paidOfflineEvent": 0,
    "claimStatus": "not_claimed",
    "snapshotDate": "2025-11-07T22:00:00.004Z"
  },
  "activities": {
    "free_offline_event": 204748,
    "free_online_event": 29038.76
  }
}
```

---

### `GET /v1/reputation/:wallet/history`

Score timeline grouped by activity type.

**Parameters:**

| Name | In | Type | Description |
|---|---|---|---|
| `wallet` | path | string | TON wallet address |
| `limit` | query | number | Max records (default: 50) |

---

### `GET /v1/events`

List events with filtering.

**Query Parameters:**

| Name | Type | Default | Description |
|---|---|---|---|
| `limit` | number | 20 | Max results (max 100) |
| `type` | string | — | Filter: `online` or `in_person` |
| `upcoming` | boolean | — | Only future events |

**Response (200):**

```json
{
  "events": [
    {
      "uuid": "a1b2c3d4-...",
      "title": "The Future of Finance in Argentina",
      "subtitle": "...",
      "type": "in_person",
      "location": "Av. Caseros 3039, Buenos Aires",
      "startDate": "2025-11-20T10:00:00Z",
      "endDate": "2025-11-22T18:00:00Z",
      "capacity": 200,
      "registrantCount": 45
    }
  ],
  "total": 2415,
  "limit": 20
}
```

---

### `GET /v1/events/:uuid/stats`

Attendance statistics for a specific event.

---

### `GET /v1/leaderboard`

Top users ranked by total reputation score.

**Query Parameters:**

| Name | Type | Default | Description |
|---|---|---|---|
| `limit` | number | 20 | Max results (max 100) |

**Response (200):**

```json
{
  "leaderboard": [
    {
      "rank": 1,
      "wallet": "EQDyjLJr...",
      "totalScore": 233786.76,
      "eventsParticipated": 8,
      "eventsHosted": 0,
      "isPremium": true,
      "role": "user",
      "memberSince": "2024-11-25T15:04:16.717Z"
    }
  ],
  "ecosystem": {
    "totalUsers": 931303,
    "usersWithWallet": 495195
  }
}
```

---

### `GET /v1/verify/sbt/:wallet`

Verify SBT (Soulbound Token) holdings for a wallet.

---

### `POST /v1/agents/query`

Natural language query endpoint for AI agents.

**Request Body:**

```json
{
  "query": "Is the organizer of this event trustworthy?",
  "context": {
    "wallet": "EQDyjLJr..."
  }
}
```

---

### `GET /health`

Health check endpoint.

**Response (200):**

```json
{
  "status": "healthy",
  "timestamp": "2026-03-25T22:00:00Z",
  "version": "0.1.0"
}
```

---

## SDK Quick Start

```bash
npm install @onton/agent-sdk
```

```typescript
import { OntonSDK } from '@onton/agent-sdk';

const onton = new OntonSDK({ baseUrl: 'http://localhost:3100' });

// Reputation lookup
const rep = await onton.reputation.get('EQDyjLJr...');
console.log(rep.totalScore); // 233786.76
console.log(rep.rank);       // 1

// Event listing
const events = await onton.events.list({ type: 'offline', limit: 5 });

// LangChain agent tools
const tools = onton.getAgentTools();
// Pass `tools` directly to any LangChain agent
```

---

## LangChain Integration

```typescript
import { getOntonTools } from '@onton/agent-sdk/tools';

const tools = getOntonTools({ baseUrl: 'http://localhost:3100' });

// Available tools:
// - onton_reputation_lookup: Look up wallet reputation score and rank
// - onton_event_search: Search ONTON events by type and location
// - onton_leaderboard: Get top-ranked community members
// - onton_sbt_verify: Verify SBT holdings for a wallet
```

---

## Data Model

The API reads from ONTON's production PostgreSQL database:

| Table | Records | Description |
|---|---|---|
| `users` | 930K+ | Registered users with wallet addresses |
| `users_score` | 12M+ | Individual score/activity records (SBT attestations) |
| `user_score_snapshot` | — | Aggregated reputation snapshots |
| `events` | 3,000+ | Online and in-person events |
| `event_registrants` | — | Event attendance and check-in records |
| `nft_items` | 5,000+ | NFT tickets and SBT collections |

---

## Rate Limits

No rate limits in demo mode. Production deployment would include:
- API key authentication
- 100 requests/minute per key
- Webhook support for score change notifications
