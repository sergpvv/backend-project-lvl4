// @ts-check

import fastify from 'fastify';

import init from '../server/plugin.js';
import { getTestData, prepareData } from './helpers/index.js';

describe('test users CRUD', () => {
  let app;
  let knex;
  let models;
  let cookie;

  const testData = getTestData();

  const signIn = async () => {
    const response = await app.inject({
      method: 'POST',
      url: app.reverse('session'),
      payload: {
        data: testData.users.existing,
      },
    });
    const [sessionCookie] = response.cookies;
    const { name, value } = sessionCookie;
    cookie = { [name]: value };
  };

  const signOut = async () => {
    await app.inject({
      method: 'DELETE',
      url: app.reverse('session'),
      cookies: cookie,
    });
  };

  const getName = async (id) => {
    const { name } = await models.taskStatus.query().findById(id);
    return name;
  };

  const findByName = async (name) => {
    const taskStatus = await models.taskStatus.query().findOne({ name });
    return taskStatus;
  };

  const findById = async (id) => {
    const taskStatus = await models.taskStatus.query().findById(id);
    return taskStatus;
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
      cookies: cookie,
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
      cookies: cookie,
    });

    expect(response.statusCode).toBe(200);
  });

  it('create', async () => {
    let response = await app.inject({
      method: 'GET',
      url: app.reverse('createTaskStatus'),
    });

    expect(response.statusCode).toBe(302);

    response = await app.inject({
      method: 'POST',
      url: app.reverse('createTaskStatus'),
      body: {
        data: {
          name: 'a',
        },
      },
    });

    expect(response.statusCode).toBe(302);
    expect(await findByName('a')).not.toBeDefined();

    await signIn();

    response = await app.inject({
      method: 'POST',
      url: app.reverse('createTaskStatus'),
      body: {
        data: {
          name: '',
        },
      },
      cookies: cookie,
    });

    expect(response.statusCode).toBe(200);
    expect(await findByName('')).not.toBeDefined();

    response = await app.inject({
      method: 'POST',
      url: app.reverse('createTaskStatus'),
      body: {
        data: {
          name: 'a',
        },
      },
      cookies: cookie,
    });

    expect(response.statusCode).toBe(302);
    expect(await findByName('a')).toBeDefined();
  });

  it('edit', async () => {
    await signIn();
    await app.inject({
      method: 'POST',
      url: app.reverse('createTaskStatus'),
      body: {
        data: {
          name: 'b',
        },
      },
      cookies: cookie,
    });

    const { id } = await findByName('b');

    await signOut();

    let response = await app.inject({
      method: 'PATCH',
      url: `/statuses/${id}`,
      body: {
        data: {
          name: 'c',
        },
      },
    });

    expect(response.statusCode).toBe(302);
    expect(await getName(id)).toBe('b');

    response = await app.inject({
      method: 'GET',
      url: `/statuses/${id}/edit`,
    });

    expect(response.statusCode).toBe(302);

    await signIn();

    response = await app.inject({
      method: 'GET',
      url: `/statuses/${id}/edit`,
      cookies: cookie,
    });

    expect(response.statusCode).toBe(200);

    response = await app.inject({
      method: 'PATCH',
      url: `/statuses/${id}`,
      body: {
        data: {
          name: 'c',
        },
      },
      cookies: cookie,
    });

    expect(response.statusCode).toBe(200);
    expect(await getName(id)).toBe('c');
  });

  it('delete', async () => {
    await signIn();

    await app.inject({
      method: 'POST',
      url: app.reverse('createTaskStatus'),
      body: {
        data: {
          name: 'd',
        },
      },
      cookies: cookie,
    });

    const { id } = await findByName('d');

    await signOut();

    let response = await app.inject({
      method: 'DELETE',
      url: `/statuses/${id}`,
    });

    expect(response.statusCode).toBe(302);
    expect(await findById(id)).toBeDefined();

    await signIn();

    response = await app.inject({
      method: 'DELETE',
      url: `/statuses/${id}`,
      cookies: cookie,
    });

    expect(response.statusCode).toBe(200);
    expect(await findById(id)).not.toBeDefined();
  });

  afterEach(async () => {
    await signOut();
  });

  afterAll(async () => {
    await app.close();
  });
});
