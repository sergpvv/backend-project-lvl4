// @ts-check

import _ from 'lodash';
import fastify from 'fastify';

import init from '../server/plugin.js';
import encrypt from '../server/lib/secure.cjs';
import { getTestData, prepareData } from './helpers/index.js';

describe('test users CRUD', () => {
  let app;
  let knex;
  let models;
  const testData = getTestData();
  console.log('!--->tesrData:', JSON.stringify(testData, null, '  '));
  beforeAll(async () => {
    app = fastify({
      exposeHeadRoutes: false,
      logger: { target: 'pino-pretty' },
    });
    await init(app);
    knex = app.objection.knex;
    models = app.objection.models;

    // TODO: пока один раз перед тестами
    // тесты не должны зависеть друг от друга
    // перед каждым тестом выполняем миграции
    // и заполняем БД тестовыми данными
    await knex.migrate.latest();
    await prepareData(app);
  });

  beforeEach(async () => {
  });

  it('index', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('users'),
    });

    expect(response.statusCode).toBe(200);
  });

  it('new', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('newUser'),
    });

    expect(response.statusCode).toBe(200);
  });

  it('create', async () => {
    const params = testData.users.new;
    // console.log('!--->params:', JSON.stringify(params, null, '  '));
    // console.log('!--->app.reverse(\'createNewUser\'):', app.reverse('createNewUser'));
    const response = await app.inject({
      method: 'POST',
      url: app.reverse('createNewUser'),
      payload: {
        data: params,
      },
    });

    expect(response.statusCode).toBe(302);
    const expected = {
      ..._.omit(params, 'password'),
      passwordDigest: encrypt(params.password),
    };
    // console.log('!--->expected:', JSON.stringify(expected, null, '  '));
    const user = await models.user.query().findOne({ email: params.email }).debug();
    // console.log('!--->user:', JSON.stringify(user, null, '  '));
    expect(user).toMatchObject(expected);
  });

  it('edit', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('newUser'),
    });

    expect(response.statusCode).toBe(200);
  });

  it('patch', async () => {
    const user = testData.users.existing;
    const editedUser = testData.users.new;
    const response = await app.inject({
      method: 'PATCH',
      url: app.reverse('patchUser'),
      payload: {
        data: editedUser,
        params: {
          id: 0,
        },
      },
    });
    expect(response.statusCode).toBe(302);
    expect(user).toMatchObject(editedUser);
  });

  afterEach(async () => {
    // Пока Segmentation fault: 11
    // после каждого теста откатываем миграции
    // await knex.migrate.rollback();
  });

  afterAll(async () => {
    await app.close();
  });
});
