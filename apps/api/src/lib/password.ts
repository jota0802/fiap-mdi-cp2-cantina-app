import { hash, verify } from '@node-rs/argon2';
import { logger } from './logger.js';

const ARGON2_OPTS = {
  memoryCost: 19456, // 19 MiB — OWASP 2024 recommendation
  timeCost: 2,
  parallelism: 1,
} as const;

export async function hashPassword(plain: string): Promise<string> {
  return hash(plain, ARGON2_OPTS);
}

export async function verifyPassword(plain: string, hashStr: string): Promise<boolean> {
  try {
    return await verify(hashStr, plain);
  } catch (err) {
    logger.error({ err }, 'verifyPassword: argon2 verify threw');
    return false;
  }
}
