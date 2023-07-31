// @ts-check

import { fileURLToPath } from 'url';
import path from 'path';
import { test, expect } from '@playwright/test';
import { getEntryPointPath } from './helpers/utils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test.describe('testing interface', () => {
  const codePath = path.join(__dirname, '..', 'code');
  let entryPointPath;

  test.beforeAll(async () => {
    entryPointPath = await getEntryPointPath(codePath);
  });

  test('entry point', async () => {
    const entryPointModule = await import(entryPointPath);
    expect(typeof entryPointModule.default).toEqual('function');
  });
});
