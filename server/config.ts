export const HEARTBEAT_WEB_S = 30;
export const HEARTBEAT_EXT_S = 60;
export const LAPSE_GRACE_MIN = 5;
export const LAPSE_GRACE_MIN_RANGE = { min: 3, max: 30 } as const;

export const IDE_APP_NAME_TO_SLUG: Record<string, string> = {
  'Visual Studio Code': 'vscode',
  'Visual Studio Code - Insiders': 'vscode',
  'VS Code': 'vscode',
  'vs-code': 'vscode',
  vscode: 'vscode',
  Cursor: 'cursor',
  cursor: 'cursor',
  Windsurf: 'windsurf',
  windsurf: 'windsurf',
  Antigravity: 'antigravity',
  antigravity: 'antigravity',
};

export function clampLapseGraceMin(value: unknown): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return LAPSE_GRACE_MIN;
  return Math.max(LAPSE_GRACE_MIN_RANGE.min, Math.min(LAPSE_GRACE_MIN_RANGE.max, Math.round(num)));
}

export class DatabaseNotConfiguredError extends Error {
  statusCode = 503;
  constructor(message = 'Database not configured.') {
    super(message);
    this.name = 'DatabaseNotConfiguredError';
  }
}

export function isMongoEnvConfigured(): boolean {
  return Boolean(process.env.MONGODB_URI && process.env.MONGODB_URI.trim().length > 0);
}

export function isVercelProductionWithoutMongo(): boolean {
  return process.env.NODE_ENV === 'production' && Boolean(process.env.VERCEL) && !isMongoEnvConfigured();
}
