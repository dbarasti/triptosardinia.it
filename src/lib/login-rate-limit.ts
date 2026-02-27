/**
 * Rate limit for admin login: max 5 failed attempts per IP per 15 minutes.
 * In-memory; resets on server restart. Use a single key per IP.
 */
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const store = new Map<string, { count: number; resetAt: number }>();

function prune(): void {
  const now = Date.now();
  Array.from(store.entries()).forEach(([key, v]) => {
    if (now > v.resetAt) store.delete(key);
  });
}

export function isLoginRateLimited(ip: string): boolean {
  prune();
  const entry = store.get(ip);
  if (!entry) return false;
  if (Date.now() > entry.resetAt) {
    store.delete(ip);
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

export function recordFailedLogin(ip: string): void {
  prune();
  const now = Date.now();
  const entry = store.get(ip);
  if (!entry) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  if (now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  entry.count += 1;
  if (entry.count >= MAX_ATTEMPTS) {
    entry.resetAt = now + WINDOW_MS;
  }
}

export function clearLoginAttempts(ip: string): void {
  store.delete(ip);
}
