// Global test setup
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/shopbuilder_test';
process.env.REDIS_URL =
  process.env.REDIS_URL || 'redis://localhost:6379/1';
process.env.JWT_SECRET_KEY =
  process.env.JWT_SECRET_KEY ||
  'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2';
process.env.CORS_ORIGINS = 'http://localhost:3000';

jest.setTimeout(30000);
