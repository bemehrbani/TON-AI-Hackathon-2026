import type { Context } from "grammy";
import { apiClient } from "../agent/api.js";
import { classifyAndRespond, quickIntentDetect } from "../agent/llm.js";

/**
 * Format a unix timestamp to a readable date string.
 */
function formatDate(unix: number): string {
  return new Date(unix * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Truncate text to a maximum length.
 */
function truncate(text: string, maxLen: number): string {
  return text.length > maxLen ? text.slice(0, maxLen - 3) + "..." : text;
}

// ─── /start ──────────────────────────────────────────────────────

export async function handleStart(ctx: Context) {
  const name = ctx.from?.first_name ?? "there";
  await ctx.reply(
    `👋 Hi ${name}! I'm the **ONTON AI Concierge**.

I can help you with:

🏆 **Reputation** — Check any wallet's trust score
📅 **Events** — Discover upcoming TON events
✅ **Verify** — Check SBT holdings & attendance
📊 **Leaderboard** — See top contributors
🔍 **Organizer Check** — Verify event hosts

Just ask in natural language! For example:
• _"What's the reputation for EQB..."_
• _"Show me upcoming offline events"_
• _"Show the leaderboard"_

Or use commands:
/reputation \`<wallet>\` — Check reputation
/events — Browse events
/leaderboard — Top users
/help — Show this guide`,
    { parse_mode: "Markdown" }
  );
}

// ─── /help ───────────────────────────────────────────────────────

export async function handleHelp(ctx: Context) {
  await ctx.reply(
    `🤖 **ONTON AI Concierge Commands**

/reputation \`<wallet>\` — Get trust score & activity breakdown
/events — List recent events
/events_offline — In-person events only  
/leaderboard — Top 10 users by score
/sbt \`<wallet>\` — Verify SBT holdings
/stats — Ecosystem overview
/help — This message

💡 You can also just chat with me naturally!`,
    { parse_mode: "Markdown" }
  );
}

// ─── /reputation ─────────────────────────────────────────────────

export async function handleReputation(ctx: Context) {
  const text = ctx.message?.text ?? "";
  const parts = text.split(/\s+/);
  const wallet = parts[1];

  if (!wallet) {
    await ctx.reply("Please provide a wallet address.\n\nUsage: `/reputation EQB...`", { parse_mode: "Markdown" });
    return;
  }

  await ctx.reply("🔍 Looking up reputation...");

  const rep = await apiClient.getReputation(wallet);

  if (!rep) {
    await ctx.reply("❌ Wallet not found in the ONTON ecosystem. Make sure you're using a valid TON wallet address.");
    return;
  }

  const r = rep as Record<string, unknown>;
  const activities = r.activities as Record<string, { points: number; count: number }> | undefined;

  let activityText = "";
  if (activities && Object.keys(activities).length > 0) {
    const topActivities = Object.entries(activities)
      .sort(([, a], [, b]) => b.points - a.points)
      .slice(0, 5);

    activityText = topActivities
      .map(([type, data]) => `  • ${type.replace(/_/g, " ")}: ${data.points} pts (${data.count}x)`)
      .join("\n");
  }

  await ctx.reply(
    `🏆 **Reputation for** \`${truncate(wallet, 20)}\`

📊 **Total Score**: ${r.totalScore ?? 0} pts
📈 **Rank**: #${r.rank ?? "?"} of ${r.totalUsers ?? "?"} users
👤 **Role**: ${r.role ?? "user"}
⭐ **Premium**: ${r.isPremium ? "Yes" : "No"}
🎫 **Events Attended**: ${r.eventsParticipated ?? 0}
🎙 **Events Hosted**: ${r.eventsHosted ?? 0}
📅 **Member Since**: ${r.memberSince ? new Date(r.memberSince as string).toLocaleDateString() : "Unknown"}

${activityText ? `📋 **Top Activities**:\n${activityText}` : ""}`,
    { parse_mode: "Markdown" }
  );
}

// ─── /events ─────────────────────────────────────────────────────

export async function handleEvents(ctx: Context, typeFilter?: string) {
  await ctx.reply("📅 Fetching events...");

  const data = await apiClient.getEvents({ type: typeFilter, limit: 5 });

  if (!data) {
    await ctx.reply("❌ Failed to fetch events. Please try again.");
    return;
  }

  const eventsList = (data as { events?: Array<Record<string, unknown>> }).events;

  if (!eventsList || eventsList.length === 0) {
    await ctx.reply("No events found matching your criteria.");
    return;
  }

  const lines = eventsList.map((e, i) => {
    const title = e.title as string;
    const type = e.type === "in_person" ? "📍 Offline" : "🌐 Online";
    const isPaid = e.isPaid ? "💰 Paid" : "🆓 Free";
    const startDate = e.startDate ? formatDate(e.startDate as number) : "TBD";
    const registrants = e.registrants ?? 0;
    const hub = e.hub ? ` | 🏛 ${e.hub}` : "";
    const location = e.location ? ` | 📌 ${truncate(e.location as string, 30)}` : "";

    return `${i + 1}. **${truncate(title, 40)}**\n   ${type} | ${isPaid} | 📆 ${startDate} | 👥 ${registrants}${hub}${location}`;
  });

  await ctx.reply(`📅 **${typeFilter === "in_person" ? "Offline" : "Recent"} Events**\n\n${lines.join("\n\n")}`, {
    parse_mode: "Markdown",
  });
}

// ─── /leaderboard ────────────────────────────────────────────────

export async function handleLeaderboard(ctx: Context) {
  await ctx.reply("📊 Fetching leaderboard...");

  const data = await apiClient.getLeaderboard(10);

  if (!data) {
    await ctx.reply("❌ Failed to fetch leaderboard.");
    return;
  }

  const board = data as {
    leaderboard?: Array<Record<string, unknown>>;
    ecosystem?: Record<string, unknown>;
  };

  if (!board.leaderboard || board.leaderboard.length === 0) {
    await ctx.reply("No leaderboard data available.");
    return;
  }

  const medals = ["🥇", "🥈", "🥉"];
  const lines = board.leaderboard.map((entry, i) => {
    const medal = medals[i] ?? `${i + 1}.`;
    const wallet = entry.wallet ? truncate(entry.wallet as string, 12) : "—";
    const score = entry.totalScore ?? 0;
    const events = entry.eventsParticipated ?? 0;

    return `${medal} \`${wallet}\` — **${score}** pts (${events} events)`;
  });

  const eco = board.ecosystem;
  const ecoText = eco
    ? `\n📈 **Ecosystem**: ${eco.totalUsers} users | ${eco.usersWithWallet} connected wallets | ${eco.totalPointsDistributed} total pts`
    : "";

  await ctx.reply(`🏆 **ONTON Leaderboard**\n\n${lines.join("\n")}${ecoText}`, {
    parse_mode: "Markdown",
  });
}

// ─── /sbt ────────────────────────────────────────────────────────

export async function handleSBT(ctx: Context) {
  const text = ctx.message?.text ?? "";
  const parts = text.split(/\s+/);
  const wallet = parts[1];

  if (!wallet) {
    await ctx.reply("Please provide a wallet address.\n\nUsage: `/sbt EQB...`", { parse_mode: "Markdown" });
    return;
  }

  await ctx.reply("🔍 Checking SBT holdings...");

  const data = await apiClient.verifySBT(wallet);

  if (!data) {
    await ctx.reply("❌ Wallet not found or no SBTs found.");
    return;
  }

  const sbt = data as {
    totalSBTs?: number;
    offlineSBTs?: number;
    onlineSBTs?: number;
    paidSBTs?: number;
    holdings?: Array<Record<string, unknown>>;
  };

  const recentHoldings = (sbt.holdings ?? []).slice(0, 5).map((h, i) => {
    const title = h.eventTitle as string;
    const type = h.eventType === "in_person" ? "📍" : "🌐";
    return `  ${i + 1}. ${type} ${truncate(title, 35)}`;
  });

  await ctx.reply(
    `🎖 **SBT Holdings for** \`${truncate(wallet, 20)}\`

📊 **Total SBTs**: ${sbt.totalSBTs ?? 0}
📍 **Offline**: ${sbt.offlineSBTs ?? 0} | 🌐 **Online**: ${sbt.onlineSBTs ?? 0}
💰 **Paid Events**: ${sbt.paidSBTs ?? 0}

${recentHoldings.length > 0 ? `📋 **Recent**:\n${recentHoldings.join("\n")}` : "No SBTs found."}`,
    { parse_mode: "Markdown" }
  );
}

// ─── /stats ──────────────────────────────────────────────────────

export async function handleStats(ctx: Context) {
  await ctx.reply("📊 Fetching ecosystem stats...");

  const data = await apiClient.getLeaderboard(1);

  if (!data) {
    await ctx.reply("❌ Failed to fetch ecosystem stats.");
    return;
  }

  const eco = (data as { ecosystem?: Record<string, unknown> }).ecosystem;

  if (!eco) {
    await ctx.reply("No ecosystem data available.");
    return;
  }

  await ctx.reply(
    `🌐 **ONTON Ecosystem Overview**

👥 **Total Users**: ${eco.totalUsers}
💳 **Connected Wallets**: ${eco.usersWithWallet}
🏆 **Total Points Distributed**: ${eco.totalPointsDistributed}
📊 **Average Score**: ${eco.averageScore}`,
    { parse_mode: "Markdown" }
  );
}

// ─── Natural language handler ────────────────────────────────────

export async function handleMessage(ctx: Context) {
  const text = ctx.message?.text;
  if (!text) return;

  // Quick intent detection first (no LLM call needed)
  const quickIntent = quickIntentDetect(text);

  if (quickIntent === "help") {
    return handleHelp(ctx);
  }

  if (quickIntent === "leaderboard") {
    return handleLeaderboard(ctx);
  }

  if (quickIntent === "ecosystem") {
    return handleStats(ctx);
  }

  // For intents that might contain a wallet address, extract it
  const walletMatch = text.match(/\b(EQ[A-Za-z0-9_-]{46,48})\b/);

  if (quickIntent === "reputation" && walletMatch) {
    ctx.message!.text = `/reputation ${walletMatch[1]}`;
    return handleReputation(ctx);
  }

  if (quickIntent === "verify_sbt" && walletMatch) {
    ctx.message!.text = `/sbt ${walletMatch[1]}`;
    return handleSBT(ctx);
  }

  if (quickIntent === "events") {
    const isOffline = text.toLowerCase().includes("offline") || text.toLowerCase().includes("in-person") || text.toLowerCase().includes("in person");
    return handleEvents(ctx, isOffline ? "in_person" : undefined);
  }

  // Fallback: Use LLM for natural language understanding
  let apiContext: string | undefined;

  // If the message mentions a wallet, fetch its data as context
  if (walletMatch) {
    const repData = await apiClient.getReputation(walletMatch[1]);
    if (repData) {
      apiContext = `User reputation data:\n${JSON.stringify(repData, null, 2)}`;
    }
  }

  const result = await classifyAndRespond(text, apiContext);
  await ctx.reply(result.response, { parse_mode: "Markdown" });
}
