import { execSync } from 'child_process';

/** Creates a throwaway SQLite schema for the e2e suite before any test runs. */
module.exports = async () => {
  process.env.DATABASE_URL = 'file:./test.db';
  execSync('npx prisma db push --force-reset --skip-generate', {
    cwd: __dirname + '/..',
    env: { ...process.env, DATABASE_URL: 'file:./test.db' },
    stdio: 'ignore',
  });
};
