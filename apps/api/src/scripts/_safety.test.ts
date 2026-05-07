import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { isProductionTarget, gerarSenhaForte } from './_safety.js';

describe('isProductionTarget', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => { delete process.env.NODE_ENV; });
  afterEach(() => { if (originalNodeEnv) process.env.NODE_ENV = originalNodeEnv; });

  it('retorna true quando NODE_ENV=production (independente de URL)', () => {
    process.env.NODE_ENV = 'production';
    expect(isProductionTarget('postgresql://localhost/dev')).toBe(true);
    expect(isProductionTarget(undefined)).toBe(true);
  });

  it('retorna true pra URL contendo .neon.tech', () => {
    expect(isProductionTarget('postgresql://x:y@ep-foo.us-east-2.aws.neon.tech/db')).toBe(true);
  });

  it('retorna true pra URL contendo .aws.', () => {
    expect(isProductionTarget('postgresql://x:y@host.aws.com/db')).toBe(true);
  });

  it('retorna false pra localhost', () => {
    expect(isProductionTarget('postgresql://localhost:5432/dev')).toBe(false);
    expect(isProductionTarget('postgresql://127.0.0.1/dev')).toBe(false);
  });

  it('retorna false pra URL undefined (sem prod NODE_ENV)', () => {
    expect(isProductionTarget(undefined)).toBe(false);
  });

  it('retorna false pra URL vazia', () => {
    expect(isProductionTarget('')).toBe(false);
  });
});

describe('gerarSenhaForte', () => {
  it('retorna string de exatamente 16 caracteres', () => {
    expect(gerarSenhaForte()).toHaveLength(16);
  });

  it('exclui caracteres confusos (0, O, o, 1, l, I)', () => {
    for (let i = 0; i < 100; i++) {
      const senha = gerarSenhaForte();
      expect(senha).not.toMatch(/[0OoIl1]/);
    }
  });

  it('gera senhas diferentes a cada chamada', () => {
    const set = new Set(Array.from({ length: 50 }, () => gerarSenhaForte()));
    expect(set.size).toBe(50);
  });

  it('inclui pelo menos 1 dígito ou 1 símbolo na maioria das vezes', () => {
    let temDigitoOuSimbolo = 0;
    for (let i = 0; i < 50; i++) {
      const senha = gerarSenhaForte();
      if (/[\d!@#$%&*]/.test(senha)) temDigitoOuSimbolo++;
    }
    expect(temDigitoOuSimbolo).toBeGreaterThan(45);
  });
});
