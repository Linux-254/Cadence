import type {
  CheckpointItem,
  PauseInterval,
  SessionRecord,
  TierName,
} from '../src/types/cadence.ts';
import { clampLapseGraceMin, LAPSE_GRACE_MIN } from './config.ts';
import { storage } from './storage.ts';

export function computeTier(xp: number): TierName {
  if (xp >= 20000) return 'Principal';
  if (xp >= 8500) return 'Architect';
  if (xp >= 3500) return 'Craftsman';
  if (xp >= 1000) return 'Journeyman';
  return 'Apprentice';
}

export function computeSessionTimings(
  startedAtIso: string,
  endedAtIso: string | null,
  pauses: PauseInterval[],
  nowMs: number = Date.now()
) {
  const startedMs = new Date(startedAtIso).getTime();
  const effectiveEndMs = endedAtIso ? new Date(endedAtIso).getTime() : nowMs;

  let totalPausedMs = 0;
  let totalOverrunMs = 0;

  for (const p of pauses) {
    const pStart = new Date(p.startedAt).getTime();
    const pEnd = p.resumedAt ? new Date(p.resumedAt).getTime() : effectiveEndMs;
    const actualPauseMs = Math.max(0, pEnd - pStart);
    const plannedPauseMs = p.plannedMinutes * 60_000;
    totalPausedMs += actualPauseMs;
    totalOverrunMs += Math.max(0, actualPauseMs - plannedPauseMs);
  }

  const activeMs = Math.max(0, effectiveEndMs - startedMs - totalPausedMs);
  const activeMinutes = Math.max(0, Math.round(activeMs / 60_000));
  const pausedMinutes = Math.max(0, Math.round(totalPausedMs / 60_000));
  const overrunMinutes = Math.max(0, Math.round(totalOverrunMs / 60_000));
  const focusRatio =
    activeMs + totalOverrunMs > 0
      ? Number((activeMs / (activeMs + totalOverrunMs)).toFixed(3))
      : 1;

  return {
    activeSeconds: Math.floor(activeMs / 1000),
    activeMinutes,
    pausedMinutes,
    overrunMinutes,
    focusRatio,
  };
}

export function computeImprovementAreas(checkpoints: CheckpointItem[], overrunMinutes: number): string[] {
  const areas: string[] = [];
  for (const cp of checkpoints) {
    if (cp.actualMinutes > 0 && cp.plannedMinutes > 0) {
      const ratio = cp.actualMinutes / cp.plannedMinutes;
      if (ratio >= 1.25) {
        const pctOver = Math.round((ratio - 1) * 100);
        areas.push(`${cp.category.toUpperCase()} (${cp.title}) ran ${pctOver}% over estimate; budget extra buffer next sprint.`);
      } else if (ratio <= 0.5 && cp.status === 'completed') {
        areas.push(`${cp.category.toUpperCase()} (${cp.title}) finished in half the planned time; tighten future estimate.`);
      }
    }
  }
  if (overrunMinutes > 5) {
    areas.push(`Pause overrun totaled ${overrunMinutes}m; set a shorter break length next block.`);
  }
  if (areas.length === 0) {
    areas.push('Estimate calibration and break discipline were within target bounds.');
  }
  return areas;
}

export async function calculateAwardedXp(params: {
  userId: string;
  activeMinutes: number;
  plannedMinutes: number;
  focusRatio: number;
  completedCheckpoints: number;
  streakDays: number;
}) {
  const { userId, activeMinutes, plannedMinutes, focusRatio, completedCheckpoints, streakDays } = params;
  const accuracy =
    plannedMinutes > 0
      ? Math.max(0, 1 - Math.abs(activeMinutes - plannedMinutes) / Math.max(1, plannedMinutes))
      : 0.75;
  const roundedAccuracy = Number(accuracy.toFixed(3));

  if (activeMinutes < 1) {
    return { xpAwarded: 0, estimateAccuracy: roundedAccuracy };
  }

  const baseXP = Math.min(180, Math.max(10, Math.round(activeMinutes * 1.2)));
  const checkpointBonus = completedCheckpoints * 15;
  const streakMultiplier = Math.min(1.5, 1 + streakDays * 0.05);
  const rawXP = Math.round(
    (baseXP + checkpointBonus) * (0.5 + 0.5 * accuracy) * focusRatio * streakMultiplier
  );

  const todayPrefix = new Date().toISOString().slice(0, 10);
  const xpToday = await storage.sumUserXpToday(userId, todayPrefix);
  const remainingFullCap = Math.max(0, 500 - xpToday);
  const fullPortion = Math.min(rawXP, remainingFullCap);
  const overflowPortion = Math.round(Math.max(0, rawXP - remainingFullCap) * 0.25);

  return {
    xpAwarded: Math.max(5, fullPortion + overflowPortion),
    estimateAccuracy: roundedAccuracy,
  };
}

export async function awardSessionBadges(userId: string, session: SessionRecord, newStreak: number) {
  await storage.awardAchievement(
    userId,
    'first_shipped_session',
    'First Shipped Session',
    'Completed and logged your first timed accountability session.',
    session.id
  );

  if (session.estimateAccuracy >= 0.9 && session.activeMinutes >= 15) {
    await storage.awardAchievement(
      userId,
      'estimated_within_10',
      'Estimated Within 10%',
      'Matched actual session duration within 10% of your plan.',
      session.id
    );
  }

  if (session.pauses.length > 0 && session.overrunMinutes === 0) {
    await storage.awardAchievement(
      userId,
      'zero_overrun_pause',
      'Disciplined Return',
      'Returned from every pause before the countdown alarm expired.',
      session.id
    );
  }

  if (session.deviceEvents.length > 0) {
    await storage.awardAchievement(
      userId,
      'multi_device_handoff',
      'Desktop-to-Mobile Handoff',
      'Transitioned an active session seamlessly between desktop and mobile.',
      session.id
    );
  }

  if (session.checkpoints.some((c) => c.category === 'deployment' && c.status === 'completed')) {
    await storage.awardAchievement(
      userId,
      'deployment_shipped',
      'Shipped Deployment Checkpoint',
      'Completed a live deployment checkpoint inside a tracked sprint.',
      session.id
    );
  }

  if (newStreak >= 7) {
    await storage.awardAchievement(
      userId,
      'seven_day_streak',
      '7-Day Consistency Streak',
      'Logged focused build or learning sessions 7 days in a row.',
      session.id
    );
  }
}

export async function updateUserStreakAndXp(userId: string, xpEarned: number) {
  const user = await storage.findUserById(userId);
  if (!user) return { xp: 0, tier: 'Apprentice' as TierName, streakDays: 0 };

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

  let nextStreak = user.streakDays;
  if (user.lastStreakDate === today) {
    nextStreak = Math.max(1, user.streakDays);
  } else if (user.lastStreakDate === yesterday) {
    nextStreak = user.streakDays + 1;
  } else {
    nextStreak = 1;
  }

  const nextXp = user.xp + xpEarned;
  const nextTier = computeTier(nextXp);
  await storage.updateUserStreakAndXp(userId, nextXp, nextTier, nextStreak, today);

  return { xp: nextXp, tier: nextTier, streakDays: nextStreak };
}

export function isSafePublicWebhookUrl(rawUrl: string): { ok: boolean; error?: string; parsed?: URL } {
  if (!rawUrl.trim()) return { ok: false, error: 'Webhook URL is empty.' };
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { ok: false, error: 'Invalid webhook URL format.' };
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return { ok: false, error: 'Webhook URL must use http or https.' };
  }
  const host = parsed.hostname.toLowerCase();
  if (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '0.0.0.0' ||
    host === '::1' ||
    host === '169.254.169.254' ||
    host.startsWith('10.') ||
    host.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host) ||
    host.endsWith('.local')
  ) {
    return { ok: false, error: 'Private, loopback, and metadata addresses are blocked for webhooks.' };
  }
  return { ok: true, parsed };
}

async function closeSessionAsLapsed(sess: SessionRecord): Promise<SessionRecord> {
  const endedAt = sess.lastHeartbeat;
  const timings = computeSessionTimings(
    sess.startedAt,
    endedAt,
    sess.pauses,
    new Date(endedAt).getTime()
  );

  const updatedCheckpoints = sess.checkpoints.map((cp) => {
    if (cp.status === 'active' && cp.startedAt) {
      const elapsed = Math.max(1, Math.round((new Date(endedAt).getTime() - new Date(cp.startedAt).getTime()) / 60_000));
      return { ...cp, actualMinutes: cp.actualMinutes + elapsed, status: 'completed' as const, completedAt: endedAt };
    }
    return cp;
  });

  const areas = computeImprovementAreas(updatedCheckpoints, timings.overrunMinutes);
  areas.unshift('Session ended automatically via heartbeat lapse after app disconnect (exact IDE slices preserved).');

  return storage.saveSession({
    ...sess,
    status: 'lapsed',
    endedAt,
    activeMinutes: timings.activeMinutes,
    pausedMinutes: timings.pausedMinutes,
    overrunMinutes: timings.overrunMinutes,
    focusRatio: timings.focusRatio,
    checkpoints: updatedCheckpoints,
    improvementAreas: areas,
    title: sess.title || 'Auto-Captured Session (App Closed)',
    summary: sess.summary || 'Ended automatically at last verified heartbeat without losing recorded work.',
  });
}

// K3: Lazy finalization run on session reads & dashboard reads
export async function finalizeStaleSessionIfNeeded(
  sess: SessionRecord,
  userLapseGraceMin?: number
): Promise<SessionRecord> {
  if (sess.status !== 'active') return sess;
  const graceMin = clampLapseGraceMin(userLapseGraceMin ?? LAPSE_GRACE_MIN);
  const lastHbMs = new Date(sess.lastHeartbeat).getTime();
  if (Date.now() - lastHbMs <= graceMin * 60_000) {
    return sess;
  }
  return closeSessionAsLapsed(sess);
}

// K1 & K3: Cron / background lapse sweep using shared LAPSE_GRACE_MIN default (5m) and per-user override (3-30m)
export async function runLapseSweep(): Promise<number> {
  // Query candidates older than minimum possible grace threshold (3 min), then check each user's grace setting
  const minCutoffIso = new Date(Date.now() - 3 * 60_000).toISOString();
  const staleCandidates = await storage.findStaleActiveSessions(minCutoffIso);

  let lapsedCount = 0;
  for (const sess of staleCandidates) {
    const owner = await storage.findUserById(sess.userId);
    const graceMin = clampLapseGraceMin(owner?.profile?.lapseGraceMin ?? LAPSE_GRACE_MIN);
    const lastHbMs = new Date(sess.lastHeartbeat).getTime();
    if (Date.now() - lastHbMs > graceMin * 60_000) {
      await closeSessionAsLapsed(sess);
      lapsedCount++;
    }
  }
  return lapsedCount;
}
