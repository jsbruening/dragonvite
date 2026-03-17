import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const validEnv = {
  DATABASE_URL: 'postgresql://localhost:5432/test',
  REDIS_URL: 'redis://localhost:6379',
  JWT_SECRET: 'a-secret-that-is-at-least-32-characters-long',
};

describe('loadConfig', () => {
  let savedEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    savedEnv = { ...process.env };
    vi.resetModules();
    Object.assign(process.env, validEnv);
  });

  afterEach(() => {
    // Restore original env
    for (const key of Object.keys(process.env)) {
      if (!(key in savedEnv)) delete process.env[key];
    }
    Object.assign(process.env, savedEnv);
  });

  it('loads valid configuration', async () => {
    const { loadConfig } = await import('./config.js');
    const config = loadConfig();
    expect(config.DATABASE_URL).toBe(validEnv.DATABASE_URL);
    expect(config.PORT).toBe(3000);
    expect(config.HOST).toBe('0.0.0.0');
  });

  it('throws when required env vars are missing', async () => {
    delete process.env.DATABASE_URL;
    delete process.env.REDIS_URL;
    delete process.env.JWT_SECRET;
    const { loadConfig } = await import('./config.js');
    expect(() => loadConfig()).toThrow();
  });

  it('throws when JWT_SECRET is too short', async () => {
    process.env.JWT_SECRET = 'short';
    const { loadConfig } = await import('./config.js');
    expect(() => loadConfig()).toThrow();
  });

  it('uses PORT from env', async () => {
    process.env.PORT = '4000';
    const { loadConfig } = await import('./config.js');
    const config = loadConfig();
    expect(config.PORT).toBe(4000);
  });

  it('re-throws non-Zod errors', async () => {
    const { loadConfig } = await import('./config.js');
    const original = process.env.DATABASE_URL;
    Object.defineProperty(process, 'env', {
      get: () => { throw new TypeError('env read error'); },
      configurable: true,
    });
    try {
      expect(() => loadConfig()).toThrow(TypeError);
    } finally {
      Object.defineProperty(process, 'env', {
        value: { ...validEnv, DATABASE_URL: original },
        configurable: true,
        writable: true,
      });
    }
  });
});

describe('getConfig', () => {
  beforeEach(() => {
    vi.resetModules();
    Object.assign(process.env, validEnv);
  });

  it('throws before loadConfig is called', async () => {
    const { getConfig } = await import('./config.js');
    expect(() => getConfig()).toThrow('Config not loaded');
  });

  it('returns config after loadConfig is called', async () => {
    const { loadConfig, getConfig } = await import('./config.js');
    loadConfig();
    expect(getConfig().PORT).toBe(3000);
  });
});

describe('isProduction / isDevelopment', () => {
  beforeEach(() => {
    vi.resetModules();
    Object.assign(process.env, validEnv);
  });

  it('isProduction returns false in test env', async () => {
    process.env.NODE_ENV = 'test';
    const { loadConfig, isProduction } = await import('./config.js');
    loadConfig();
    expect(isProduction()).toBe(false);
  });

  it('isDevelopment returns false in test env', async () => {
    process.env.NODE_ENV = 'test';
    const { loadConfig, isDevelopment } = await import('./config.js');
    loadConfig();
    expect(isDevelopment()).toBe(false);
  });

  it('isProduction returns true in production env', async () => {
    process.env.NODE_ENV = 'production';
    const { loadConfig, isProduction } = await import('./config.js');
    loadConfig();
    expect(isProduction()).toBe(true);
  });

  it('isDevelopment returns true in development env', async () => {
    process.env.NODE_ENV = 'development';
    const { loadConfig, isDevelopment } = await import('./config.js');
    loadConfig();
    expect(isDevelopment()).toBe(true);
  });
});
