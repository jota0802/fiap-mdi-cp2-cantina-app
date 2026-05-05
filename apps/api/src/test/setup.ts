import { vi } from 'vitest';

process.env.JWT_SECRET ||= 'test-secret-min-32-chars-for-vitest!!';
process.env.NODE_ENV = 'test';
process.env.USE_PGLITE = 'true';

vi.setConfig({ testTimeout: 10_000 });
