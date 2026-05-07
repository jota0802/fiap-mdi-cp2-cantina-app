import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestDb, type TestDb } from '../test/db.js';
import { createTestUser, createTestTenants, createTestStaff } from '../test/fixtures.js';
import { createAuthRoutes } from './auth.js';
import { Hono } from 'hono';
import { errorHandler } from '../middleware/error-handler.js';
import { verifyJwt } from '../lib/jwt.js';
import { unidades, escolas, cantinas } from '../db/schema.js';

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

const VALID = { email: 'joao@fiap.com', password: '123456' };

describe('POST /auth/register', () => {
  it('cria usuário e retorna user + token (sem nome no signup)', async () => {
    const res = await app.request('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(VALID),
    });
    expect(res.status).toBe(201);
    const json = await res.json() as { user: { email: string; name: string | null; rm: string | null; cantinaId: string | null }; token: string };
    expect(json.user.email).toBe('joao@fiap.com');
    expect(json.user.name).toBeNull();
    expect(json.user.rm).toBeNull();
    expect(json.user.cantinaId).toBeNull();
    expect(json.token).toMatch(/^eyJ/); // JWT
    expect(json.user).toBeDefined();
    const userKeys = Object.keys(json.user);
    expect(userKeys).not.toContain('passwordHash'); // não vaza hash
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
      body: JSON.stringify({ email: 'not-email', password: '1' }),
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

  it('login de staff retorna token com cantinaId', async () => {
    const { cantinaId } = await createTestTenants(testDb);
    await createTestStaff(testDb, cantinaId, { email: 'staff@t.com', password: 'pass123' });

    const res = await app.request('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'staff@t.com', password: 'pass123' }),
    });
    expect(res.status).toBe(200);
    const json = await res.json() as { token: string };
    const payload = await verifyJwt(json.token);
    expect(payload.cantinaId).toBe(cantinaId);
    expect(payload.role).toBe('staff');
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

describe('PATCH /api/v1/auth/me', () => {
  it('atualiza name + rm + cantinaId em uma chamada', async () => {
    const { cantinaId } = await createTestTenants(testDb);
    const u = await createTestUser(testDb, { name: null });

    const res = await app.request('/api/v1/auth/me', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${u.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Aluno Teste', rm: '123456', cantinaId }),
    });
    expect(res.status).toBe(200);
    const json = await res.json() as { user: { name: string; rm: string; cantinaId: string } };
    expect(json.user.name).toBe('Aluno Teste');
    expect(json.user.rm).toBe('123456');
    expect(json.user.cantinaId).toBe(cantinaId);
  });

  it('rejeita rm com 5 dígitos (422)', async () => {
    const u = await createTestUser(testDb);
    const res = await app.request('/api/v1/auth/me', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${u.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ rm: '12345' }),
    });
    expect(res.status).toBe(422);
  });

  it('rejeita rm com letras (422)', async () => {
    const u = await createTestUser(testDb);
    const res = await app.request('/api/v1/auth/me', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${u.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ rm: 'abc123' }),
    });
    expect(res.status).toBe(422);
  });

  it('rejeita cantina inexistente (404)', async () => {
    const u = await createTestUser(testDb);
    const res = await app.request('/api/v1/auth/me', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${u.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ cantinaId: 'c_inexistente' }),
    });
    expect(res.status).toBe(404);
  });

  it('rejeita cantina de outra unidade quando user já tem default (400)', async () => {
    const { cantinaId } = await createTestTenants(testDb);
    await testDb.insert(unidades).values({ id: 'u_outra', nome: 'Outra' });
    await testDb.insert(escolas).values({ id: 'e_outra', unidadeId: 'u_outra', nome: 'Outra Escola', tipo: 'main' });
    await testDb.insert(cantinas).values({ id: 'c_outra', escolaId: 'e_outra', nome: 'Outra Cantina', andar: '1' });

    const u = await createTestUser(testDb, { cantinaId });

    const res = await app.request('/api/v1/auth/me', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${u.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ cantinaId: 'c_outra' }),
    });
    expect(res.status).toBe(400);
  });

  it('aceita null em cantinaId pra limpar', async () => {
    const { cantinaId } = await createTestTenants(testDb);
    const u = await createTestUser(testDb, { cantinaId });

    const res = await app.request('/api/v1/auth/me', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${u.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ cantinaId: null }),
    });
    expect(res.status).toBe(200);
    const json = await res.json() as { user: { cantinaId: string | null } };
    expect(json.user.cantinaId).toBeNull();
  });

  it('aceita troca pra cantina da mesma unidade', async () => {
    const { cantinaId, escolaId } = await createTestTenants(testDb);
    await testDb.insert(cantinas).values({ id: 'c_mesma_unidade', escolaId, nome: 'Mesma Unidade', andar: '2' });
    const u = await createTestUser(testDb, { cantinaId });

    const res = await app.request('/api/v1/auth/me', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${u.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ cantinaId: 'c_mesma_unidade' }),
    });
    expect(res.status).toBe(200);
  });

  it('rejeita sem token (401)', async () => {
    const res = await app.request('/api/v1/auth/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'X' }),
    });
    expect(res.status).toBe(401);
  });
});
