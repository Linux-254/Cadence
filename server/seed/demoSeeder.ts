import crypto from 'node:crypto';
import { hashPassword } from '../auth.ts';
import { DEMO_ACCOUNTS_SEED } from './demoAccounts.ts';
import type { DatabaseSync } from 'node:sqlite';
import { UserModel, ProjectModel } from '../models/mongooseModels.ts';

export function seedDemoAccountsSqlite(sqlite: DatabaseSync) {
  const hashedPassword = hashPassword('Password123!');
  const upsertUser = sqlite.prepare(`
    INSERT INTO users (id, username, name, email, password_hash, skill_level, primary_role, timezone, xp, tier, streak_days, onboarding_completed, default_tool_slugs, portfolio_url, business_site_url, profile_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(email) DO UPDATE SET
      name = excluded.name,
      skill_level = excluded.skill_level,
      primary_role = excluded.primary_role,
      xp = excluded.xp,
      tier = excluded.tier,
      streak_days = excluded.streak_days,
      onboarding_completed = 1,
      profile_json = excluded.profile_json
  `);

  const upsertProj = sqlite.prepare(`
    INSERT INTO projects (id, user_id, name, type, client_name, industry, languages, stack, links, is_public_portfolio, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      type = excluded.type,
      client_name = excluded.client_name,
      industry = excluded.industry,
      languages = excluded.languages,
      stack = excluded.stack
  `);

  for (const acc of DEMO_ACCOUNTS_SEED) {
    const userId = `demo_${acc.intent}`;
    const profileObj = {
      tracks: acc.tracks,
      level: acc.level,
      intent: acc.intent,
      buildsWithAI: acc.buildsWithAI,
      programmingLanguages: acc.programmingLanguages,
      contentLanguages: acc.contentLanguages,
      freeOnly: acc.freeOnly,
      hasStudentDiscount: acc.hasStudentDiscount,
      country: acc.country,
      weeklyGoal: { days: 5, minutes: 300 },
      resourceOpenMode: 'split',
      dashboardLens: acc.intent,
      resourceWindowPrefs: {},
      onboardingStep: 6,
      dismissedProfilePrompt: true,
      lapseGraceMin: 5,
      selectedPathSlug: null,
      migratedV13: true,
    };

    upsertUser.run(
      userId,
      acc.username,
      acc.name,
      acc.email,
      hashedPassword,
      acc.skillLevel,
      acc.primaryRole,
      acc.timezone,
      acc.xp,
      acc.tier,
      acc.streakDays,
      JSON.stringify(['vscode', 'google-ai-studio', 'github', 'docker', 'postman']),
      acc.sampleProjects[0]?.type === 'business' ? 'https://cadence.dev/demo/business' : '',
      acc.sampleProjects[0]?.type === 'business' ? 'https://cadence.dev/demo/business' : '',
      JSON.stringify(profileObj)
    );

    // Seed sample projects
    acc.sampleProjects.forEach((p, idx) => {
      const projId = `${userId}_proj_${idx + 1}`;
      upsertProj.run(
        projId,
        userId,
        p.name,
        p.type,
        p.clientName,
        p.industry,
        JSON.stringify(p.languages),
        JSON.stringify(p.stack),
        JSON.stringify({ repo: 'https://github.com/cadence-demo/sample', live: 'https://cadence.dev', portfolio: 'https://cadence.dev' })
      );
    });
  }
}

export async function seedDemoAccountsMongo() {
  const hashedPassword = hashPassword('Password123!');
  for (const acc of DEMO_ACCOUNTS_SEED) {
    const userId = `demo_${acc.intent}`;
    const profileObj = {
      tracks: acc.tracks,
      level: acc.level,
      intent: acc.intent,
      buildsWithAI: acc.buildsWithAI,
      programmingLanguages: acc.programmingLanguages,
      contentLanguages: acc.contentLanguages,
      freeOnly: acc.freeOnly,
      hasStudentDiscount: acc.hasStudentDiscount,
      country: acc.country,
      weeklyGoal: { days: 5, minutes: 300 },
      resourceOpenMode: 'split',
      dashboardLens: acc.intent,
      resourceWindowPrefs: {},
      onboardingStep: 6,
      dismissedProfilePrompt: true,
      lapseGraceMin: 5,
      selectedPathSlug: null,
      migratedV13: true,
    };

    await UserModel.updateOne(
      { email: acc.email },
      {
        $setOnInsert: { _id: userId },
        $set: {
          username: acc.username,
          name: acc.name,
          email: acc.email,
          passwordHash: hashedPassword,
          skillLevel: acc.skillLevel,
          primaryRole: acc.primaryRole,
          timezone: acc.timezone,
          xp: acc.xp,
          tier: acc.tier,
          streakDays: acc.streakDays,
          onboardingCompleted: true,
          defaultToolSlugs: ['vscode', 'google-ai-studio', 'github', 'docker', 'postman'],
          portfolioUrl: 'https://cadence.dev/demo/portfolio',
          businessSiteUrl: 'https://cadence.dev/demo/business',
          profile: profileObj,
        },
      },
      { upsert: true }
    );

    for (const [idx, p] of acc.sampleProjects.entries()) {
      const projId = `${userId}_proj_${idx + 1}`;
      await ProjectModel.updateOne(
        { _id: projId },
        {
          $setOnInsert: { userId },
          $set: {
            name: p.name,
            type: p.type,
            clientName: p.clientName,
            industry: p.industry,
            languages: p.languages,
            stack: p.stack,
            links: { repo: 'https://github.com/cadence-demo/sample', live: 'https://cadence.dev', portfolio: 'https://cadence.dev' },
            isPublicPortfolio: true,
          },
        },
        { upsert: true }
      );
    }
  }
}
