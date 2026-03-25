import { Hono } from "hono";
import { db, sql as pgSql } from "../db/connection.js";

export const agentsRouter = new Hono();

/**
 * POST /v1/agents/query
 * Natural language query endpoint for AI agents.
 * Accepts plain text questions and returns structured data.
 * 
 * This is a simplified implementation for the hackathon —
 * maps common patterns to pre-built SQL queries rather than
 * using a full text-to-SQL LLM pipeline.
 */
agentsRouter.post("/query", async (c) => {
  const body = await c.req.json<{ query: string }>();
  const query = body.query?.toLowerCase().trim();

  if (!query) {
    return c.json({ error: "Query is required" }, 400);
  }

  try {
    // Pattern matching for common agent queries
    if (query.includes("most active") || query.includes("top user")) {
      const limit = extractNumber(query) || 10;
      const result = await pgSql`
        SELECT 
          wallet_address as wallet,
          user_point as score,
          participated_event_count as events_participated,
          hosted_event_count as events_hosted,
          role
        FROM users 
        WHERE wallet_address IS NOT NULL 
        ORDER BY user_point DESC 
        LIMIT ${limit}
      `;
      return c.json({
        query: body.query,
        intent: "top_users",
        data: result,
        count: result.length,
      });
    }

    if (query.includes("event") && (query.includes("upcoming") || query.includes("next") || query.includes("future"))) {
      const now = Math.floor(Date.now() / 1000);
      const limit = extractNumber(query) || 10;
      const result = await pgSql`
        SELECT 
          e.event_uuid as uuid,
          e.title,
          e.participation_type as type,
          e.has_payment as is_paid,
          e.start_date,
          e.end_date,
          e.location,
          e.society_hub as hub,
          u.wallet_address as organizer_wallet,
          u.user_point as organizer_score
        FROM events e
        LEFT JOIN users u ON e.owner = u.user_id
        WHERE e.enabled = true AND e.hidden = false AND e.start_date > ${now}
        ORDER BY e.start_date ASC
        LIMIT ${limit}
      `;
      return c.json({
        query: body.query,
        intent: "upcoming_events",
        data: result,
        count: result.length,
      });
    }

    if (query.includes("event") && (query.includes("past") || query.includes("recent") || query.includes("last"))) {
      const now = Math.floor(Date.now() / 1000);
      const limit = extractNumber(query) || 10;
      const result = await pgSql`
        SELECT 
          e.event_uuid as uuid,
          e.title,
          e.participation_type as type,
          e.has_payment as is_paid,
          e.start_date,
          e.end_date,
          e.society_hub as hub,
          COUNT(er.id)::int as registrant_count,
          COUNT(CASE WHEN er.status = 'checkedin' THEN 1 END)::int as checked_in_count
        FROM events e
        LEFT JOIN event_registrants er ON e.event_uuid = er.event_uuid
        WHERE e.enabled = true AND e.hidden = false AND e.end_date < ${now}
        GROUP BY e.event_id
        ORDER BY e.end_date DESC
        LIMIT ${limit}
      `;
      return c.json({
        query: body.query,
        intent: "past_events",
        data: result,
        count: result.length,
      });
    }

    if (query.includes("offline") && query.includes("event")) {
      const limit = extractNumber(query) || 10;
      const result = await pgSql`
        SELECT 
          e.event_uuid as uuid,
          e.title,
          e.location,
          e.start_date,
          e.end_date,
          e.has_payment as is_paid,
          e.society_hub as hub,
          COUNT(er.id)::int as registrant_count
        FROM events e
        LEFT JOIN event_registrants er ON e.event_uuid = er.event_uuid
        WHERE e.enabled = true AND e.hidden = false AND e.participation_type = 'in_person'
        GROUP BY e.event_id
        ORDER BY e.start_date DESC
        LIMIT ${limit}
      `;
      return c.json({
        query: body.query,
        intent: "offline_events",
        data: result,
        count: result.length,
      });
    }

    if (query.includes("ecosystem") || query.includes("stats") || query.includes("overview")) {
      const result = await pgSql`
        SELECT 
          COUNT(DISTINCT u.user_id)::int as total_users,
          COUNT(DISTINCT CASE WHEN u.wallet_address IS NOT NULL THEN u.user_id END)::int as users_with_wallet,
          COALESCE(SUM(u.user_point), 0)::int as total_points,
          COUNT(DISTINCT e.event_id)::int as total_events,
          COUNT(DISTINCT CASE WHEN e.participation_type = 'in_person' THEN e.event_id END)::int as offline_events,
          COUNT(DISTINCT CASE WHEN e.has_payment = true THEN e.event_id END)::int as paid_events
        FROM users u
        CROSS JOIN (SELECT event_id, participation_type, has_payment FROM events WHERE enabled = true AND hidden = false) e
      `;
      return c.json({
        query: body.query,
        intent: "ecosystem_stats",
        data: result[0],
      });
    }

    // Fallback: unknown query pattern
    return c.json({
      query: body.query,
      intent: "unknown",
      message:
        "Query pattern not recognized. Try: 'top 10 most active users', 'upcoming events', 'offline events', 'ecosystem stats'",
      supportedQueries: [
        "most active users",
        "top N users",
        "upcoming events",
        "past events",
        "offline events",
        "ecosystem stats / overview",
      ],
    });
  } catch (error) {
    console.error("Error processing agent query:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

/** Extract the first number from a string, or return null */
function extractNumber(text: string): number | null {
  const match = text.match(/\d+/);
  return match ? Math.min(Number(match[0]), 100) : null;
}
