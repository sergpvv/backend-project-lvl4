// @ts-check
/* eslint-disable jest/no-done-callback */
/* eslint no-restricted-syntax: ["off", "ForOfStatement"] */
/* eslint-disable no-await-in-loop */

import { test, expect } from '@playwright/test';
import init from '@hexlet/code';
import fastify from 'fastify';
import {
  getUsers, getTestData, loadUsers, runServer,
} from './helpers/index.js';

test.describe('test users CRUD', () => {
  let app;
  let knex;
  const users = getUsers();
  const data = getTestData();

  test.beforeAll(async () => {
    app = fastify({ logger: true });
    app = await init(app);
    knex = app.objection.knex;
    await runServer(app);
  });

  test.beforeEach(async ({ context }) => {
    await knex.migrate.latest();
    await loadUsers(app);
    await context.setDefaultTimeout(3000);
    await context.clearCookies();
  });

  test('index', async ({ page }) => {
    await page.goto(data.links.root.url);
    await page.click(`text="${data.links.users.name}"`);
    await page.waitForLoadState();

    await expect(page).toHaveURL(data.links.users.url);
    for (const user of users) {
      await expect(page.locator('body')).toContainText(`${user.firstName} ${user.lastName}`);
      await expect(page.locator('body')).toContainText(user.email);
    }
  });

  test('create', async ({ page }) => {
    await page.goto(data.links.root.url);
    await page.click(`text="${data.links.signUp.name}"`);
    await page.waitForLoadState();

    await expect(page).toHaveURL(data.links.signUp.url);

    await page.fill('text="Имя"', data.users.new.firstName);
    await page.fill('text="Фамилия"', data.users.new.lastName);
    await page.fill('text="Email"', data.users.new.email);
    await page.fill('text="Пароль"', data.users.new.password);
    await page.click(`text="${data.buttons.save.name}"`);
    await page.waitForLoadState();

    await expect(page).toHaveURL(data.links.root.url);
    await expect(page.locator('.alert')).toHaveText('Пользователь успешно зарегистрирован');

    await page.click(`text="${data.links.users.name}"`);
    await page.waitForLoadState();
    await expect(page.locator('body')).toContainText(data.users.new.fullName);
  });

  test('update', async ({ page }) => {
    await page.goto(data.links.signIn.url);

    await page.fill('text="Email"', data.users.existing.email);
    await page.fill('text="Пароль"', data.users.existing.password);
    await page.click(`text="${data.buttons.signIn.name}"`);
    await page.waitForLoadState();

    await page.click(`text="${data.links.users.name}"`);
    await page.waitForLoadState();

    const editLinkSelector = `tr:has-text("${data.users.existing.fullName}") >> text="${data.links.edit.name}"`;
    await expect(page.locator(editLinkSelector)).toBeVisible();
    await page.click(editLinkSelector);
    await page.waitForLoadState();

    await expect(page).toHaveURL(/\/users\/\d+\/edit/);
    await expect(page.locator('#data_firstName')).toHaveValue(data.users.existing.firstName);
    await expect(page.locator('#data_lastName')).toHaveValue(data.users.existing.lastName);
    await expect(page.locator('#data_email')).toHaveValue(data.users.existing.email);
    await expect(page.locator('#data_password')).toHaveValue('');

    await page.fill('text="Имя"', data.users.new.firstName);
    await page.fill('text="Фамилия"', data.users.new.lastName);
    await page.fill('text="Email"', data.users.new.email);
    await page.fill('text="Пароль"', data.users.new.password);
    await page.click(`text="${data.buttons.edit.name}"`);
    await page.waitForLoadState();

    await expect(page).toHaveURL(data.links.users.url);
    await expect(page.locator('.alert')).toHaveText('Пользователь успешно изменён');
    await expect(page.locator('body')).not.toContainText(data.users.existing.fullName);
    await expect(page.locator('body')).not.toContainText(data.users.existing.email);
    await expect(page.locator('body')).toContainText(data.users.new.fullName);
    await expect(page.locator('body')).toContainText(data.users.new.email);
  });

  test('delete', async ({ page }) => {
    await page.goto(data.links.signIn.url);

    await page.fill('text="Email"', data.users.existing.email);
    await page.fill('text="Пароль"', data.users.existing.password);
    await page.click(`text="${data.buttons.signIn.name}"`);
    await page.waitForLoadState();

    await page.click(`text="${data.links.users.name}"`);
    await page.waitForLoadState();

    const deletebuttonSelector = `tr:has-text("${data.users.existing.fullName}") >> text="${data.buttons.delete.name}"`;
    await expect(page.locator(deletebuttonSelector)).toBeVisible();
    page.on('dialog', (dialog) => {
      dialog.accept();
    });
    await page.click(deletebuttonSelector);
    await page.waitForLoadState();

    await expect(page).toHaveURL(data.links.users.url);
    await expect(page.locator('.alert')).toHaveText('Пользователь успешно удалён');
    await expect(page.locator('body')).not.toContainText(data.users.existing.fullName);
    await expect(page.locator('body')).not.toContainText(data.users.existing.email);
    await expect(page.locator(`text="${data.buttons.signOut.name}"`)).toBeHidden();
    await expect(page.locator(`text="${data.links.signIn.name}"`)).toBeVisible();
  });

  test('user create with validation errors', async ({ page }) => {
    await page.goto(data.links.signUp.url);

    await page.click(`text="${data.buttons.save.name}"`);
    await page.waitForLoadState();

    await expect(page).toHaveCountValidationErrors(4);
    await expect(page).toHaveURL(data.links.users.url);
    await expect(page.locator('.alert')).toHaveText('Не удалось зарегистрировать');
  });

  test.afterEach(async () => {
    await knex.migrate.rollback();
  });

  test.afterAll(async () => {
    await app.close();
  });
});
