// @ts-check
/* eslint-disable jest/no-done-callback */
/* eslint no-restricted-syntax: ["off", "ForOfStatement"] */
/* eslint-disable no-await-in-loop */

import { test, expect } from '@playwright/test';
import init from '@hexlet/code';
import fastify from 'fastify';
import {
  getLabels, getTestData, loadLabels, loadUsers, runServer, signIn,
} from './helpers/index.js';

test.describe('test labels CRUD', () => {
  let app;
  let knex;
  const labels = getLabels();
  const data = getTestData();

  test.beforeAll(async () => {
    app = fastify({ logger: true });
    app = await init(app);
    knex = app.objection.knex;
    await runServer(app);
  });

  test.beforeEach(async ({ context, page }) => {
    await knex.migrate.latest();
    await loadUsers(app);
    const cookie = await signIn(app, data.users.existing);
    await loadLabels(app, cookie);

    await context.setDefaultTimeout(3000);
    await context.clearCookies();
    await page.goto(data.links.signIn.url);
    await page.fill('text="Email"', data.users.existing.email);
    await page.fill('text="Пароль"', data.users.existing.password);
    await page.click(`text="${data.buttons.signIn.name}"`);
    await page.waitForLoadState();
  });

  test('index', async ({ page }) => {
    await page.goto(data.links.root.url);
    await page.click(`text="${data.links.labels.name}"`);
    await page.waitForLoadState();

    await expect(page).toHaveURL(data.links.labels.url);
    for (const label of labels) {
      await expect(page.locator('body')).toContainText(label.name);
    }
  });

  test('create', async ({ page }) => {
    await page.goto(data.links.labels.url);
    await page.click(`text="${data.links.newLabel.name}"`);
    await page.waitForLoadState();

    await expect(page).toHaveURL(data.links.newLabel.url);

    await page.fill('text="Наименование"', data.labels.new.name);
    await page.click(`text="${data.buttons.create.name}"`);
    await page.waitForLoadState();

    await expect(page).toHaveURL(data.links.labels.url);
    await expect(page.locator('.alert')).toHaveText('Метка успешно создана');
    await expect(page.locator('body')).toContainText(data.labels.new.name);
  });

  test('update', async ({ page }) => {
    await page.goto(data.links.labels.url);

    const editLinkSelector = `tr:has-text("${data.labels.existing.name}") >> text="${data.links.edit.name}"`;
    await expect(page.locator(editLinkSelector)).toBeVisible();
    await page.click(editLinkSelector);
    await page.waitForLoadState();

    await expect(page).toHaveURL(/\/labels\/\d+\/edit/);
    await expect(page.locator('#data_name')).toHaveValue(data.labels.existing.name);

    await page.fill('text="Наименование"', data.labels.new.name);
    await page.click(`text="${data.buttons.edit.name}"`);
    await page.waitForLoadState();

    await expect(page).toHaveURL(data.links.labels.url);
    await expect(page.locator('.alert')).toHaveText('Метка успешно изменена');
    await expect(page.locator('body')).not.toContainText(data.labels.existing.name);
    await expect(page.locator('body')).toContainText(data.labels.new.name);
  });

  test('delete', async ({ page }) => {
    await page.goto(data.links.labels.url);

    const deletebuttonSelector = `tr:has-text("${data.labels.existing.name}") >> text="${data.buttons.delete.name}"`;
    await expect(page.locator(deletebuttonSelector)).toBeVisible();
    page.on('dialog', (dialog) => {
      dialog.accept();
    });
    await page.click(deletebuttonSelector);
    await page.waitForLoadState();

    await expect(page).toHaveURL(data.links.labels.url);
    await expect(page.locator('.alert')).toHaveText('Метка успешно удалена');
    await expect(page.locator('body')).not.toContainText(data.labels.existing.name);
  });

  test('label create with validation errors', async ({ page }) => {
    await page.goto(data.links.newLabel.url);

    await page.click(`text="${data.buttons.create.name}"`);
    await page.waitForLoadState();

    await expect(page).toHaveCountValidationErrors(1);
    await expect(page).toHaveURL(data.links.labels.url);
    await expect(page.locator('.alert')).toHaveText('Не удалось создать метку');
  });

  test.afterEach(async () => {
    await knex.migrate.rollback();
  });

  test.afterAll(async () => {
    await app.close();
  });
});
