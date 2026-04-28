// Testes da lógica de validação dos formulários (login + cadastro).
// Replica EXATAMENTE as funções de lib/validation.ts. Roda em Node puro
// (sem React Native), apenas para garantir que as regras estão corretas.

import { test } from 'node:test';
import assert from 'node:assert/strict';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SENHA_MIN_LENGTH = 6;
const NOME_MIN_LENGTH = 2;

function validateEmail(email) {
  const trimmed = email.trim();
  if (!trimmed) return 'O e-mail é obrigatório';
  if (!EMAIL_REGEX.test(trimmed)) return 'E-mail inválido';
  return undefined;
}

function validateSenha(senha) {
  if (!senha) return 'A senha é obrigatória';
  if (senha.length < SENHA_MIN_LENGTH) {
    return `A senha deve ter no mínimo ${SENHA_MIN_LENGTH} caracteres`;
  }
  return undefined;
}

function validateNome(nome) {
  const trimmed = nome.trim();
  if (!trimmed) return 'O nome é obrigatório';
  if (trimmed.length < NOME_MIN_LENGTH) return 'Nome muito curto';
  return undefined;
}

function validateConfirmaSenha(confirmaSenha, senha) {
  if (!confirmaSenha) return 'Confirme sua senha';
  if (confirmaSenha !== senha) return 'As senhas não coincidem';
  return undefined;
}

test('validateEmail aceita endereços válidos', () => {
  assert.equal(validateEmail('aluno@fiap.com.br'), undefined);
  assert.equal(validateEmail('joao.victor@gmail.com'), undefined);
  assert.equal(validateEmail('a@b.co'), undefined);
});

test('validateEmail rejeita campo vazio', () => {
  assert.equal(validateEmail(''), 'O e-mail é obrigatório');
  assert.equal(validateEmail('   '), 'O e-mail é obrigatório');
});

test('validateEmail rejeita formatos inválidos', () => {
  assert.equal(validateEmail('semarroba.com'), 'E-mail inválido');
  assert.equal(validateEmail('sem@ponto'), 'E-mail inválido');
  assert.equal(validateEmail('@dominio.com'), 'E-mail inválido');
  assert.equal(validateEmail('com espaço@dom.com'), 'E-mail inválido');
});

test('validateSenha exige pelo menos 6 caracteres', () => {
  assert.equal(validateSenha(''), 'A senha é obrigatória');
  assert.equal(validateSenha('12345'), 'A senha deve ter no mínimo 6 caracteres');
  assert.equal(validateSenha('123456'), undefined);
  assert.equal(validateSenha('senhaforte'), undefined);
});

test('validateNome aceita nomes válidos', () => {
  assert.equal(validateNome('Lucca'), undefined);
  assert.equal(validateNome('  Maria  '), undefined);
});

test('validateNome rejeita vazio ou muito curto', () => {
  assert.equal(validateNome(''), 'O nome é obrigatório');
  assert.equal(validateNome('   '), 'O nome é obrigatório');
  assert.equal(validateNome('A'), 'Nome muito curto');
});

test('validateConfirmaSenha valida igualdade', () => {
  assert.equal(validateConfirmaSenha('', '123456'), 'Confirme sua senha');
  assert.equal(validateConfirmaSenha('111111', '123456'), 'As senhas não coincidem');
  assert.equal(validateConfirmaSenha('123456', '123456'), undefined);
});
