import { describe, it, expect } from 'vitest';
import { RegisterSchema, LoginSchema } from './auth.js';

describe('RegisterSchema', () => {
  it('aceita input valido', () => {
    const result = RegisterSchema.safeParse({ name: 'João', email: 'JOAO@FIAP.COM.BR ', password: '123456' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('joao@fiap.com.br'); // trim+lowercase
      expect(result.data.name).toBe('João');
    }
  });

  it('rejeita nome curto', () => {
    const result = RegisterSchema.safeParse({ name: 'J', email: 'a@b.com', password: '123456' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('auth.register.name_too_short');
    }
  });

  it('rejeita email invalido', () => {
    const result = RegisterSchema.safeParse({ name: 'João', email: 'not-an-email', password: '123456' });
    expect(result.success).toBe(false);
  });

  it('rejeita senha curta', () => {
    const result = RegisterSchema.safeParse({ name: 'João', email: 'a@b.com', password: '12345' });
    expect(result.success).toBe(false);
  });
});

describe('LoginSchema', () => {
  it('aceita email + senha minimal', () => {
    const result = LoginSchema.safeParse({ email: 'a@b.com', password: 'x' });
    expect(result.success).toBe(true);
  });

  it('rejeita senha vazia', () => {
    const result = LoginSchema.safeParse({ email: 'a@b.com', password: '' });
    expect(result.success).toBe(false);
  });
});
