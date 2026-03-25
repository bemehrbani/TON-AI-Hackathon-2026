import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { reputationRouter } from "./routes/reputation.js";
import { eventsRouter } from "./routes/events.js";
import { leaderboardRouter } from "./routes/leaderboard.js";
import { verifyRouter } from "./routes/verify.js";
import { agentsRouter } from "./routes/agents.js";

const app = new Hono();

// Middleware
app.use("*", cors());
app.use("*", logger());

// Health check
app.get("/", (c) =>
  c.json({
    name: "ONTON Reputation API",
    version: "0.1.0",
    description:
      "Public API exposing ONTON ecosystem reputation data for AI agents",
    docs: "/docs",
    endpoints: [
      "GET /v1/reputation/:wallet",
      "GET /v1/reputation/:wallet/history",
      "GET /v1/events",
      "GET /v1/events/:uuid/stats",
      "GET /v1/leaderboard",
      "GET /v1/verify/sbt/:wallet",
      "POST /v1/agents/query",
    ],
  })
);

// API Routes
app.route("/v1/reputation", reputationRouter);
app.route("/v1/events", eventsRouter);
app.route("/v1/leaderboard", leaderboardRouter);
app.route("/v1/verify", verifyRouter);
app.route("/v1/agents", agentsRouter);

// Start server
const port = Number(process.env.API_PORT) || 3100;
console.log(`🚀 ONTON Reputation API running on port ${port}`);
serve({ fetch: app.fetch, port });

export default app;
