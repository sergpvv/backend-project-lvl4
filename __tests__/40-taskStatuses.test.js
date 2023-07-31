// @ts-check
/* eslint-disable jest/no-done-callback */
/* eslint no-restricted-syntax: ["off", "ForOfStatement"] */
/* eslint-disable no-await-in-loop */

import { test, expect } from '@playwright/test';
import init from '@hexlet/code';
import fastify from 'fastify';
import {
  getTaskStatuses, getTestData, loadTaskStatuses, loadUsers, runServer, signIn,
} from './helpers/index.js';

test.describe('test statuses CRUD', () => {
  let app;
  let knex;
  const taskStatuses = getTaskStatuses();
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
    await loadTaskStatuses(app, cookie);

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
    await page.click(`text="${data.links.statuses.name}"`);
    await page.waitForLoadState();

    await expect(page).toHaveURL(data.links.statuses.url);
    for (const taskStatus of taskStatuses) {
      await expect(page.locator('body')).toContainText(taskStatus.name);
    }
  });

  test('create', async ({ page }) => {
    await page.goto(data.links.statuses.url);
    await page.click(`text="${data.links.newStatus.name}"`);
    await page.waitForLoadState();

    await expect(page).toHaveURL(data.links.newStatus.url);

    await page.fill('text="Наименование"', data.taskStatuses.new.name);
    await page.click(`text="${data.buttons.create.name}"`);
    await page.waitForLoadState();

    await expect(page).toHaveURL(data.links.statuses.url);
    await expect(page.locator('.alert')).toHaveText('Статус успешно создан');
    await expect(page.locator('body')).toContainText(data.taskStatuses.new.name);
  });

  test('update', async ({ page }) => {
    await page.goto(data.links.statuses.url);

    const editLinkSelector = `tr:has-text("${data.taskStatuses.existing.name}") >> text="${data.links.edit.name}"`;
    await expect(page.locator(editLinkSelector)).toBeVisible();
    await page.click(editLinkSelector);
    await page.waitForLoadState();

    await expect(page).toHaveURL(/\/statuses\/\d+\/edit/);
    await expect(page.locator('#data_name')).toHaveValue(data.taskStatuses.existing.name);

    await page.fill('text="Наименование"', data.taskStatuses.new.name);
    await page.click(`text="${data.buttons.edit.name}"`);
    await page.waitForLoadState();

    await expect(page).toHaveURL(data.links.statuses.url);
    await expect(page.locator('.alert')).toHaveText('Статус успешно изменён');
    await expect(page.locator('body')).not.toContainText(data.taskStatuses.existing.name);
    await expect(page.locator('body')).toContainText(data.taskStatuses.new.name);
  });

  test('delete', async ({ page }) => {
    await page.goto(data.links.statuses.url);

    const deletebuttonSelector = `tr:has-text("${data.taskStatuses.existing.name}") >> text="${data.buttons.delete.name}"`;
    await expect(page.locator(deletebuttonSelector)).toBeVisible();
    page.on('dialog', (dialog) => {
      dialog.accept();
    });
    await page.click(deletebuttonSelector);
    await page.waitForLoadState();

    await expect(page).toHaveURL(data.links.statuses.url);
    await expect(page.locator('.alert')).toHaveText('Статус успешно удалён');
    await expect(page.locator('body')).not.toContainText(data.taskStatuses.existing.name);
  });

  test('status create with validation errors', async ({ page }) => {
    await page.goto(data.links.newStatus.url);

    await page.click(`text="${data.buttons.create.name}"`);
    await page.waitForLoadState();

    await expect(page).toHaveCountValidationErrors(1);
    await expect(page).toHaveURL(data.links.statuses.url);
    await expect(page.locator('.alert')).toHaveText('Не удалось создать статус');
  });

  test.afterEach(async () => {
    await knex.migrate.rollback();
  });

  test.afterAll(async () => {
    await app.close();
  });
});
