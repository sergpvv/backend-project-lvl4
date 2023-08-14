// @ts-check

import _ from 'lodash';
import fastify from 'fastify';

import init from '../server/plugin.js';
import encrypt from '../server/lib/secure.js';
import { getRandom, getTestData, prepareData } from './helpers/index.js';

describe('test users CRUD', () => {
  let app;
  let knex;
  let models;
  const testData = getTestData();
  // console.log('!--->testData:', JSON.stringify(testData, null, '  '));
  const signIn = async (user) => await app.inject({
    method: 'POST',
    url: app.reverse('createNewUser'),
    payload: {
      data: user,
    },
  });
  const logIn = async (user) => {
    const response = await app.inject({
      method: 'POST',
      url: app.reverse('session'),
      payload: {
        data: user,
      },
    });
    const [sessionCookie] = response.cookies;
    const { name, value } = sessionCookie;
    return { [name]: value };
  };
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

    // const users = await models.user.query();
    // console.log('!--->prepared data:', JSON.stringify(users, null, '  '));
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
    const user = testData.users.new;
    const response = await signIn(user);

    expect(response.statusCode).toBe(302);

    const expected = {
      ..._.omit(user, 'password'),
      passwordDigest: encrypt(user.password),
    };

    expect(await models.user.query().findOne({ email: user.email })).toMatchObject(expected);
  });

  it('edit', async () => {
    const user = await models.user.query().findOne({ email: testData.users.existing.email });
    const { id } = user;
    const response = await app.inject({
      method: 'GET',
      url: `/users/${id}/edit`,
    });

    expect(response.statusCode).toBe(302);

    const cookie = await logIn(testData.users.existing);
    const responseEditUser = await app.inject({
      method: 'GET',
      url: `/users/${id}/edit`,
      cookies: cookie,
    });

    expect(responseEditUser.statusCode).toBe(200);

    const userKeys = _.keys(testData.users.existing);
    const { length } = userKeys;
    const key = userKeys[getRandom(length)];
    const editedUser = {
      ..._.omit(testData.users.existing, key),
      [key]: testData.users.new[key],
    };
    const responsePatchUser = await app.inject({
      method: 'PATCH',
      url: `/users/${id}`,
      body: {
        data: editedUser,
      },
      cookies: cookie,
    });

    expect(responsePatchUser.statusCode).toBe(200);

    const expected = {
      ..._.omit(editedUser, 'password'),
      passwordDigest: encrypt(editedUser.password),
    };
    expect(await models.user.query().findById(id)).toMatchObject(expected);
  });

  it('delete', async () => {
    const { id } = await models.user.query().findOne({ email: testData.users.existing.email });
    const response = await app.inject({
      method: 'DELETE',
      url: `/users/${id}`,
    });

    expect(response.statusCode).toBe(302);
    expect(await models.user.query().findById(id)).toBeDefined();

    const user = testData.users.new;
    await signIn(user);
    const cookie = await logIn(user);
    const { id: newId } = await models.user.query().findOne({ email: user.email });
    const responseDeleteUser = await app.inject({
      method: 'DELETE',
      url: `/users/${id}`,
      cookies: cookie,
    });

    expect(responseDeleteUser.statusCode).toBe(200);
    expect(await models.user.query().findById(id)).toBeDefined();

    const responseDeleteNewUser = await app.inject({
      method: 'DELETE',
      url: `/users/${newId}`,
      cookies: cookie,
    });
    expect(responseDeleteNewUser.statusCode).toBe(200);
    expect(await models.user.query().findById(newId)).not.toBeDefined();
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
