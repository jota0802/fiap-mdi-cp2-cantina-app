import { describe, it, expect } from 'vitest';
import {
  validateEmail,
  validateSenha,
  validateNome,
  validateConfirmaSenha,
  SENHA_MIN_LENGTH,
} from './index.js';

describe('validateEmail', () => {
  it('aceita enderecos validos', () => {
    expect(validateEmail('aluno@fiap.com.br')).toBeUndefined();
    expect(validateEmail('joao.victor@gmail.com')).toBeUndefined();
    expect(validateEmail('a@b.co')).toBeUndefined();
  });

  it('rejeita campo vazio com chave i18n', () => {
    expect(validateEmail('')).toEqual({ key: 'validation.email_required' });
    expect(validateEmail('   ')).toEqual({ key: 'validation.email_required' });
  });

  it('rejeita formatos invalidos com chave i18n', () => {
    const invalido = { key: 'validation.email_invalid' };
    expect(validateEmail('semarroba.com')).toEqual(invalido);
    expect(validateEmail('sem@ponto')).toEqual(invalido);
    expect(validateEmail('@dominio.com')).toEqual(invalido);
    expect(validateEmail('com espaço@dom.com')).toEqual(invalido);
  });
});

describe('validateSenha', () => {
  it('exige pelo menos 6 caracteres', () => {
    expect(validateSenha('')).toEqual({ key: 'validation.password_required' });
    expect(validateSenha('12345')).toEqual({
      key: 'validation.password_too_short',
      vars: { count: SENHA_MIN_LENGTH },
    });
    expect(validateSenha('123456')).toBeUndefined();
    expect(validateSenha('senhaforte')).toBeUndefined();
  });
});

describe('validateNome', () => {
  it('aceita nomes validos', () => {
    expect(validateNome('Lucca')).toBeUndefined();
    expect(validateNome('  Maria  ')).toBeUndefined();
  });

  it('rejeita vazio ou muito curto', () => {
    expect(validateNome('')).toEqual({ key: 'validation.name_required' });
    expect(validateNome('   ')).toEqual({ key: 'validation.name_required' });
    expect(validateNome('A')).toEqual({ key: 'validation.name_short' });
  });
});

describe('validateConfirmaSenha', () => {
  it('valida igualdade', () => {
    expect(validateConfirmaSenha('', '123456')).toEqual({
      key: 'validation.confirm_password_required',
    });
    expect(validateConfirmaSenha('111111', '123456')).toEqual({
      key: 'validation.passwords_mismatch',
    });
    expect(validateConfirmaSenha('123456', '123456')).toBeUndefined();
  });
});
