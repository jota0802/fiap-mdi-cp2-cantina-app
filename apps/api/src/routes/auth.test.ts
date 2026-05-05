import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestDb, type TestDb } from '../test/db.js';
import { createTestUser } from '../test/fixtures.js';
import { createAuthRoutes } from './auth.js';
import { Hono } from 'hono';
import { errorHandler } from '../middleware/error-handler.js';

let testDb: TestDb;
let close: () => Promise<void>;
let app: Hono;

beforeEach(async () => {
  const fixture = await createTestDb();
  testDb = fixture.db;
  close = fixture.close;
  app = new Hono();
  app.route('/api/v1/auth', await createAuthRoutes(testDb));
  app.onError(errorHandler);
});

afterEach(async () => { await close(); });

const VALID = { name: 'João', email: 'joao@fiap.com', password: '123456' };

describe('POST /auth/register', () => {
  it('cria usuário e retorna user + token', async () => {
    const res = await app.request('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(VALID),
    });
    expect(res.status).toBe(201);
    const json = await res.json() as { user: { email: string; name: string }; token: string };
    expect(json.user.email).toBe('joao@fiap.com');
    expect(json.user.name).toBe('João');
    expect(json.token).toMatch(/^eyJ/); // JWT
    expect(json.user).toBeDefined();
    const userKeys = Object.keys(json.user);
    expect(userKeys).not.toContain('passwordHash'); // não vaza hash
    expect(userKeys).not.toContain('tenantId');     // não vaza ID multi-tenant
    expect(userKeys).not.toContain('updatedAt');    // só campos do PublicUserSchema
  });

  it('rejeita email duplicado com 409', async () => {
    await app.request('/api/v1/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(VALID) });
    const res = await app.request('/api/v1/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(VALID) });
    expect(res.status).toBe(409);
    const json = await res.json() as { error: { code: string } };
    expect(json.error.code).toBe('CONFLICT');
  });

  it('rejeita payload invalido com 422', async () => {
    const res = await app.request('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'X', email: 'not-email', password: '1' }),
    });
    expect(res.status).toBe(422);
    const json = await res.json() as { error: { code: string } };
    expect(json.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('POST /auth/login', () => {
  it('autentica com credenciais corretas', async () => {
    await app.request('/api/v1/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(VALID) });
    const res = await app.request('/api/v1/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: VALID.email, password: VALID.password }),
    });
    expect(res.status).toBe(200);
    const json = await res.json() as { user: { email: string }; token: string };
    expect(json.user.email).toBe(VALID.email);
    expect(json.token).toMatch(/^eyJ/);
  });

  it('rejeita senha errada com 401', async () => {
    await app.request('/api/v1/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(VALID) });
    const res = await app.request('/api/v1/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: VALID.email, password: 'errada' }),
    });
    expect(res.status).toBe(401);
  });

  it('rejeita email não cadastrado com 401', async () => {
    const res = await app.request('/api/v1/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nao-existe@x.com', password: 'qualquer' }),
    });
    expect(res.status).toBe(401);
  });
});

describe('GET /auth/me', () => {
  it('retorna usuario autenticado', async () => {
    const { user, token } = await createTestUser(testDb);
    const res = await app.request('/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const json = await res.json() as { user: { email: string } };
    expect(json.user.email).toBe(user.email);
  });

  it('rejeita sem token com 401', async () => {
    const res = await app.request('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('rejeita token invalido com 401', async () => {
    const res = await app.request('/api/v1/auth/me', { headers: { Authorization: 'Bearer trash' } });
    expect(res.status).toBe(401);
  });
});
