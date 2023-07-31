// @ts-check
/* eslint-disable jest/no-done-callback */

import { test, expect } from '@playwright/test';
import init from '@hexlet/code';
import fastify from 'fastify';
import {
  getTestData, loadUsers, runServer,
} from './helpers/index.js';

test.describe('test session', () => {
  let app;
  let knex;
  const data = getTestData();

  test.beforeAll(async () => {
    app = fastify({ logger: true });
    app = await init(app);
    knex = app.objection.knex;
    await runServer(app);

    await knex.migrate.latest();
    await loadUsers(app);
  });

  test.beforeEach(async ({ context }) => {
    await context.setDefaultTimeout(3000);
    await context.clearCookies();
  });

  test('sign in / sign out', async ({ page }) => {
    await page.goto(data.links.root.url);

    await expect(page.locator(`text="${data.links.signIn.name}"`)).toBeVisible();
    await expect(page.locator(`text="${data.links.signUp.name}"`)).toBeVisible();
    await expect(page.locator(`text="${data.buttons.signOut.name}"`)).toBeHidden();

    await page.click(`text="${data.links.signIn.name}"`);
    await page.waitForLoadState();

    await expect(page).toHaveURL(data.links.signIn.url);

    await page.fill('text="Email"', data.users.existing.email);
    await page.fill('text="Пароль"', data.users.existing.password);
    await page.click(`text="${data.buttons.signIn.name}"`);
    await page.waitForLoadState();

    await expect(page).toHaveURL(data.links.root.url);
    await expect(page.locator('.alert')).toHaveText('Вы залогинены');

    await expect(page.locator(`text="${data.links.signIn.name}"`)).toBeHidden();
    await expect(page.locator(`text="${data.links.signUp.name}"`)).toBeHidden();
    await expect(page.locator(`text="${data.buttons.signOut.name}"`)).toBeVisible();

    page.on('dialog', (dialog) => {
      dialog.accept();
    });
    await page.click(`text="${data.buttons.signOut.name}"`);
    await page.waitForLoadState();

    await expect(page).toHaveURL(data.links.root.url);
    await expect(page.locator('.alert')).toHaveText('Вы разлогинены');

    await expect(page.locator(`text="${data.links.signIn.name}"`)).toBeVisible();
    await expect(page.locator(`text="${data.links.signUp.name}"`)).toBeVisible();
    await expect(page.locator(`text="${data.buttons.signOut.name}"`)).toBeHidden();
  });

  test('sign in with validation errors', async ({ page }) => {
    await page.goto(data.links.signIn.url);

    await page.locator(`text="${data.buttons.signIn.name}"`).click();
    await page.waitForLoadState();

    await expect(page).toHaveCountValidationErrors(1);
    await expect(page).toHaveURL(data.links.session.url);
  });

  test.afterAll(async () => {
    await app.close();
  });
});
