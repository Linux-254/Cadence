import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { DatabaseNotConfiguredError, isVercelProductionWithoutMongo } from './config.ts';
import {
  deterministicToolId,
  SEED_LEARNING_PATHS,
  SEED_TOOLS_V13,
} from './seed/taxonomy.ts';
import {
  deterministicResourceId,
  SEED_LEARNING_RESOURCES,
} from './seed/resources.ts';
import {
  deterministicDrillId,
  SEED_PRACTICE_DRILLS,
} from './seed/practiceDrills.ts';
import { seedDemoAccountsSqlite } from './seed/demoSeeder.ts';

let sqliteInstance: DatabaseSync | null = null;
let sqliteSeeded = false;

function hasColumn(sqlite: DatabaseSync, table: string, column: string): boolean {
  const cols = sqlite.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  return cols.some((c) => c.name === column);
}

export function getSqliteDb(): DatabaseSync {
  if (sqliteInstance) return sqliteInstance;

  const baseDir = process.env.VERCEL ? '/tmp' : process.cwd();
  const dataDir = path.resolve(baseDir, '.data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, 'cadence.db');
  const sqlite = new DatabaseSync(dbPath);

  sqlite.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      skill_level TEXT NOT NULL DEFAULT 'beginner',
      primary_role TEXT NOT NULL DEFAULT 'Full-Stack Builder',
      timezone TEXT NOT NULL DEFAULT 'UTC',
      xp INTEGER NOT NULL DEFAULT 0,
      tier TEXT NOT NULL DEFAULT 'Apprentice',
      streak_days INTEGER NOT NULL DEFAULT 0,
      last_streak_date TEXT,
      onboarding_completed INTEGER NOT NULL DEFAULT 0,
      default_tool_slugs TEXT NOT NULL DEFAULT '["vscode","google-ai-studio"]',
      portfolio_url TEXT NOT NULL DEFAULT '',
      business_site_url TEXT NOT NULL DEFAULT '',
      profile_json TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token_hash TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL,
      revoked_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS extension_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      source TEXT NOT NULL,
      label TEXT NOT NULL,
      token_hash TEXT UNIQUE NOT NULL,
      token_prefix TEXT NOT NULL,
      last_used_at TEXT,
      revoked_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS pairing_codes (
      code TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      source TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      client_name TEXT NOT NULL DEFAULT '',
      industry TEXT NOT NULL DEFAULT 'Software',
      languages TEXT NOT NULL DEFAULT '[]',
      stack TEXT NOT NULL DEFAULT '[]',
      links TEXT NOT NULL DEFAULT '{"repo":"","live":"","portfolio":""}',
      is_public_portfolio INTEGER NOT NULL DEFAULT 0,
      portfolio_published_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS portfolio_sites (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      site_type TEXT NOT NULL,
      label TEXT NOT NULL,
      site_url TEXT NOT NULL,
      webhook_url TEXT NOT NULL DEFAULT '',
      webhook_secret TEXT NOT NULL,
      auto_publish_on_deploy INTEGER NOT NULL DEFAULT 0,
      last_sync_at TEXT,
      last_sync_status TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tools (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      categories TEXT NOT NULL,
      launch_protocol TEXT NOT NULL DEFAULT '',
      domain_pattern TEXT NOT NULL DEFAULT '',
      tracking_layer TEXT NOT NULL DEFAULT 'manual',
      description TEXT NOT NULL DEFAULT '',
      docs_url TEXT NOT NULL DEFAULT '',
      pricing_tier TEXT,
      is_seeded INTEGER NOT NULL DEFAULT 0,
      created_by TEXT
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      mode TEXT NOT NULL,
      status TEXT NOT NULL,
      planned_minutes INTEGER NOT NULL,
      started_at TEXT NOT NULL,
      ended_at TEXT,
      last_heartbeat TEXT NOT NULL,
      current_device TEXT NOT NULL DEFAULT 'web',
      active_checkpoint_id TEXT,
      title TEXT NOT NULL DEFAULT '',
      summary TEXT NOT NULL DEFAULT '',
      what_i_learned TEXT NOT NULL DEFAULT '',
      improvement_areas TEXT NOT NULL DEFAULT '[]',
      checkpoints TEXT NOT NULL DEFAULT '[]',
      pauses TEXT NOT NULL DEFAULT '[]',
      device_events TEXT NOT NULL DEFAULT '[]',
      activity_slices TEXT NOT NULL DEFAULT '[]',
      xp_awarded INTEGER NOT NULL DEFAULT 0,
      estimate_accuracy REAL NOT NULL DEFAULT 0,
      focus_ratio REAL NOT NULL DEFAULT 1,
      active_minutes INTEGER NOT NULL DEFAULT 0,
      paused_minutes INTEGER NOT NULL DEFAULT 0,
      overrun_minutes INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_user_status ON sessions(user_id, status);
    CREATE INDEX IF NOT EXISTS idx_sessions_lapse ON sessions(status, last_heartbeat);

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      file_name TEXT NOT NULL,
      raw_text TEXT NOT NULL,
      summary_card TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS achievements (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      badge_key TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      awarded_at TEXT NOT NULL,
      session_id TEXT,
      UNIQUE(user_id, badge_key),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS learning_paths (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      track TEXT NOT NULL,
      level TEXT NOT NULL,
      languages TEXT NOT NULL DEFAULT '[]',
      free_only INTEGER NOT NULL DEFAULT 1,
      estimated_hours REAL NOT NULL DEFAULT 0,
      source_name TEXT NOT NULL DEFAULT '',
      summary TEXT NOT NULL DEFAULT '',
      steps TEXT NOT NULL DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS application_tracker (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      company TEXT NOT NULL,
      role TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'saved',
      url TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      applied_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS learning_resources (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      provider TEXT NOT NULL,
      url TEXT NOT NULL,
      tracks TEXT NOT NULL DEFAULT '[]',
      level TEXT NOT NULL,
      languages TEXT NOT NULL DEFAULT '[]',
      content_languages TEXT NOT NULL DEFAULT '["en"]',
      pricing_tier TEXT,
      embeddable TEXT NOT NULL DEFAULT 'unknown',
      format TEXT NOT NULL DEFAULT 'docs',
      estimated_minutes INTEGER,
      summary TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS resource_progress (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      resource_slug TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'saved',
      completed_steps TEXT NOT NULL DEFAULT '[]',
      notes TEXT NOT NULL DEFAULT '',
      linked_session_id TEXT,
      last_opened_at TEXT,
      updated_at TEXT NOT NULL,
      UNIQUE(user_id, resource_slug),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS practice_drills (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      track TEXT NOT NULL,
      level TEXT NOT NULL,
      mode TEXT NOT NULL,
      languages TEXT NOT NULL DEFAULT '[]',
      estimated_minutes INTEGER NOT NULL DEFAULT 45,
      summary TEXT NOT NULL DEFAULT '',
      deliverable TEXT NOT NULL DEFAULT '',
      resource_slug TEXT NOT NULL,
      sandbox_url TEXT NOT NULL DEFAULT '',
      steps TEXT NOT NULL DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS rate_limits (
      key TEXT PRIMARY KEY,
      count INTEGER NOT NULL,
      reset_at TEXT NOT NULL
    );
  `);

  // Safe idempotent column migrations on pre-existing cadence.db files
  if (!hasColumn(sqlite, 'users', 'profile_json')) {
    sqlite.exec(`ALTER TABLE users ADD COLUMN profile_json TEXT`);
  }
  if (!hasColumn(sqlite, 'tools', 'pricing_tier')) {
    sqlite.exec(`ALTER TABLE tools ADD COLUMN pricing_tier TEXT`);
  }

  sqliteInstance = sqlite;
  seedSqliteTaxonomy(sqlite);
  return sqliteInstance;
}

export function seedSqliteTaxonomy(sqlite: DatabaseSync = getSqliteDb()): void {
  if (sqliteSeeded && sqlite === sqliteInstance) return;

  const upsertTool = sqlite.prepare(`
    INSERT INTO tools (id, slug, name, categories, launch_protocol, domain_pattern, tracking_layer, description, docs_url, pricing_tier, is_seeded, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NULL)
    ON CONFLICT(slug) DO UPDATE SET
      name = excluded.name,
      categories = excluded.categories,
      launch_protocol = excluded.launch_protocol,
      domain_pattern = excluded.domain_pattern,
      tracking_layer = excluded.tracking_layer,
      description = excluded.description,
      docs_url = excluded.docs_url,
      pricing_tier = excluded.pricing_tier
  `);

  for (const tool of SEED_TOOLS_V13) {
    upsertTool.run(
      deterministicToolId(tool.slug),
      tool.slug,
      tool.name,
      JSON.stringify(tool.categories),
      tool.launchProtocol,
      tool.domainPattern,
      tool.trackingLayer,
      tool.description,
      tool.docsUrl,
      tool.pricingTier
    );
  }

  const upsertPath = sqlite.prepare(`
    INSERT INTO learning_paths (id, slug, title, track, level, languages, free_only, estimated_hours, source_name, summary, steps)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(slug) DO UPDATE SET
      title = excluded.title,
      track = excluded.track,
      level = excluded.level,
      languages = excluded.languages,
      free_only = excluded.free_only,
      estimated_hours = excluded.estimated_hours,
      source_name = excluded.source_name,
      summary = excluded.summary,
      steps = excluded.steps
  `);

  for (const lp of SEED_LEARNING_PATHS) {
    upsertPath.run(
      lp.id,
      lp.slug,
      lp.title,
      lp.track,
      lp.level,
      JSON.stringify(lp.languages),
      lp.freeOnly ? 1 : 0,
      lp.estimatedHours,
      lp.sourceName,
      lp.summary,
      JSON.stringify(lp.steps)
    );
  }

  const upsertResource = sqlite.prepare(`
    INSERT INTO learning_resources (id, slug, title, provider, url, tracks, level, languages, content_languages, pricing_tier, embeddable, format, estimated_minutes, summary)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(slug) DO UPDATE SET
      title = excluded.title,
      provider = excluded.provider,
      url = excluded.url,
      tracks = excluded.tracks,
      level = excluded.level,
      languages = excluded.languages,
      content_languages = excluded.content_languages,
      pricing_tier = excluded.pricing_tier,
      embeddable = excluded.embeddable,
      format = excluded.format,
      estimated_minutes = excluded.estimated_minutes,
      summary = excluded.summary
  `);

  for (const res of SEED_LEARNING_RESOURCES) {
    upsertResource.run(
      deterministicResourceId(res.slug),
      res.slug,
      res.title,
      res.provider,
      res.url,
      JSON.stringify(res.tracks),
      res.level,
      JSON.stringify(res.languages),
      JSON.stringify(res.contentLanguages),
      res.pricingTier,
      res.embeddable,
      res.format,
      res.estimatedMinutes,
      res.summary
    );
  }

  const upsertDrill = sqlite.prepare(`
    INSERT INTO practice_drills (id, slug, title, track, level, mode, languages, estimated_minutes, summary, deliverable, resource_slug, sandbox_url, steps)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(slug) DO UPDATE SET
      title = excluded.title,
      track = excluded.track,
      level = excluded.level,
      mode = excluded.mode,
      languages = excluded.languages,
      estimated_minutes = excluded.estimated_minutes,
      summary = excluded.summary,
      deliverable = excluded.deliverable,
      resource_slug = excluded.resource_slug,
      sandbox_url = excluded.sandbox_url,
      steps = excluded.steps
  `);

  for (const drill of SEED_PRACTICE_DRILLS) {
    upsertDrill.run(
      deterministicDrillId(drill.slug),
      drill.slug,
      drill.title,
      drill.track,
      drill.level,
      drill.mode,
      JSON.stringify(drill.languages),
      drill.estimatedMinutes,
      drill.summary,
      drill.deliverable,
      drill.resourceSlug,
      drill.sandboxUrl,
      JSON.stringify(drill.steps)
    );
  }

  seedDemoAccountsSqlite(sqlite);
  sqliteSeeded = true;
}
