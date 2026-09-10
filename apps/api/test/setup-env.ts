// Tests run against a throwaway SQLite database file, never the demo/dev one.
process.env.DATABASE_URL = process.env.DATABASE_URL_TEST || 'file:./test.db';
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRES_IN = '1h';
