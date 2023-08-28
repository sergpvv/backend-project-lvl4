import fastify from 'fastify';

import init from '../server/plugin.js';
import { getTestData, prepareData } from './helpers/index.js';

describe('test tasks CRUD', () => {
  let app;
  let knex;
  let models;
  let cookie;
  let testData;
  let makeRequest;
  let signIn;
  let makeAuthedRequest;
  let signOut;
  let findByName;
  let findById;
  let findBy;

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
    testData = getTestData();

    makeRequest = (method = 'get', url = 'tasks', data = null, cookies = null) => {
      const options = {
        method,
        url: url.startsWith('/') ? url : app.reverse(url),
      };
      if (data) options.payload = { data };
      if (cookies) options.cookies = cookies;
      return app.inject(options);
    };

    signIn = async (user = null) => {
      const response = await makeRequest('post', '/session', user ?? testData.users.existing);
      const [sessionCookie] = response.cookies;
      const { name, value } = sessionCookie;
      cookie = { [name]: value };
    };

    makeAuthedRequest = (method, url, data = null) => makeRequest(method, url, data, cookie);

    signOut = () => makeAuthedRequest('delete', 'session');

    findBy = (property) => models.task.query().findOne(property);

    findByName = (name) => findBy({ name });

    findById = (id) => models.task.query().findById(id);
  });

  it('index', async () => {
    let response = await makeRequest();
    expect(response.statusCode).toBe(302);

    await signIn();
    response = await makeAuthedRequest();
    expect(response.statusCode).toBe(200);
  });

  it('new', async () => {
    let response = await makeRequest('get', 'newTask');
    expect(response.statusCode).toBe(302);

    await signIn();
    response = await makeAuthedRequest('get', 'newTask');
    expect(response.statusCode).toBe(200);
  });

  it('create', async () => {
    const task = testData.tasks.new;
    const { name } = testData.tasks.new;
    let response = await makeRequest('post', 'tasks', task);
    expect(response.statusCode).toBe(302);
    expect(await findBy({ name })).not.toBeDefined();

    await signIn();
    response = await makeAuthedRequest('post', 'tasks', testData.tasks.existing);
    expect(response.statusCode).toBe(422);

    response = await makeAuthedRequest('post', 'tasks', { ...task, name: '' });
    expect(response.statusCode).toBe(422);
    expect(await findByName('')).not.toBeDefined();

    response = await makeAuthedRequest('post', 'tasks', { ...task, statusId: '' });
    expect(response.statusCode).toBe(422);

    response = await makeAuthedRequest('post', 'tasks', task);
    expect(response.statusCode).toBe(302);
    const { description } = await findByName(name);
    expect(description).toBe(task.description);
  });

  it('edit', async () => {
    const task = testData.tasks.editing;
    const { existingId: id } = testData.tasks;
    let response = await makeRequest('get', `/tasks/${id}/edit`);
    expect(response.statusCode).toBe(302);

    await signIn();
    response = await makeAuthedRequest('get', `/tasks/${id}/edit`);
    expect(response.statusCode).toBe(200);

    response = await makeAuthedRequest('patch', `/tasks/${id}`, { ...task, name: '' });
    expect(response.statusCode).toBe(422);
    expect(await findById(id)).toMatchObject(testData.tasks.existing);

    response = await makeAuthedRequest('patch', `/tasks/${id}`, { ...task, statusId: '' });
    expect(response.statusCode).toBe(422);
    expect(await findById(id)).toMatchObject(testData.tasks.existing);

    response = await makeAuthedRequest('patch', `/tasks/${id}`, task);
    expect(response.statusCode).toBe(302);
    expect(await findById(id)).toMatchObject(task);
  });

  it('delete', async () => {
    const { existingId: id } = testData.tasks;
    const options = ['delete', `/tasks/${id}`];
    let response = await makeRequest(...options);
    expect(response.statusCode).toBe(302);
    expect(await findById(id)).toBeDefined();

    await signIn(testData.users.new);
    response = await makeAuthedRequest(...options);
    expect(response.statusCode).toBe(302);
    expect(await findById(id)).toBeDefined();

    await signOut();
    await signIn();
    response = await makeAuthedRequest(...options);
    expect(response.statusCode).toBe(302);
    expect(await findById(id)).not.toBeDefined();
  });

  afterEach(async () => {
    await signOut();
  });

  afterAll(async () => {
    await app.close();
  });
});
