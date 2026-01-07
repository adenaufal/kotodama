/**
 * Rate limiter to prevent API cost overruns and abuse.
 * Uses a sliding window approach for accurate rate limiting.
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitState {
  requests: number[];
}

const RATE_LIMIT_KEY = 'kotodama_rate_limit';

// Default limits
const DEFAULT_LIMITS: Record<string, RateLimitConfig> = {
  // Per-minute limits
  generate: { maxRequests: 20, windowMs: 60 * 1000 },
  analyzeProfile: { maxRequests: 10, windowMs: 60 * 1000 },
  // Per-hour limits (stored separately)
  generateHourly: { maxRequests: 200, windowMs: 60 * 60 * 1000 },
};

/**
 * Gets the current rate limit state from storage.
 */
async function getRateLimitState(): Promise<Record<string, RateLimitState>> {
  return new Promise((resolve) => {
    chrome.storage.local.get([RATE_LIMIT_KEY], (result: Record<string, Record<string, RateLimitState> | undefined>) => {
      resolve(result[RATE_LIMIT_KEY] || {});
    });
  });
}

/**
 * Saves the rate limit state to storage.
 */
async function saveRateLimitState(state: Record<string, RateLimitState>): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [RATE_LIMIT_KEY]: state }, resolve);
  });
}

/**
 * Cleans up expired timestamps from the state.
 */
function cleanupExpiredRequests(
  requests: number[],
  windowMs: number,
  now: number
): number[] {
  const cutoff = now - windowMs;
  return requests.filter((timestamp) => timestamp > cutoff);
}

/**
 * Checks if a request should be rate limited.
 * Returns true if the request is allowed, false if rate limited.
 */
export async function checkRateLimit(action: string): Promise<{
  allowed: boolean;
  remaining: number;
  resetIn: number;
}> {
  const config = DEFAULT_LIMITS[action];
  if (!config) {
    // No limit configured for this action
    return { allowed: true, remaining: Infinity, resetIn: 0 };
  }

  const now = Date.now();
  const state = await getRateLimitState();
  const actionState = state[action] || { requests: [] };

  // Clean up expired requests
  const validRequests = cleanupExpiredRequests(
    actionState.requests,
    config.windowMs,
    now
  );

  const remaining = config.maxRequests - validRequests.length;
  const oldestRequest = validRequests[0] || now;
  const resetIn = Math.max(0, oldestRequest + config.windowMs - now);

  if (remaining <= 0) {
    return { allowed: false, remaining: 0, resetIn };
  }

  return { allowed: true, remaining, resetIn };
}

/**
 * Records a request for rate limiting.
 * Should be called after checkRateLimit returns allowed: true.
 */
export async function recordRequest(action: string): Promise<void> {
  const config = DEFAULT_LIMITS[action];
  if (!config) return;

  const now = Date.now();
  const state = await getRateLimitState();
  const actionState = state[action] || { requests: [] };

  // Clean up and add new request
  const validRequests = cleanupExpiredRequests(
    actionState.requests,
    config.windowMs,
    now
  );
  validRequests.push(now);

  state[action] = { requests: validRequests };
  await saveRateLimitState(state);
}

/**
 * Combined check and record for convenience.
 * Returns rate limit status and records the request if allowed.
 */
export async function tryRequest(action: string): Promise<{
  allowed: boolean;
  remaining: number;
  resetIn: number;
  error?: string;
}> {
  // Check both per-minute and per-hour limits for generate
  if (action === 'generate') {
    const minuteCheck = await checkRateLimit('generate');
    const hourCheck = await checkRateLimit('generateHourly');

    if (!minuteCheck.allowed) {
      return {
        ...minuteCheck,
        error: `Rate limit exceeded. Try again in ${Math.ceil(minuteCheck.resetIn / 1000)} seconds.`,
      };
    }

    if (!hourCheck.allowed) {
      return {
        ...hourCheck,
        error: `Hourly rate limit exceeded. Try again in ${Math.ceil(hourCheck.resetIn / 60000)} minutes.`,
      };
    }

    // Record both
    await recordRequest('generate');
    await recordRequest('generateHourly');

    return { allowed: true, remaining: Math.min(minuteCheck.remaining, hourCheck.remaining) - 1, resetIn: 0 };
  }

  const check = await checkRateLimit(action);
  if (!check.allowed) {
    return {
      ...check,
      error: `Rate limit exceeded. Try again in ${Math.ceil(check.resetIn / 1000)} seconds.`,
    };
  }

  await recordRequest(action);
  return { allowed: true, remaining: check.remaining - 1, resetIn: 0 };
}

/**
 * Resets rate limits (for testing or admin purposes).
 */
export async function resetRateLimits(): Promise<void> {
  await saveRateLimitState({});
}

/**
 * Gets current rate limit status for all actions.
 */
export async function getRateLimitStatus(): Promise<
  Record<string, { remaining: number; resetIn: number }>
> {
  const result: Record<string, { remaining: number; resetIn: number }> = {};

  for (const action of Object.keys(DEFAULT_LIMITS)) {
    const status = await checkRateLimit(action);
    result[action] = { remaining: status.remaining, resetIn: status.resetIn };
  }

  return result;
}
