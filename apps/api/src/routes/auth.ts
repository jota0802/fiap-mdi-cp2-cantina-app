import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { RegisterSchema, LoginSchema } from '@cantina/shared';
import type { PublicUser } from '@cantina/shared';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { signJwt } from '../lib/jwt.js';
import { conflict, unauthorized } from '../lib/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rate-limit.js';
import { users } from '../db/schema.js';
import type { TestDb } from '../test/db.js';
import type { DB } from '../db/client.js';
import { validateJson } from '../lib/zod-hono.js';

const VALID_ROLES = ['customer', 'staff'] as const;
type ValidRole = typeof VALID_ROLES[number];

function assertValidRole(role: string): ValidRole {
  if (!VALID_ROLES.includes(role as ValidRole)) {
    throw new Error(`Unexpected role in DB: ${role}`);
  }
  return role as ValidRole;
}

function toPublicUser(u: typeof users.$inferSelect): PublicUser {
  return {
    id: u.id,
    name: u.name ?? '',
    email: u.email,
    avatarUrl: u.avatarUrl,
    locale: u.locale,
    role: assertValidRole(u.role),
    createdAt: u.createdAt.toISOString(),
  };
}

export async function createAuthRoutes(db: DB | TestDb) {
  const DUMMY_HASH = await hashPassword('cantina-dummy-00000000');

  const app = new Hono();

  // Rate limit: 10 tentativas / 15min por IP em cada rota de auth.
  const authLimit = (scope: string) => rateLimit({ windowMs: 15 * 60 * 1000, max: 10, scope });

  app.post('/register', authLimit('register'), validateJson(RegisterSchema), async (c) => {
    const { name, email, password } = c.req.valid('json');

    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing) throw conflict('Email já cadastrado');

    const passwordHash = await hashPassword(password);
    const id = createId();
    const [user] = await db.insert(users).values({ id, name, email, passwordHash, locale: 'pt' }).returning();
    if (!user) throw new Error('failed to create user');

    const token = await signJwt({
      sub: user.id,
      email: user.email,
      role: assertValidRole(user.role),
      locale: user.locale,
      cantinaId: user.cantinaId ?? undefined,
    });
    return c.json({ user: toPublicUser(user), token }, 201);
  });

  app.post('/login', authLimit('login'), validateJson(LoginSchema), async (c) => {
    const { email, password } = c.req.valid('json');
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    const hashToVerify = user?.passwordHash ?? DUMMY_HASH;
    const ok = await verifyPassword(password, hashToVerify);
    if (!user || !ok) throw unauthorized('Credenciais inválidas');
    const token = await signJwt({
      sub: user.id,
      email: user.email,
      role: assertValidRole(user.role),
      locale: user.locale,
      cantinaId: user.cantinaId ?? undefined,
    });
    return c.json({ user: toPublicUser(user), token }, 200);
  });

  app.get('/me', requireAuth, async (c) => {
    const claim = c.get('user');
    const [user] = await db.select().from(users).where(eq(users.id, claim.sub)).limit(1);
    if (!user) throw unauthorized('Sessão inválida');
    return c.json({ user: toPublicUser(user) }, 200);
  });

  return app;
}
