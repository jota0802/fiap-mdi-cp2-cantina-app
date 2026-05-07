import type { MiddlewareHandler } from 'hono';

interface Bucket {
  count: number;
  resetAt: number;
}

interface RateLimitOptions {
  windowMs: number;
  max: number;
  // Prefixo por rota — evita que /login e /register compartilhem bucket
  scope: string;
}

// In-memory store. Ok pra single-instance (Render free). Pra multi-instance,
// trocar por Redis/Upstash com TTL.
const store = new Map<string, Bucket>();

function getClientIp(c: Parameters<MiddlewareHandler>[0]): string {
  // Render/proxies setam x-forwarded-for; pegar o primeiro IP da lista.
  const fwd = c.req.header('x-forwarded-for');
  if (fwd) {
    const first = fwd.split(',')[0]?.trim();
    if (first) return first;
  }
  return c.req.header('x-real-ip') ?? 'unknown';
}

function sweep(now: number) {
  // Limpa buckets expirados pra evitar leak de memoria.
  for (const [key, bucket] of store) {
    if (bucket.resetAt <= now) store.delete(key);
  }
}

export function rateLimit(opts: RateLimitOptions): MiddlewareHandler {
  return async (c, next) => {
    const now = Date.now();
    if (store.size > 1000) sweep(now);

    const ip = getClientIp(c);
    const key = `${opts.scope}:${ip}`;
    const bucket = store.get(key);

    if (!bucket || bucket.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + opts.windowMs });
      return next();
    }

    if (bucket.count >= opts.max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      c.header('Retry-After', String(retryAfter));
      return c.json(
        {
          error: {
            code: 'RATE_LIMITED',
            message: `Muitas tentativas. Tente novamente em ${retryAfter}s.`,
          },
        },
        429,
      );
    }

    bucket.count += 1;
    return next();
  };
}
