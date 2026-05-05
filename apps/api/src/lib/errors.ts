export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'BAD_REQUEST'
  | 'INTERNAL';

export class HTTPError extends Error {
  status: number;
  code: ErrorCode;
  details?: unknown;
  constructor(status: number, code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const conflict = (msg: string, details?: unknown) => new HTTPError(409, 'CONFLICT', msg, details);
export const unauthorized = (msg = 'Unauthorized') => new HTTPError(401, 'UNAUTHORIZED', msg);
export const forbidden = (msg = 'Forbidden') => new HTTPError(403, 'FORBIDDEN', msg);
export const notFound = (msg = 'Not found') => new HTTPError(404, 'NOT_FOUND', msg);
export const badRequest = (msg: string, details?: unknown) => new HTTPError(400, 'BAD_REQUEST', msg, details);
export const validationError = (details: unknown) => new HTTPError(422, 'VALIDATION_ERROR', 'Validation failed', details);
