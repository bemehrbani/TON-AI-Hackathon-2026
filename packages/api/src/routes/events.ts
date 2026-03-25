import { Hono } from "hono";
import { db } from "../db/connection.js";
import { events, eventRegistrants, users } from "../db/schema.js";
import { eq, desc, and, gte, lte, sql, or } from "drizzle-orm";

export const eventsRouter = new Hono();

/**
 * GET /v1/events
 * List public events with optional filters.
 * Query params: type (online|in_person), from (unix), to (unix), limit, offset, hub
 */
eventsRouter.get("/", async (c) => {
  const limit = Math.min(Number(c.req.query("limit") ?? 20), 50);
  const offset = Number(c.req.query("offset") ?? 0);
  const type = c.req.query("type"); // online | in_person
  const from = c.req.query("from"); // unix timestamp
  const to = c.req.query("to"); // unix timestamp
  const hub = c.req.query("hub"); // society hub name

  try {
    const conditions = [
      eq(events.enabled, true),
      eq(events.hidden, false),
    ];

    if (type === "online" || type === "in_person") {
      conditions.push(eq(events.participationType, type));
    }

    if (from) {
      conditions.push(gte(events.start_date, Number(from)));
    }

    if (to) {
      conditions.push(lte(events.end_date, Number(to)));
    }

    if (hub) {
      conditions.push(eq(events.society_hub, hub));
    }

    const eventRows = await db
      .select({
        event_uuid: events.event_uuid,
        title: events.title,
        subtitle: events.subtitle,
        description: events.description,
        image_url: events.image_url,
        start_date: events.start_date,
        end_date: events.end_date,
        timezone: events.timezone,
        location: events.location,
        participationType: events.participationType,
        has_payment: events.has_payment,
        capacity: events.capacity,
        society_hub: events.society_hub,
        sbt_collection_address: events.sbt_collection_address,
        owner: events.owner,
        created_at: events.created_at,
      })
      .from(events)
      .where(and(...conditions))
      .orderBy(desc(events.start_date))
      .limit(limit)
      .offset(offset);

    // Enrich with organizer info (anonymized)
    const enriched = await Promise.all(
      eventRows.map(async (event) => {
        const organizer = await db
          .select({
            wallet_address: users.wallet_address,
            hosted_event_count: users.hosted_event_count,
            user_point: users.user_point,
            org_channel_name: users.org_channel_name,
          })
          .from(users)
          .where(eq(users.user_id, event.owner))
          .limit(1);

        const registrantCount = await db
          .select({ count: sql<number>`COUNT(*)::int` })
          .from(eventRegistrants)
          .where(eq(eventRegistrants.event_uuid, event.event_uuid));

        const checkedInCount = await db
          .select({ count: sql<number>`COUNT(*)::int` })
          .from(eventRegistrants)
          .where(
            and(
              eq(eventRegistrants.event_uuid, event.event_uuid),
              eq(eventRegistrants.status, "checkedin")
            )
          );

        return {
          uuid: event.event_uuid,
          title: event.title,
          subtitle: event.subtitle,
          description: event.description,
          imageUrl: event.image_url,
          startDate: event.start_date,
          endDate: event.end_date,
          timezone: event.timezone,
          location: event.location,
          type: event.participationType,
          isPaid: event.has_payment,
          capacity: event.capacity,
          hub: event.society_hub,
          hasSBT: !!event.sbt_collection_address,
          registrants: registrantCount[0]?.count ?? 0,
          checkedIn: checkedInCount[0]?.count ?? 0,
          organizer: organizer[0]
            ? {
                wallet: organizer[0].wallet_address,
                eventsHosted: organizer[0].hosted_event_count ?? 0,
                reputationScore: organizer[0].user_point ?? 0,
                name: organizer[0].org_channel_name,
              }
            : null,
          createdAt: event.created_at,
        };
      })
    );

    return c.json({
      events: enriched,
      pagination: { limit, offset, hasMore: eventRows.length === limit },
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

/**
 * GET /v1/events/:uuid/stats
 * Returns detailed statistics for a specific event.
 */
eventsRouter.get("/:uuid/stats", async (c) => {
  const uuid = c.req.param("uuid");

  try {
    const eventRows = await db
      .select()
      .from(events)
      .where(eq(events.event_uuid, uuid))
      .limit(1);

    if (eventRows.length === 0) {
      return c.json({ error: "Event not found" }, 404);
    }

    const event = eventRows[0];

    // Get registration stats by status
    const statusCounts = await db
      .select({
        status: eventRegistrants.status,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(eventRegistrants)
      .where(eq(eventRegistrants.event_uuid, uuid))
      .groupBy(eventRegistrants.status);

    const stats: Record<string, number> = {};
    let totalRegistrants = 0;
    for (const row of statusCounts) {
      stats[row.status] = row.count;
      totalRegistrants += row.count;
    }

    const checkInRate =
      totalRegistrants > 0
        ? ((stats["checkedin"] ?? 0) / totalRegistrants) * 100
        : 0;

    return c.json({
      uuid: event.event_uuid,
      title: event.title,
      type: event.participationType,
      isPaid: event.has_payment,
      capacity: event.capacity,
      hasSBT: !!event.sbt_collection_address,
      startDate: event.start_date,
      endDate: event.end_date,
      stats: {
        totalRegistrants,
        pending: stats["pending"] ?? 0,
        approved: stats["approved"] ?? 0,
        checkedIn: stats["checkedin"] ?? 0,
        rejected: stats["rejected"] ?? 0,
        checkInRate: Math.round(checkInRate * 100) / 100,
        capacityUtilization:
          event.capacity && event.capacity > 0
            ? Math.round((totalRegistrants / event.capacity) * 10000) / 100
            : null,
      },
    });
  } catch (error) {
    console.error("Error fetching event stats:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});
