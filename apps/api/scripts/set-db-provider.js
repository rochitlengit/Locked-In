#!/usr/bin/env node
/**
 * Switches the Prisma datasource provider between sqlite and postgresql so the
 * same schema can back the zero-setup demo and a production Postgres deploy.
 *
 *   node scripts/set-db-provider.js sqlite
 *   node scripts/set-db-provider.js postgresql
 */
const fs = require('fs');
const path = require('path');

const provider = process.argv[2];
if (!['sqlite', 'postgresql'].includes(provider)) {
  console.error('Usage: set-db-provider.js <sqlite|postgresql>');
  process.exit(1);
}

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const schema = fs.readFileSync(schemaPath, 'utf8');
const updated = schema.replace(/provider = "(sqlite|postgresql)"/, `provider = "${provider}"`);
fs.writeFileSync(schemaPath, updated);
console.log(`Prisma datasource provider set to "${provider}".`);
console.log(
  provider === 'sqlite'
    ? 'Set DATABASE_URL="file:./dev.db" in apps/api/.env'
    : 'Set DATABASE_URL="postgresql://lockedin:lockedin@localhost:5432/lockedin?schema=public" in apps/api/.env',
);
