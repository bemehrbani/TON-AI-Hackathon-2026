import { Hono } from "hono";
import { db } from "../db/connection.js";
import { users, usersScore, events, eventRegistrants } from "../db/schema.js";
import { eq, and, sql, desc } from "drizzle-orm";

export const verifyRouter = new Hono();

/**
 * GET /v1/verify/sbt/:wallet
 * Verify SBT (Soulbound Token) holdings for a given wallet.
 * Returns events where the user earned SBTs through attendance.
 */
verifyRouter.get("/sbt/:wallet", async (c) => {
  const wallet = c.req.param("wallet");

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

    // Get events where user checked in (earned SBT)
    const sbtEvents = await db
      .select({
        event_uuid: eventRegistrants.event_uuid,
        status: eventRegistrants.status,
        registered_at: eventRegistrants.created_at,
      })
      .from(eventRegistrants)
      .where(
        and(
          eq(eventRegistrants.user_id, userId),
          eq(eventRegistrants.status, "checkedin")
        )
      )
      .orderBy(desc(eventRegistrants.created_at));

    // Enrich with event details
    const sbtHoldings = await Promise.all(
      sbtEvents.map(async (reg) => {
        const eventRows = await db
          .select({
            title: events.title,
            participationType: events.participationType,
            has_payment: events.has_payment,
            start_date: events.start_date,
            sbt_collection_address: events.sbt_collection_address,
            society_hub: events.society_hub,
          })
          .from(events)
          .where(eq(events.event_uuid, reg.event_uuid))
          .limit(1);

        const event = eventRows[0];
        return {
          eventUuid: reg.event_uuid,
          eventTitle: event?.title ?? "Unknown",
          eventType: event?.participationType ?? "unknown",
          isPaid: event?.has_payment ?? false,
          eventDate: event?.start_date,
          sbtCollectionAddress: event?.sbt_collection_address,
          hub: event?.society_hub,
          checkedInAt: reg.registered_at,
          verified: true,
        };
      })
    );

    return c.json({
      wallet,
      totalSBTs: sbtHoldings.length,
      offlineSBTs: sbtHoldings.filter((s) => s.eventType === "in_person").length,
      onlineSBTs: sbtHoldings.filter((s) => s.eventType === "online").length,
      paidSBTs: sbtHoldings.filter((s) => s.isPaid).length,
      holdings: sbtHoldings,
    });
  } catch (error) {
    console.error("Error verifying SBTs:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

/**
 * GET /v1/verify/attendance/:wallet/:event_uuid
 * Verify if a specific wallet attended a specific event.
 */
verifyRouter.get("/attendance/:wallet/:event_uuid", async (c) => {
  const wallet = c.req.param("wallet");
  const eventUuid = c.req.param("event_uuid");

  try {
    const userRows = await db
      .select({ user_id: users.user_id })
      .from(users)
      .where(eq(users.wallet_address, wallet))
      .limit(1);

    if (userRows.length === 0) {
      return c.json({ verified: false, reason: "Wallet not found" });
    }

    const registrant = await db
      .select({
        status: eventRegistrants.status,
        created_at: eventRegistrants.created_at,
      })
      .from(eventRegistrants)
      .where(
        and(
          eq(eventRegistrants.user_id, userRows[0].user_id),
          eq(eventRegistrants.event_uuid, eventUuid)
        )
      )
      .limit(1);

    if (registrant.length === 0) {
      return c.json({ verified: false, reason: "No registration found" });
    }

    return c.json({
      verified: registrant[0].status === "checkedin",
      status: registrant[0].status,
      registeredAt: registrant[0].created_at,
      wallet,
      eventUuid,
    });
  } catch (error) {
    console.error("Error verifying attendance:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});
