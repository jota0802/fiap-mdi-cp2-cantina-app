// Testes da lógica de validação dos formulários (login + cadastro).
// Replica EXATAMENTE as funções de lib/validation.ts. Roda em Node puro
// (sem React Native). As funções retornam ValidationError com `key` i18n.

import { test } from 'node:test';
import assert from 'node:assert/strict';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SENHA_MIN_LENGTH = 6;
const NOME_MIN_LENGTH = 2;

function validateEmail(email) {
  const trimmed = email.trim();
  if (!trimmed) return { key: 'validation.email_required' };
  if (!EMAIL_REGEX.test(trimmed)) return { key: 'validation.email_invalid' };
  return undefined;
}

function validateSenha(senha) {
  if (!senha) return { key: 'validation.password_required' };
  if (senha.length < SENHA_MIN_LENGTH) {
    return {
      key: 'validation.password_too_short',
      vars: { count: SENHA_MIN_LENGTH },
    };
  }
  return undefined;
}

function validateNome(nome) {
  const trimmed = nome.trim();
  if (!trimmed) return { key: 'validation.name_required' };
  if (trimmed.length < NOME_MIN_LENGTH) return { key: 'validation.name_short' };
  return undefined;
}

function validateConfirmaSenha(confirmaSenha, senha) {
  if (!confirmaSenha) return { key: 'validation.confirm_password_required' };
  if (confirmaSenha !== senha) return { key: 'validation.passwords_mismatch' };
  return undefined;
}

test('validateEmail aceita endereços válidos', () => {
  assert.equal(validateEmail('aluno@fiap.com.br'), undefined);
  assert.equal(validateEmail('joao.victor@gmail.com'), undefined);
  assert.equal(validateEmail('a@b.co'), undefined);
});

test('validateEmail rejeita campo vazio com chave i18n', () => {
  assert.deepEqual(validateEmail(''), { key: 'validation.email_required' });
  assert.deepEqual(validateEmail('   '), { key: 'validation.email_required' });
});

test('validateEmail rejeita formatos inválidos com chave i18n', () => {
  const invalido = { key: 'validation.email_invalid' };
  assert.deepEqual(validateEmail('semarroba.com'), invalido);
  assert.deepEqual(validateEmail('sem@ponto'), invalido);
  assert.deepEqual(validateEmail('@dominio.com'), invalido);
  assert.deepEqual(validateEmail('com espaço@dom.com'), invalido);
});

test('validateSenha exige pelo menos 6 caracteres', () => {
  assert.deepEqual(validateSenha(''), { key: 'validation.password_required' });
  assert.deepEqual(validateSenha('12345'), {
    key: 'validation.password_too_short',
    vars: { count: 6 },
  });
  assert.equal(validateSenha('123456'), undefined);
  assert.equal(validateSenha('senhaforte'), undefined);
});

test('validateNome aceita nomes válidos', () => {
  assert.equal(validateNome('Lucca'), undefined);
  assert.equal(validateNome('  Maria  '), undefined);
});

test('validateNome rejeita vazio ou muito curto', () => {
  assert.deepEqual(validateNome(''), { key: 'validation.name_required' });
  assert.deepEqual(validateNome('   '), { key: 'validation.name_required' });
  assert.deepEqual(validateNome('A'), { key: 'validation.name_short' });
});

test('validateConfirmaSenha valida igualdade', () => {
  assert.deepEqual(validateConfirmaSenha('', '123456'), {
    key: 'validation.confirm_password_required',
  });
  assert.deepEqual(validateConfirmaSenha('111111', '123456'), {
    key: 'validation.passwords_mismatch',
  });
  assert.equal(validateConfirmaSenha('123456', '123456'), undefined);
});
