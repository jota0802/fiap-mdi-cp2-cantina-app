import * as Crypto from 'expo-crypto';

const SALT = 'cantina_fiap_2026_mdi';

export async function hashSenha(senha: string): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${SALT}:${senha}`,
  );
}

export async function verifySenha(senha: string, hash: string): Promise<boolean> {
  const computed = await hashSenha(senha);
  return computed === hash;
}
