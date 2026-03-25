/**
 * Lightweight read-only Drizzle schema definitions for the ONTON Reputation API.
 * These mirror the production tables but only define the columns we need for public queries.
 * No mutations — this API is strictly read-only.
 */
import {
  pgTable,
  pgEnum,
  bigint,
  text,
  timestamp,
  boolean,
  integer,
  varchar,
  serial,
  bigserial,
  decimal,
  uuid,
  json,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// ─── Enums ───────────────────────────────────────────────────────

export const eventParticipationType = pgEnum("participation_type", [
  "online",
  "in_person",
]);

export const userScoreItemEnum = pgEnum("user_score_item_type", [
  "event",
  "task",
  "organize_event",
  "game",
]);

export const usersScoreActivityEnum = pgEnum("users_score_activity_type", [
  "free_online_event",
  "free_offline_event",
  "paid_online_event",
  "paid_offline_event",
  "join_onton",
  "join_onton_affiliate",
  "free_play2win",
  "paid_play2win",
  "x_connect",
  "github_connect",
  "linked_in_connect",
  "start_bot",
  "open_mini_app",
  "x_view_post",
  "x_retweet",
  "tg_join_channel",
  "tg_join_group",
  "tg_post_view",
  "tg_access_location",
  "google_connect",
  "outlook_connect",
  "web_visit",
]);

export const registrantStatusEnum = pgEnum("registrant_status", [
  "pending",
  "rejected",
  "approved",
  "checkedin",
]);

export const claimStatusEnum = pgEnum("claim_status", [
  "not_claimed",
  "claimed",
  "pending",
]);

export const nftItemStateEnum = pgEnum("NftItemState", [
  "created",
  "mint_request",
  "minted",
  "failed",
]);

// ─── Tables ──────────────────────────────────────────────────────

export const users = pgTable("users", {
  user_id: bigint("user_id", { mode: "number" }).primaryKey(),
  username: text("username"),
  first_name: text("first_name"),
  last_name: text("last_name"),
  wallet_address: text("wallet_address"),
  language_code: text("language_code"),
  role: text("role").notNull(),
  created_at: timestamp("created_at").defaultNow(),
  is_premium: boolean("is_premium"),
  photo_url: text("photo_url"),
  participated_event_count: integer("participated_event_count"),
  hosted_event_count: integer("hosted_event_count"),
  user_point: integer("user_point").notNull().default(0),
  org_channel_name: varchar("org_channel_name", { length: 255 }),
  org_bio: text("org_bio"),
  org_image: varchar("org_image", { length: 255 }),
});

export const usersScore = pgTable("users_score", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  userId: bigint("user_id", { mode: "number" }).notNull(),
  activityType: usersScoreActivityEnum("activity_type"),
  point: decimal("point", { precision: 20, scale: 6 }),
  active: boolean("active"),
  itemId: bigint("item_id", { mode: "number" }),
  itemType: userScoreItemEnum("item_type"),
  createdAt: timestamp("created_at", { precision: 6 }),
});

export const userScoreSnapshots = pgTable("user_score_snapshot", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number" }).notNull(),
  snapshotRuntime: timestamp("snapshot_runtime", {
    withTimezone: true,
  }).notNull(),
  freeOnlineEvent: decimal("free_online_event", {
    precision: 20,
    scale: 6,
  }).default("0"),
  freeOfflineEvent: decimal("free_offline_event", {
    precision: 20,
    scale: 6,
  }).default("0"),
  paidOnlineEvent: decimal("paid_online_event", {
    precision: 20,
    scale: 6,
  }).default("0"),
  paidOfflineEvent: decimal("paid_offline_event", {
    precision: 20,
    scale: 6,
  }).default("0"),
  joinOnton: decimal("join_onton", { precision: 20, scale: 6 }).default("0"),
  joinOntonAffiliate: decimal("join_onton_affiliate", {
    precision: 20,
    scale: 6,
  }).default("0"),
  freePlay2Win: decimal("free_play2win", {
    precision: 20,
    scale: 6,
  }).default("0"),
  paidPlay2Win: decimal("paid_play2win", {
    precision: 20,
    scale: 6,
  }).default("0"),
  claimStatus: claimStatusEnum("claim_status")
    .default("not_claimed")
    .notNull(),
  totalScore: decimal("total_score", { precision: 20, scale: 6 }).notNull(),
});

export const events = pgTable("events", {
  event_id: serial("event_id").primaryKey(),
  event_uuid: uuid("event_uuid").notNull(),
  enabled: boolean("enabled").default(true),
  hidden: boolean("hidden").default(false),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull(),
  description: text("description").notNull(),
  image_url: text("image_url").notNull(),
  society_hub: text("society_hub"),
  sbt_collection_address: text("sbt_collection_address"),
  start_date: integer("start_date").notNull(),
  end_date: integer("end_date").notNull(),
  timezone: text("timezone"),
  location: text("location"),
  owner: bigint("owner", { mode: "number" }).notNull(),
  participationType: eventParticipationType("participation_type")
    .default("online")
    .notNull(),
  has_registration: boolean("has_registration").default(false),
  has_payment: boolean("has_payment").notNull().default(false),
  capacity: integer("capacity"),
  category_id: integer("category_id"),
  created_at: timestamp("created_at").defaultNow(),
});

export const eventRegistrants = pgTable("event_registrants", {
  id: serial("id").primaryKey(),
  event_uuid: uuid("event_uuid").notNull(),
  user_id: bigint("user_id", { mode: "number" }).notNull(),
  status: registrantStatusEnum("status").default("pending").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const eventCategories = pgTable("event_categories", {
  category_id: serial("category_id").primaryKey(),
  name: text("name").notNull(),
  enabled: boolean("enabled").default(true),
});

// ─── NFT Manager tables (separate DB, but we query via same connection for hackathon) ──

export const nftCollections = pgTable("NFTCollection", {
  id: uuid("id").primaryKey(),
  address: varchar("address", { length: 255 }).notNull(),
  metadata_url: varchar("metadata_url", { length: 255 }).notNull(),
});

export const nftItems = pgTable("NFTItem", {
  id: uuid("id").primaryKey(),
  address: varchar("address", { length: 255 }),
  metadata_url: varchar("metadata_url", { length: 255 }).notNull(),
  collection_id: uuid("collection_id").notNull(),
  owner_address: varchar("owner_address", { length: 255 }).notNull(),
  create_at: timestamp("create_at").defaultNow(),
  state: nftItemStateEnum("state").default("created"),
  index: integer("index"),
  order_id: text("order_id"),
});
