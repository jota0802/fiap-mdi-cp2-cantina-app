import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from './password.js';

describe('password', () => {
  it('hashes uma senha e verifica corretamente', async () => {
    const hash = await hashPassword('s3nha-forte');
    expect(hash).not.toBe('s3nha-forte');
    expect(hash.length).toBeGreaterThan(50);
    expect(await verifyPassword('s3nha-forte', hash)).toBe(true);
  });

  it('falha em senha errada', async () => {
    const hash = await hashPassword('correta');
    expect(await verifyPassword('errada', hash)).toBe(false);
  });

  it('hashes diferentes pra mesma senha (salt random)', async () => {
    const a = await hashPassword('mesma');
    const b = await hashPassword('mesma');
    expect(a).not.toBe(b);
  });
});
