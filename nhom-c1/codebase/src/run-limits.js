// Leave time for storage cleanup before Vercel's 300-second function limit.
export const ACTION_TIMEOUT_MS = 270_000;
export const RESPONSE_TIMEOUT_MS = 285_000;
export const RUN_LEASE_MS = 330_000;
export function generationTimeoutMs() {
  const configured = Number(process.env.LLM_GENERATE_TIMEOUT_MS || 120_000);
  return Number.isFinite(configured) && configured > 0 ? Math.min(configured, 120_000) : 120_000;
}
