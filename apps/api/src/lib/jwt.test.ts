import { describe, it, expect } from 'vitest';
import { signJwt, verifyJwt, type JwtPayload } from './jwt.js';

const PAYLOAD: JwtPayload = {
  sub: 'user_abc123',
  email: 'a@b.com',
  role: 'customer',
  locale: 'pt',
};

describe('jwt', () => {
  it('assina e verifica payload', async () => {
    const token = await signJwt(PAYLOAD);
    expect(token.split('.')).toHaveLength(3); // header.payload.signature

    const verified = await verifyJwt(token);
    expect(verified.sub).toBe('user_abc123');
    expect(verified.email).toBe('a@b.com');
    expect(verified.role).toBe('customer');
    expect(verified.locale).toBe('pt');
  });

  it('rejeita token adulterado', async () => {
    const token = await signJwt(PAYLOAD);
    const tampered = token.slice(0, -2) + 'XX';
    await expect(verifyJwt(tampered)).rejects.toThrow();
  });

  it('rejeita token vazio', async () => {
    await expect(verifyJwt('')).rejects.toThrow();
  });
});

describe('JWT cantinaId claim', () => {
  it('inclui cantinaId quando passado (staff)', async () => {
    const token = await signJwt({
      sub: 'u_test', email: 't@t.com', role: 'staff', locale: 'pt', cantinaId: 'c_pa_5',
    });
    const payload = await verifyJwt(token);
    expect(payload.cantinaId).toBe('c_pa_5');
    expect(payload.role).toBe('staff');
  });

  it('omite cantinaId quando não passado (customer)', async () => {
    const token = await signJwt({
      sub: 'u_test', email: 't@t.com', role: 'customer', locale: 'pt',
    });
    const payload = await verifyJwt(token);
    expect(payload.cantinaId).toBeUndefined();
    expect(payload.role).toBe('customer');
  });
});
