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
  let findLabel;

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

    findLabel = (id) => models.label.query().findById(id);
  });

  it('index', async () => {
    let response = await makeRequest();
    expect(response.statusCode).toBe(302);

    await signIn();
    response = await makeAuthedRequest();
    expect(response.statusCode).toBe(200);
  });

  it('filter', async () => {
    await signIn();
    const response = await makeAuthedRequest().query({
      status: testData.statuses.existingId,
      executor: testData.users.existingId,
      label: testData.labels.existingId,
      isCreatorUser: 'on',
    });
    expect(response.body).toMatch(new RegExp(testData.tasks.existing.name));
    expect(response.body).toMatch(new RegExp(testData.statuses.existing.name));
    expect(response.body).toMatch(new RegExp(testData.users.existing.firstName));
    expect(response.body).toMatch(new RegExp(testData.users.existing.lastName));
  });

  it('new', async () => {
    let response = await makeRequest('get', 'newTask');
    expect(response.statusCode).toBe(302);

    await signIn();
    response = await makeAuthedRequest('get', 'newTask');
    expect(response.statusCode).toBe(200);
  });

  it('card', async () => {
    const id = testData.tasks.existingId;
    const path = `/tasks/${id}`;
    let response = await makeRequest('get', path);
    expect(response.statusCode).toBe(302);

    await signIn();
    response = await makeAuthedRequest('get', path);
    expect(response.statusCode).toBe(200);
  });

  it('create', async () => {
    const task = testData.tasks.new;
    const { name } = testData.tasks.new;
    const labelId = testData.labels.existingId;

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

    response = await makeAuthedRequest('post', 'tasks', { ...task, labels: labelId });
    expect(response.statusCode).toBe(302);
    const insertedTask = await findByName(name);
    expect(insertedTask).toMatchObject(task);
    const expectedLabel = await findLabel(labelId);
    expect(await insertedTask.$relatedQuery('labels')).toMatchObject(expectedLabel);
  });

  it('edit', async () => {
    const task = testData.tasks.editing;
    const { existingId: id } = testData.tasks;
    const labelId = testData.labels.existingId;
    const path = `/tasks/${id}`;

    let response = await makeRequest('get', `${path}/edit`);
    expect(response.statusCode).toBe(302);

    await signIn();
    response = await makeAuthedRequest('get', `${path}/edit`);
    expect(response.statusCode).toBe(200);

    response = await makeAuthedRequest('patch', path, { ...task, name: '' });
    expect(response.statusCode).toBe(422);
    expect(await findById(id)).toMatchObject(testData.tasks.existing);

    response = await makeAuthedRequest('patch', path, { ...task, statusId: '' });
    expect(response.statusCode).toBe(422);
    expect(await findById(id)).toMatchObject(testData.tasks.existing);

    response = await makeAuthedRequest('patch', path, task);
    expect(response.statusCode).toBe(302);
    const editedTask = await findById(id);
    expect(editedTask).toMatchObject(task);
    expect(await editedTask.$relatedQuery('labels')).not.toBeDefined();

    response = await makeAuthedRequest('patch', path, { ...task, labels: labelId });
    const taskWithLabel = await findById(id);
    const expectedLabel = await findLabel(labelId);
    expect(await taskWithLabel.$relatedQuery('labels')).toMatchObject(expectedLabel);
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
