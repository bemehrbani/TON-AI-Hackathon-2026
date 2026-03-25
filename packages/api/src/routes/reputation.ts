import { Hono } from "hono";
import { db, sql } from "../db/connection.js";
import {
  users,
  usersScore,
  userScoreSnapshots,
} from "../db/schema.js";
import { eq, desc, and, sql as dsql } from "drizzle-orm";

export const reputationRouter = new Hono();

/**
 * GET /v1/reputation/:wallet
 * Returns the trust score and activity breakdown for a given TON wallet address.
 * Privacy: Only exposes wallet address and scores — no Telegram IDs, names, or PII.
 */
reputationRouter.get("/:wallet", async (c) => {
  const wallet = c.req.param("wallet");

  try {
    // Find user by wallet address
    const userRows = await db
      .select({
        user_id: users.user_id,
        wallet_address: users.wallet_address,
        user_point: users.user_point,
        participated_event_count: users.participated_event_count,
        hosted_event_count: users.hosted_event_count,
        is_premium: users.is_premium,
        created_at: users.created_at,
        role: users.role,
      })
      .from(users)
      .where(eq(users.wallet_address, wallet))
      .limit(1);

    if (userRows.length === 0) {
      return c.json({ error: "Wallet not found in ONTON ecosystem" }, 404);
    }

    const user = userRows[0];

    // Get activity breakdown from score table
    const activityBreakdown = await db
      .select({
        activityType: usersScore.activityType,
        totalPoints: dsql<string>`COALESCE(SUM(${usersScore.point}), 0)`,
        count: dsql<number>`COUNT(*)::int`,
      })
      .from(usersScore)
      .where(eq(usersScore.userId, user.user_id))
      .groupBy(usersScore.activityType);

    // Get latest snapshot for rank context
    const snapshotRows = await db
      .select({
        totalScore: userScoreSnapshots.totalScore,
        freeOnlineEvent: userScoreSnapshots.freeOnlineEvent,
        freeOfflineEvent: userScoreSnapshots.freeOfflineEvent,
        paidOnlineEvent: userScoreSnapshots.paidOnlineEvent,
        paidOfflineEvent: userScoreSnapshots.paidOfflineEvent,
        claimStatus: userScoreSnapshots.claimStatus,
        snapshotRuntime: userScoreSnapshots.snapshotRuntime,
      })
      .from(userScoreSnapshots)
      .where(eq(userScoreSnapshots.userId, user.user_id))
      .orderBy(desc(userScoreSnapshots.snapshotRuntime))
      .limit(1);

    // Calculate rank (how many users have higher total score)
    const rankResult = await db
      .select({
        rank: dsql<number>`COUNT(*)::int + 1`,
      })
      .from(users)
      .where(dsql`${users.user_point} > ${user.user_point}`);

    const totalUsersResult = await db
      .select({
        total: dsql<number>`COUNT(*)::int`,
      })
      .from(users);

    const activities: Record<string, { points: number; count: number }> = {};
    for (const row of activityBreakdown) {
      if (row.activityType) {
        activities[row.activityType] = {
          points: Number(row.totalPoints),
          count: row.count,
        };
      }
    }

    const snapshot = snapshotRows[0] ?? null;

    return c.json({
      wallet: user.wallet_address,
      totalScore: snapshot ? Number(snapshot.totalScore) : user.user_point,
      rank: rankResult[0]?.rank ?? 0,
      totalUsers: totalUsersResult[0]?.total ?? 0,
      role: user.role,
      isPremium: user.is_premium ?? false,
      eventsParticipated: user.participated_event_count ?? 0,
      eventsHosted: user.hosted_event_count ?? 0,
      memberSince: user.created_at,
      activities,
      latestSnapshot: snapshot
        ? {
            totalScore: Number(snapshot.totalScore),
            freeOnlineEvent: Number(snapshot.freeOnlineEvent ?? 0),
            freeOfflineEvent: Number(snapshot.freeOfflineEvent ?? 0),
            paidOnlineEvent: Number(snapshot.paidOnlineEvent ?? 0),
            paidOfflineEvent: Number(snapshot.paidOfflineEvent ?? 0),
            claimStatus: snapshot.claimStatus,
            snapshotDate: snapshot.snapshotRuntime,
          }
        : null,
    });
  } catch (error) {
    console.error("Error fetching reputation:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

/**
 * GET /v1/reputation/:wallet/history
 * Returns the score history (individual score events) for a wallet.
 */
reputationRouter.get("/:wallet/history", async (c) => {
  const wallet = c.req.param("wallet");
  const limit = Math.min(Number(c.req.query("limit") ?? 50), 100);
  const offset = Number(c.req.query("offset") ?? 0);

  try {
    const userRows = await db
      .select({ user_id: users.user_id })
      .from(users)
      .where(eq(users.wallet_address, wallet))
      .limit(1);

    if (userRows.length === 0) {
      return c.json({ error: "Wallet not found" }, 404);
    }

    const userId = userRows[0].user_id;

    const history = await db
      .select({
        activityType: usersScore.activityType,
        point: usersScore.point,
        itemType: usersScore.itemType,
        itemId: usersScore.itemId,
        createdAt: usersScore.createdAt,
      })
      .from(usersScore)
      .where(eq(usersScore.userId, userId))
      .orderBy(desc(usersScore.createdAt))
      .limit(limit)
      .offset(offset);

    return c.json({
      wallet,
      history: history.map((h) => ({
        activityType: h.activityType,
        points: Number(h.point ?? 0),
        itemType: h.itemType,
        itemId: h.itemId,
        date: h.createdAt,
      })),
      pagination: {
        limit,
        offset,
        hasMore: history.length === limit,
      },
    });
  } catch (error) {
    console.error("Error fetching history:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});
