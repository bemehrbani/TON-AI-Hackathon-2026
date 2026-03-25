import pkg from 'pg';
const { Client } = pkg;

async function seed() {
  const client = new Client({
    connectionString: "postgres://onton:onton-secure-updated@localhost:5432/onton_db",
  });

  try {
    console.log("Connecting to local DB...");
    await client.connect();

    console.log("Creating tables...");
    await client.query(`
      CREATE TYPE participation_type AS ENUM ('online', 'in_person');
      CREATE TYPE user_score_item_type AS ENUM ('event', 'task', 'organize_event', 'game');
      CREATE TYPE users_score_activity_type AS ENUM ('free_online_event', 'free_offline_event', 'paid_online_event', 'paid_offline_event', 'join_onton', 'join_onton_affiliate', 'free_play2win', 'paid_play2win', 'x_connect', 'github_connect', 'linked_in_connect', 'start_bot', 'open_mini_app', 'x_view_post', 'x_retweet', 'tg_join_channel', 'tg_join_group', 'tg_post_view', 'tg_access_location', 'google_connect', 'outlook_connect', 'web_visit');
      CREATE TYPE registrant_status AS ENUM ('pending', 'rejected', 'approved', 'checkedin');
      CREATE TYPE claim_status AS ENUM ('not_claimed', 'claimed', 'pending');
      CREATE TYPE "NftItemState" AS ENUM ('created', 'mint_request', 'minted', 'failed');

      CREATE TABLE IF NOT EXISTS users (
        user_id BIGINT PRIMARY KEY,
        username TEXT,
        first_name TEXT,
        last_name TEXT,
        wallet_address TEXT,
        language_code TEXT,
        role TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        is_premium BOOLEAN,
        photo_url TEXT,
        participated_event_count INTEGER,
        hosted_event_count INTEGER,
        user_point INTEGER NOT NULL DEFAULT 0,
        org_channel_name VARCHAR(255),
        org_bio TEXT,
        org_image VARCHAR(255)
      );

      CREATE TABLE IF NOT EXISTS user_score_snapshot (
        id SERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL,
        snapshot_runtime TIMESTAMP WITH TIME ZONE NOT NULL,
        free_online_event DECIMAL(20,6) DEFAULT 0,
        free_offline_event DECIMAL(20,6) DEFAULT 0,
        paid_online_event DECIMAL(20,6) DEFAULT 0,
        paid_offline_event DECIMAL(20,6) DEFAULT 0,
        join_onton DECIMAL(20,6) DEFAULT 0,
        join_onton_affiliate DECIMAL(20,6) DEFAULT 0,
        free_play2win DECIMAL(20,6) DEFAULT 0,
        paid_play2win DECIMAL(20,6) DEFAULT 0,
        claim_status claim_status NOT NULL DEFAULT 'not_claimed',
        total_score DECIMAL(20,6) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS users_score (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL,
        activity_type users_score_activity_type,
        point DECIMAL(20,6),
        active BOOLEAN,
        item_id BIGINT,
        item_type user_score_item_type,
        created_at TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS events (
        event_id SERIAL PRIMARY KEY,
        event_uuid UUID NOT NULL,
        enabled BOOLEAN DEFAULT true,
        hidden BOOLEAN DEFAULT false,
        title TEXT NOT NULL,
        subtitle TEXT NOT NULL,
        description TEXT NOT NULL,
        image_url TEXT NOT NULL,
        society_hub TEXT,
        sbt_collection_address TEXT,
        start_date INTEGER NOT NULL,
        end_date INTEGER NOT NULL,
        timezone TEXT,
        location TEXT,
        owner BIGINT NOT NULL,
        participation_type participation_type NOT NULL DEFAULT 'online',
        has_registration BOOLEAN DEFAULT false,
        has_payment BOOLEAN NOT NULL DEFAULT false,
        capacity INTEGER,
        category_id INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS event_registrants (
        id SERIAL PRIMARY KEY,
        event_uuid UUID NOT NULL,
        user_id BIGINT NOT NULL,
        status registrant_status NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log("Inserting Mock Data...");
    // Insert Target User (the wallet address used in the demo)
    await client.query(`
      INSERT INTO users (user_id, username, first_name, wallet_address, role, is_premium, participated_event_count, hosted_event_count, user_point)
      VALUES (
        123456789, 
        'DemoUser', 
        'Alex', 
        'EQDk2m61-iTZZ9XhQn5u-1QZ_P_r19kQf_-Z3W503pG-3Bwt', 
        'member', 
        true, 
        14, 
        2, 
        1850
      ) ON CONFLICT DO NOTHING;
    `);

    // Insert Another User for leaderboard/Organizer context
    await client.query(`
      INSERT INTO users (user_id, username, first_name, wallet_address, role, is_premium, participated_event_count, hosted_event_count, user_point, org_channel_name)
      VALUES (
        987654321, 
        'TONFoundation', 
        'TF', 
        'EQBxyz...', 
        'organizer', 
        true, 
        50, 
        120, 
        95000,
        'TON Foundation Official'
      ) ON CONFLICT DO NOTHING;
    `);

    // Insert Latest Snapshot for Rank/Reputation Demo
    await client.query(`
      INSERT INTO user_score_snapshot (user_id, snapshot_runtime, free_offline_event, join_onton, total_score)
      VALUES (123456789, NOW(), 850, 1000, 1850);
    `);

    // Insert Score Breakdowns
    await client.query(`
      INSERT INTO users_score (user_id, activity_type, point, created_at)
      VALUES 
      (123456789, 'join_onton', 1000, NOW()),
      (123456789, 'free_offline_event', 250, NOW()),
      (123456789, 'free_offline_event', 600, NOW());
    `);

    // Insert Offline Event
    const nowUnix = Math.floor(Date.now() / 1000);
    await client.query(`
      INSERT INTO events (event_uuid, title, subtitle, description, image_url, society_hub, start_date, end_date, timezone, location, owner, participation_type, capacity)
      VALUES (
        'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
        'TON Hacker House Helsinki',
        'Build the future of Telegram Mini Apps',
        'Join 200 developers for a weekend of coding and TON workshops.',
        'https://ton.org/images/events/helsinki.jpg',
        'Helsinki Hub',
        ${nowUnix + 86400 * 5},
        ${nowUnix + 86400 * 7},
        'Europe/Helsinki',
        'Helsinki Congress Center',
        987654321,
        'in_person',
        200
      );
    `);

    // Insert Event Registrants to show stats
    await client.query(`
      INSERT INTO event_registrants (event_uuid, user_id, status)
      VALUES 
      ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 123456789, 'approved'),
      ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 111111111, 'checkedin'),
      ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 222222222, 'checkedin');
    `);

    console.log("Mock data seeded successfully!");
  } catch (err) {
    console.error("Error seeding DB:", err);
  } finally {
    await client.end();
  }
}

seed();
