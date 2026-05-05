import type { ErrorHandler } from 'hono';
import { ZodError } from 'zod';
import { HTTPError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

export const errorHandler: ErrorHandler = (err, c) => {
  if (err instanceof HTTPError) {
    return c.json({ error: { code: err.code, message: err.message, details: err.details } }, err.status as 400);
  }
  if (err instanceof ZodError) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details: err.flatten() } }, 422);
  }
  logger.error({ err }, 'Unhandled error');
  return c.json({ error: { code: 'INTERNAL', message: 'Internal server error' } }, 500);
};
