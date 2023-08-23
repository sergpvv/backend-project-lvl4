import fastify from 'fastify';

import init from '../server/plugin.js';
import { getTestData, prepareData } from './helpers/index.js';

describe('test tasks CRUD', () => {
  let app;
  let knex;
  let models;
  let cookies;
  let testData;
  let makeRequest;
  let signIn;
  let makeAuthedRequest;
  let findByName;
  let findById;

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

    makeRequest = (method = 'get', url = '/tasks', data = null) => app.inject({
      method,
      url: url.startsWith('/') ? url : app.reverse(url),
      payload: { data },
    });

    signIn = async () => {
      const response = await makeRequest('post', '/session', testData.users.existing);
      const [sessionCookie] = response.cookies;
      const { name, value } = sessionCookie;
      cookies = { [name]: value };
    };

    makeAuthedRequest = (method = 'get', url = '/tasks', data = null) => app.inject({
      method,
      url: url.startsWith('/') ? url : app.reverse(url),
      payload: { data },
      //  body: { data },
      cookies,
    });

    findByName = (name) => models.task.query().findOne({ name });

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
    let response = await makeRequest('post', 'createTask', task);
    expect(response.statusCode).toBe(302);
    const { name, ...properties } = task;
    expect(await findByName(name)).not.toBeDefined();

    await signIn();
    response = await makeAuthedRequest('post', 'createTask', testData.tasks.exist);
    expect(response.statusCode).toBe(200);

    const incorrectTask = {
      name: '',
      ...properties,
    };
    response = await makeAuthedRequest('post', 'createTask', incorrectTask);
    expect(response.statusCode).toBe(200);
    expect(await findByName('')).not.toBeDefined();

    response = await makeAuthedRequest('post', 'createTask', task);
    expect(response.statusCode).toBe(302);
    const { description } = await findByName(name);
    expect(description).toBe(task.description);
  });

  it('edit', async () => {
    const task = testData.tasks.existing;
    const { id } = await findByName(task.name);
    let response = await makeRequest('get', `/tasks/${id}/edit`);
    expect(response.statusCode).toBe(302);

    await signIn();
    response = await makeAuthedRequest('get', `/tasks/${id}/edit`);
    expect(response.statusCode).toBe(200);

    response = await makeAuthedRequest('patch', `/tasks/${id}`, { name: '' });
    expect(response.statusCode).toBe(200);
    const expected = await findById(id);
    expect(task.name).toBe(expected.name);

    const { name } = testData.tasks.new;
    // const newNameTask = { ...task, name };
    // console.log('!------------>task:', JSON.stringify(task, null, '  '));
    // console.log('!------------>newNameTask:', JSON.stringify(newNameTask, null, '  '));
    response = await makeAuthedRequest('patch', `/tasks/${id}`, { name });
    // console.log('!------------------------->response:', response);
    expect(response.statusCode).toBe(302);
    const editedTask = await findById(id);
    expect(name).toBe(editedTask.name);
  });

  afterEach(async () => {
    await makeAuthedRequest('delete', '/session');
  });

  afterAll(async () => {
    await app.close();
  });
});
