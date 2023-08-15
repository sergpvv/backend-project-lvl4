// @ts-check

import fastify from 'fastify';

import init from '../server/plugin.js';
import { getTestData, prepareData } from './helpers/index.js';

describe('test users CRUD', () => {
  let app;
  let knex;
  let models;
  let id;
  const testData = getTestData();
  const signIn = async () => {
    await app.inject({
      method: 'POST',
      url: app.reverse('session'),
      payload: {
        data: testData.users.existing,
      },
    });
  };

  const signOut = async () => {
    await app.inject({
      method: 'DELETE',
      url: app.reverse('deleteSession'),
    });
  };

  beforeAll(async () => {
    app = fastify({
      exposeHeadRoutes: false,
      logger: { target: 'pino-pretty' },
    });
    await init(app);
    knex = app.objection.knex;
    models = app.objection.models;
    await knex.migrate.latest();
    await prepareData(app);
  });

  beforeEach(async () => {
    models.taskStatus.query().insert({ name: 'a' });
    const taskStatus = models.taskStatus.query().findOne({ name: 'a' });
    id = taskStatus.id;
  });

  it('index', async () => {
    let response = await app.inject({
      method: 'GET',
      url: app.reverse('statuses'),
    });

    expect(response.statusCode).toBe(302);

    await signIn();
    response = await app.inject({
      method: 'GET',
      url: app.reverse('statuses'),
    });

    expect(response.statusCode).toBe(200);
  });

  it('new', async () => {
    let response = await app.inject({
      method: 'GET',
      url: app.reverse('newTaskStatus'),
    });

    expect(response.statusCode).toBe(302);

    await signIn();

    response = await app.inject({
      method: 'GET',
      url: app.reverse('newTaskStatus'),
    });

    expect(response.statusCode).toBe(200);
  });

  it('create', async () => {
    await signIn();

    const response = await app.inject({
      method: 'POST',
      url: app.reverse('createTaskStatus'),
      body: {
        data: {
          name: 'b',
        },
      },
    });

    expect(response.statusCode).toBe(200);

    expect(await models.statuses.query().findOne({ name: 'b' })).toBeDefined();
  });

  it('edit', async () => {
    let response = await app.inject({
      method: 'GET',
      url: `/statuses/${id}/edit`,
    });

    expect(response.statusCode).toBe(302);

    await signIn();

    response = await app.inject({
      method: 'GET',
      url: `/statuses/${id}/edit`,
    });

    expect(response.statusCode).toBe(200);

    response = await app.inject({
      method: 'PATCH',
      url: `/statuses/${id}`,
      body: {
        data: {
          name: 'b',
        },
      },
    });

    expect(response.statusCode).toBe(200);

    const { name } = await models.statuses.query().findById(id);

    expect(name).toBe('b');
  });

  it('delete', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: `/statuses/${id}`,
    });

    expect(response.statusCode).toBe(200);

    expect(await models.statuses.query().findById(id)).not.toBeDefined();
  });

  afterEach(async () => {
    const taskStatus = await models.taskStatus.query().findById(id);
    if (!taskStatus) return;
    await taskStatus.$query().delete();
  });

  afterAll(async () => {
    await app.close();
  });
});
