import { Hono } from "hono";
import { db } from "../db/connection.js";
import { users, userScoreSnapshots } from "../db/schema.js";
import { desc, sql, isNotNull } from "drizzle-orm";

export const leaderboardRouter = new Hono();

/**
 * GET /v1/leaderboard
 * Returns the top users by total reputation score.
 * Privacy: Only exposes wallet addresses — no Telegram IDs or names.
 * Query params: limit (default 20, max 100)
 */
leaderboardRouter.get("/", async (c) => {
  const limit = Math.min(Number(c.req.query("limit") ?? 20), 100);

  try {
    // Use user_score_snapshot for real scores (user_point in users table is often 0)
    const topUsers = await db
      .select({
        wallet_address: users.wallet_address,
        totalScore: userScoreSnapshots.totalScore,
        participated_event_count: users.participated_event_count,
        hosted_event_count: users.hosted_event_count,
        is_premium: users.is_premium,
        role: users.role,
        created_at: users.created_at,
      })
      .from(userScoreSnapshots)
      .innerJoin(users, sql`${userScoreSnapshots.userId} = ${users.user_id}`)
      .where(isNotNull(users.wallet_address))
      .orderBy(desc(userScoreSnapshots.totalScore))
      .limit(limit);

    const leaderboard = topUsers.map((user, index) => ({
      rank: index + 1,
      wallet: user.wallet_address,
      totalScore: Number(user.totalScore),
      eventsParticipated: user.participated_event_count ?? 0,
      eventsHosted: user.hosted_event_count ?? 0,
      isPremium: user.is_premium ?? false,
      role: user.role,
      memberSince: user.created_at,
    }));

    // Overall ecosystem stats
    const ecosystemStats = await db
      .select({
        totalUsers: sql<number>`COUNT(*)::int`,
        totalWithWallet: sql<number>`COUNT(CASE WHEN wallet_address IS NOT NULL THEN 1 END)::int`,
      })
      .from(users);

    return c.json({
      leaderboard,
      ecosystem: {
        totalUsers: ecosystemStats[0]?.totalUsers ?? 0,
        usersWithWallet: ecosystemStats[0]?.totalWithWallet ?? 0,
      },
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});
