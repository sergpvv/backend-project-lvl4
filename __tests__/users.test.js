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
  let cookies;

  const testData = getTestData();
  console.log('!--->testData:', JSON.stringify(testData, null, '  '));

  const signUp = (data) => app.inject({
    method: 'POST',
    url: app.reverse('createNewUser'),
    payload: { data },
  });

  const signIn = async (data) => {
    const response = await app.inject({
      method: 'POST',
      url: app.reverse('session'),
      payload: { data },
    });
    const [sessionCookie] = response.cookies;
    const { name, value } = sessionCookie;
    cookies = { [name]: value };
  };

  const signOut = () => app.inject({
    method: 'DELETE',
    url: app.reverse('session'),
    cookies,
  });

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

    const users = await models.user.query();
    console.log('!--->prepared users:', JSON.stringify(users, null, '  '));
    const tasks = await models.task.query();
    console.log('!--->prepared tasks:', JSON.stringify(tasks, null, '  '));
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
    const response = await signUp(user);

    expect(response.statusCode).toBe(302);

    const expected = {
      ..._.omit(user, 'password'),
      passwordDigest: encrypt(user.password),
    };

    expect(await models.user.query().findOne({ email: user.email })).toMatchObject(expected);
  });

  it('edit', async () => {
    const user = testData.users.existing;
    const { id } = await models.user.query().findOne({ email: user.email });
    const response = await app.inject({
      method: 'GET',
      url: `/users/${id}/edit`,
    });

    expect(response.statusCode).toBe(302);

    await signIn(user);
    const responseEditUser = await app.inject({
      method: 'GET',
      url: `/users/${id}/edit`,
      cookies,
    });

    expect(responseEditUser.statusCode).toBe(200);

    const keys = _.keys(user);
    const { length } = keys;
    const key = keys[getRandom(length)];
    const editedUser = {
      ..._.omit(user, key),
      [key]: testData.users.new[key],
    };
    const responsePatchUser = await app.inject({
      method: 'PATCH',
      url: `/users/${id}`,
      body: {
        data: editedUser,
      },
      cookies,
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

    await signIn(testData.users.existing);
    const responseDeleteUserWithRelatedTask = await app.inject({
      method: 'DELETE',
      url: `/users/${id}`,
      cookies,
    });

    expect(responseDeleteUserWithRelatedTask.statusCode).toBe(200);
    expect(await models.user.query().findById(id)).toBeDefined();

    await signOut();

    const user = testData.users.new;
    await signUp(user);
    await signIn(user);
    const { id: newId } = await models.user.query().findOne({ email: user.email });
    const responseDeleteUser = await app.inject({
      method: 'DELETE',
      url: `/users/${id}`,
      cookies,
    });

    expect(responseDeleteUser.statusCode).toBe(200);
    expect(await models.user.query().findById(id)).toBeDefined();

    const responseDeleteNewUser = await app.inject({
      method: 'DELETE',
      url: `/users/${newId}`,
      cookies,
    });
    expect(responseDeleteNewUser.statusCode).toBe(200);
    expect(await models.user.query().findById(newId)).not.toBeDefined();
  });

  afterEach(async () => {
    // Пока Segmentation fault: 11
    // после каждого теста откатываем миграции
    // await knex.migrate.rollback();
    await signOut();
  });

  afterAll(async () => {
    await app.close();
  });
});
