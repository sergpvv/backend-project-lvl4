// @ts-check
/* eslint-disable jest/no-done-callback */

import { test, expect } from '@playwright/test';
import init from '@hexlet/code';
import fastify from 'fastify';
import {
  getTestData, loadLabels, loadUsers, loadTaskStatuses, runServer, signIn,
} from './helpers/index.js';

test.describe('test tasks CRUD', () => {
  let app;
  let knex;
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
    await loadTaskStatuses(app, cookie);

    await context.setDefaultTimeout(3000);
    await context.clearCookies();
    await page.goto(data.links.signIn.url);
    await page.fill('text="Email"', data.users.existing.email);
    await page.fill('text="Пароль"', data.users.existing.password);
    await page.click(`text="${data.buttons.signIn.name}"`);
    await page.waitForLoadState();
  });

  test('create / show', async ({ page }) => {
    await page.goto(data.links.tasks.url);
    await page.click(`text="${data.links.newTask.name}"`);
    await page.waitForLoadState();

    await expect(page).toHaveURL(data.links.newTask.url);

    await page.fill('text="Наименование"', data.tasks.first.name);
    await page.fill('text="Описание"', data.tasks.first.description);
    await page.selectOption('#data_statusId', { label: data.tasks.first.status });
    await page.selectOption('#data_executorId', { label: data.tasks.first.executor });
    await page.selectOption(
      '#data_labels',
      [
        { label: data.tasks.first.labels.first },
        { label: data.tasks.first.labels.second },
      ],
    );
    await page.click(`text="${data.buttons.create.name}"`);
    await page.waitForLoadState();

    await expect(page).toHaveURL(data.links.tasks.url);
    await expect(page.locator('.alert')).toHaveText('Задача успешно создана');
    await expect(page.locator('body')).toContainText(data.tasks.first.name);

    await page.click(`text="${data.tasks.first.name}"`);
    await page.waitForLoadState();

    await expect(page.locator('body')).toContainText(data.tasks.first.name);
    await expect(page.locator('body')).toContainText(data.tasks.first.description);
    await expect(page.locator('body')).toContainText(data.users.existing.fullName);
    await expect(page.locator('body')).toContainText(data.tasks.first.executor);
    await expect(page.locator('body')).toContainText(data.tasks.first.status);
    await expect(page.locator('body')).toContainText(data.tasks.first.labels.first);
    await expect(page.locator('body')).toContainText(data.tasks.first.labels.second);
  });

  test('index / filter', async ({ page }) => {
    await page.goto(data.links.root.url);
    await page.click(`text="${data.links.tasks.name}"`);
    await page.waitForLoadState();

    // create first task
    await page.click(`text="${data.links.newTask.name}"`);
    await page.waitForLoadState();

    await page.fill('text="Наименование"', data.tasks.first.name);
    await page.fill('text="Описание"', data.tasks.first.description);
    await page.selectOption('#data_statusId', { label: data.tasks.first.status });
    await page.selectOption('#data_executorId', { label: data.tasks.first.executor });
    await page.selectOption(
      '#data_labels',
      [
        { label: data.tasks.first.labels.first },
        { label: data.tasks.first.labels.second },
      ],
    );
    await page.click(`text="${data.buttons.create.name}"`);
    await page.waitForLoadState();

    // create second task
    await page.click(`text="${data.links.newTask.name}"`);
    await page.waitForLoadState();

    await page.fill('text="Наименование"', data.tasks.second.name);
    await page.fill('text="Описание"', data.tasks.second.description);
    await page.selectOption('#data_statusId', { label: data.tasks.second.status });
    await page.selectOption('#data_executorId', { label: data.tasks.second.executor });
    await page.selectOption(
      '#data_labels',
      [
        { label: data.tasks.second.labels.first },
        { label: data.tasks.second.labels.second },
      ],
    );
    await page.click(`text="${data.buttons.create.name}"`);
    await page.waitForLoadState();

    // create third task
    await page.click(`text="${data.links.newTask.name}"`);
    await page.waitForLoadState();

    await page.fill('text="Наименование"', data.tasks.third.name);
    await page.fill('text="Описание"', data.tasks.third.description);
    await page.selectOption('#data_statusId', { label: data.tasks.third.status });
    await page.selectOption('#data_executorId', { label: data.tasks.third.executor });
    await page.click(`text="${data.buttons.create.name}"`);
    await page.waitForLoadState();

    await expect(page.locator('body')).toContainText(data.tasks.first.name);
    await expect(page.locator('body')).toContainText(data.tasks.second.name);
    await expect(page.locator('body')).toContainText(data.tasks.third.name);

    await page.check('text="Только мои задачи"');
    await page.waitForLoadState();

    await expect(page.locator('body')).toContainText(data.tasks.first.name);
    await expect(page.locator('body')).toContainText(data.tasks.second.name);
    await expect(page.locator('body')).toContainText(data.tasks.third.name);

    await page.selectOption('#data_status', { label: data.tasks.second.status });
    await page.click(`text="${data.buttons.show.name}"`);
    await page.waitForLoadState();

    await expect(page.locator('body')).not.toContainText(data.tasks.first.name);
    await expect(page.locator('body')).toContainText(data.tasks.second.name);
    await expect(page.locator('body')).toContainText(data.tasks.third.name);

    await page.selectOption('#data_label', { label: data.tasks.second.labels.first });
    await page.click(`text="${data.buttons.show.name}"`);
    await page.waitForLoadState();

    await expect(page.locator('body')).not.toContainText(data.tasks.first.name);
    await expect(page.locator('body')).toContainText(data.tasks.second.name);
    await expect(page.locator('body')).not.toContainText(data.tasks.third.name);

    await page.selectOption('#data_status', []);
    await page.click(`text="${data.buttons.show.name}"`);
    await page.waitForLoadState();

    await expect(page.locator('body')).toContainText(data.tasks.first.name);
    await expect(page.locator('body')).toContainText(data.tasks.second.name);
    await expect(page.locator('body')).not.toContainText(data.tasks.third.name);

    await page.selectOption('#data_executor', { label: data.tasks.first.executor });
    await page.click(`text="${data.buttons.show.name}"`);
    await page.waitForLoadState();

    await expect(page.locator('body')).toContainText(data.tasks.first.name);
    await expect(page.locator('body')).not.toContainText(data.tasks.second.name);
    await expect(page.locator('body')).not.toContainText(data.tasks.third.name);
  });

  test('update', async ({ page }) => {
    await page.goto(data.links.tasks.url);
    await page.click(`text="${data.links.newTask.name}"`);
    await page.waitForLoadState();

    await page.fill('text="Наименование"', data.tasks.first.name);
    await page.fill('text="Описание"', data.tasks.first.description);
    await page.selectOption('#data_statusId', { label: data.tasks.first.status });
    await page.selectOption('#data_executorId', { label: data.tasks.first.executor });
    await page.selectOption(
      '#data_labels',
      [
        { label: data.tasks.first.labels.first },
        { label: data.tasks.first.labels.second },
      ],
    );
    await page.click(`text="${data.buttons.create.name}"`);
    await page.waitForLoadState();

    await expect(page.locator('body')).toContainText(data.tasks.first.name);

    const editLinkSelector = `tr:has-text("${data.tasks.first.name}") >> text="${data.links.edit.name}"`;
    await expect(page.locator(editLinkSelector)).toBeVisible();
    await page.click(editLinkSelector);
    await page.waitForLoadState();

    await expect(page).toHaveURL(/\/tasks\/\d+\/edit/);
    await expect(page.locator('#data_name')).toHaveValue(data.tasks.first.name);
    await expect(page.locator('#data_description')).toHaveValue(data.tasks.first.description);
    await expect(page.locator('#data_statusId option:checked')).toHaveText(data.tasks.first.status);
    await expect(page.locator('#data_executorId option:checked')).toHaveText(data.tasks.first.executor);

    await page.fill('text="Наименование"', data.tasks.second.name);
    await page.fill('text="Описание"', data.tasks.second.description);
    await page.selectOption('#data_statusId', { label: data.tasks.second.status });
    await page.selectOption('#data_executorId', { label: data.tasks.second.executor });
    await page.selectOption(
      '#data_labels',
      [
        { label: data.tasks.second.labels.first },
        { label: data.tasks.second.labels.second },
      ],
    );
    await page.click(`text="${data.buttons.edit.name}"`);
    await page.waitForLoadState();

    await expect(page).toHaveURL(data.links.tasks.url);
    await expect(page.locator('.alert')).toHaveText('Задача успешно изменена');
    await expect(page.locator('body')).not.toContainText(data.tasks.first.name);
    await expect(page.locator('body')).toContainText(data.tasks.second.name);
  });

  test('delete', async ({ page }) => {
    await page.goto(data.links.tasks.url);
    await page.click(`text="${data.links.newTask.name}"`);
    await page.waitForLoadState();

    await page.fill('text="Наименование"', data.tasks.first.name);
    await page.fill('text="Описание"', data.tasks.first.description);
    await page.selectOption('#data_statusId', { label: data.tasks.first.status });
    await page.selectOption('#data_executorId', { label: data.tasks.first.executor });
    await page.selectOption(
      '#data_labels',
      [
        { label: data.tasks.first.labels.first },
        { label: data.tasks.first.labels.second },
      ],
    );
    await page.click(`text="${data.buttons.create.name}"`);
    await page.waitForLoadState();

    await expect(page.locator('body')).toContainText(data.tasks.first.name);

    const deletebuttonSelector = `tr:has-text("${data.tasks.first.name}") >> text="${data.buttons.delete.name}"`;
    await expect(page.locator(deletebuttonSelector)).toBeVisible();
    page.on('dialog', (dialog) => {
      dialog.accept();
    });
    await page.click(deletebuttonSelector);
    await page.waitForLoadState();

    await expect(page).toHaveURL(data.links.tasks.url);
    await expect(page.locator('.alert')).toHaveText('Задача успешно удалена');
    await expect(page.locator('body')).not.toContainText(data.tasks.first.name);
  });

  test('task create with validation errors', async ({ page }) => {
    await page.goto(data.links.newTask.url);

    await page.click(`text="${data.buttons.create.name}"`);
    await page.waitForLoadState();

    await expect(page).toHaveCountValidationErrors(2);
    await expect(page).toHaveURL(data.links.tasks.url);
    await expect(page.locator('.alert')).toHaveText('Не удалось создать задачу');
  });

  test.afterEach(async () => {
    await knex.migrate.rollback();
  });

  test.afterAll(async () => {
    await app.close();
  });
});
