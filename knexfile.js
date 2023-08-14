// @ts-check

import path from 'path';
import { fileURLToPath } from 'url';
// import { knexSnakeCaseMappers } from 'objection';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const migrations = {
  directory: path.join(__dirname, 'server', 'migrations'),
};

export const development = {
  client: 'better-sqlite3',
  connection: {
    filename: './database.sqlite',
  },
  useNullAsDefault: true,
  debug: true,
  migrations,
  // ...knexSnakeCaseMappers(),
};

export const test = {
  client: 'better-sqlite3',
  connection: ':memory:',
  useNullAsDefault: true,
  debug: true,
  migrations,
};

export const production = {
  client: 'better-sqlite3',
  connection: {
    filename: './database.sqlite',
  },
  useNullAsDefault: true,
  migrations,
};
