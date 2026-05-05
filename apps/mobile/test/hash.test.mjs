// Testes da lógica de hash de senha. Replica o que lib/hash.ts faz com
// expo-crypto (SHA-256 + salt) usando o módulo node:crypto, que produz
// exatamente o mesmo hash hexadecimal.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const SALT = 'cantina_fiap_2026_mdi';

function hashSenha(senha) {
  return crypto
    .createHash('sha256')
    .update(`${SALT}:${senha}`)
    .digest('hex');
}

function verifySenha(senha, hash) {
  return hashSenha(senha) === hash;
}

test('hash é determinístico', () => {
  const a = hashSenha('senha123');
  const b = hashSenha('senha123');
  assert.equal(a, b);
});

test('hash tem 64 caracteres hex (256 bits)', () => {
  const h = hashSenha('qualquercoisa');
  assert.equal(h.length, 64);
  assert.match(h, /^[0-9a-f]{64}$/);
});

test('senhas diferentes produzem hashes diferentes', () => {
  const a = hashSenha('senha123');
  const b = hashSenha('senha124');
  assert.notEqual(a, b);
});

test('verifySenha aceita a senha correta', () => {
  const senha = 'minha-senha-forte';
  const hash = hashSenha(senha);
  assert.equal(verifySenha(senha, hash), true);
});

test('verifySenha rejeita senha errada', () => {
  const hash = hashSenha('correta');
  assert.equal(verifySenha('errada', hash), false);
  assert.equal(verifySenha('', hash), false);
});

test('salt fixo evita colisão com hash sem salt', () => {
  const senha = 'teste';
  const comSalt = hashSenha(senha);
  const semSalt = crypto.createHash('sha256').update(senha).digest('hex');
  assert.notEqual(comSalt, semSalt);
});
