// fetch with timeout + 1 retry (on 429 / 5xx / network errors) with jitter. Never logs bodies or headers.

export interface RetryOptions { timeoutMs: number; retries?: number; sleep?: (ms: number) => Promise<void> }

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export class TimeoutError extends Error {}

async function once(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } catch (err) {
    if (ctrl.signal.aborted) throw new TimeoutError(`timeout after ${timeoutMs} ms`);
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchRetry(url: string, init: RequestInit, opts: RetryOptions): Promise<Response> {
  const retries = opts.retries ?? 1;
  const sleep = opts.sleep ?? defaultSleep;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const res = await once(url, init, opts.timeoutMs);
      if ((res.status === 429 || res.status >= 500) && attempt < retries) {
        await sleep(300 + Math.random() * 500);
        continue;
      }
      return res;
    } catch (err) {
      lastErr = err;
      if (attempt < retries) await sleep(300 + Math.random() * 500);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('request failed');
}
