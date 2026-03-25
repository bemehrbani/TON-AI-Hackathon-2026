import "dotenv/config";
import { Bot } from "grammy";
import { config } from "./config.js";
import {
  handleStart,
  handleHelp,
  handleReputation,
  handleEvents,
  handleLeaderboard,
  handleSBT,
  handleStats,
  handleMessage,
} from "./handlers/index.js";

const bot = new Bot(config.botToken);

// ─── Commands ────────────────────────────────────────────────────

bot.command("start", handleStart);
bot.command("help", handleHelp);
bot.command("reputation", handleReputation);
bot.command("events", (ctx) => handleEvents(ctx));
bot.command("events_offline", (ctx) => handleEvents(ctx, "in_person"));
bot.command("leaderboard", handleLeaderboard);
bot.command("sbt", handleSBT);
bot.command("stats", handleStats);

// ─── Natural language fallback ───────────────────────────────────

bot.on("message:text", handleMessage);

// ─── Error handling ──────────────────────────────────────────────

bot.catch((err) => {
  console.error("Bot error:", err);
});

// ─── Start ───────────────────────────────────────────────────────

console.log("🤖 ONTON AI Concierge is starting...");
bot.start({
  onStart: (info) => {
    console.log(`✅ Bot @${info.username} is running!`);
  },
});
