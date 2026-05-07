import { describe, it, expect } from 'vitest';
import { RegisterSchema, LoginSchema, UpdateMeSchema } from './auth.js';

describe('RegisterSchema', () => {
  it('aceita input valido (sem nome)', () => {
    const result = RegisterSchema.safeParse({ email: 'JOAO@FIAP.COM.BR ', password: '123456' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('joao@fiap.com.br'); // trim+lowercase
    }
  });

  it('rejeita email invalido', () => {
    const result = RegisterSchema.safeParse({ email: 'not-an-email', password: '123456' });
    expect(result.success).toBe(false);
  });

  it('rejeita senha curta', () => {
    const result = RegisterSchema.safeParse({ email: 'a@b.com', password: '12345' });
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

describe('UpdateMeSchema', () => {
  it('aceita objeto vazio', () => {
    const result = UpdateMeSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('aceita name + rm + cantinaId', () => {
    const result = UpdateMeSchema.safeParse({ name: 'Aluno', rm: '123456', cantinaId: 'c_1' });
    expect(result.success).toBe(true);
  });

  it('aceita cantinaId null', () => {
    const result = UpdateMeSchema.safeParse({ cantinaId: null });
    expect(result.success).toBe(true);
  });

  it('rejeita rm com 5 dígitos', () => {
    const result = UpdateMeSchema.safeParse({ rm: '12345' });
    expect(result.success).toBe(false);
  });

  it('rejeita rm com letras', () => {
    const result = UpdateMeSchema.safeParse({ rm: 'abc123' });
    expect(result.success).toBe(false);
  });

  it('rejeita name muito curto', () => {
    const result = UpdateMeSchema.safeParse({ name: 'A' });
    expect(result.success).toBe(false);
  });
});
