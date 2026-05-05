import { zValidator } from '@hono/zod-validator';
import type { ZodSchema } from 'zod';

/**
 * zValidator wrapper that re-throws ZodError so errorHandler returns 422
 * instead of zValidator's default 400.
 */
export const validateJson = <T extends ZodSchema>(schema: T) =>
  zValidator('json', schema, (result) => {
    if (!result.success) throw result.error;
  });
