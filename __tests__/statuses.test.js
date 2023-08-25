// @ts-check

import fastify from 'fastify';

import init from '../server/plugin.js';
import { getTestData, prepareData } from './helpers/index.js';

describe('test statuses CRUD', () => {
  let app;
  let knex;
  let models;
  let cookie;
  let testData;
  let makeRequest;
  let signIn;
  let makeAuthedRequest;
  let signOut;
  let findById;
  let findBy;
  let findByName;

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

    makeRequest = (method = 'get', url = 'statuses', data = null, cookies = null) => {
      const options = {
        method,
        url: url.startsWith('/') ? url : app.reverse(url),
      };
      if (data) options.payload = { data };
      if (cookies) options.cookies = cookies;
      return app.inject(options);
    };

    signIn = async (user = null) => {
      const response = await makeRequest('post', 'session', user ?? testData.users.existing);
      const [sessionCookie] = response.cookies;
      const { name, value } = sessionCookie;
      cookie = { [name]: value };
    };

    makeAuthedRequest = (method, url, data = null) => makeRequest(method, url, data, cookie);

    signOut = () => makeAuthedRequest('delete', 'session');

    findById = (id) => models.taskStatus.query().findById(id);

    findBy = (property) => models.taskStatus.query().findOne(property);

    findByName = (name) => models.taskStatus.query().findOne({ name });
  });

  it('index', async () => {
    let response = await makeRequest();
    expect(response.statusCode).toBe(302);

    await signIn();
    response = await makeAuthedRequest();
    expect(response.statusCode).toBe(200);
  });

  it('new', async () => {
    let response = await makeRequest('get', 'newTaskStatus');
    expect(response.statusCode).toBe(302);

    await signIn();
    response = await makeAuthedRequest('get', 'newTaskStatus');
    expect(response.statusCode).toBe(200);
  });

  it('create', async () => {
    const newTaskStatus = testData.statuses.new;
    let response = await makeRequest('post', 'createTaskStatus', newTaskStatus);
    expect(response.statusCode).toBe(302);
    expect(await findBy(newTaskStatus)).not.toBeDefined();

    await signIn();
    response = await makeAuthedRequest('post', 'createTaskStatus', { name: '' });
    expect(response.statusCode).toBe(200);
    expect(await findByName('')).not.toBeDefined();

    response = await makeAuthedRequest('post', 'createTaskStatus', newTaskStatus);
    expect(response.statusCode).toBe(302);
    const createdTaskStatus = await findBy(newTaskStatus);
    expect(createdTaskStatus).toMatchObject(newTaskStatus);
  });

  it('edit', async () => {
    const taskStatus = testData.statuses.existing;
    const id = testData.statuses.existingId;
    const urlEdit = `/statuses/${id}/edit`;
    let response = await makeRequest('get', urlEdit);
    expect(response.statusCode).toBe(302);

    const editedTaskStatus = testData.statuses.editing;
    const urlPatch = `/statuses/${id}`;
    response = await makeRequest('patch', urlPatch, editedTaskStatus);
    expect(response.statusCode).toBe(302);
    expect(await findById(id)).toMatchObject(taskStatus);

    await signIn();
    response = await makeAuthedRequest('get', urlEdit);
    expect(response.statusCode).toBe(200);

    response = await makeAuthedRequest('patch', urlPatch, { name: '' });
    expect(response.statusCode).toBe(200);
    expect(await findById(id)).toMatchObject(taskStatus);

    response = await makeAuthedRequest('patch', urlPatch, editedTaskStatus);
    expect(response.statusCode).toBe(302);
    expect(await findById(id)).toMatchObject(editedTaskStatus);
  });

  it('delete', async () => {
    const { id } = await findBy(testData.statuses.deletable);
    let response = await makeRequest('delete', `/statuses/${id}`);
    expect(response.statusCode).toBe(302);
    expect(await findById(id)).toBeDefined();

    await signIn();
    response = await makeAuthedRequest('delete', `/statuses/${id}`);
    expect(response.statusCode).toBe(302);
    expect(await findById(id)).not.toBeDefined();

    const { existingId } = testData.statuses;
    response = await makeAuthedRequest('delete', `/statuses/${existingId}`);
    expect(response.statusCode).toBe(302);
    expect(await findById(existingId)).toBeDefined();
  });

  afterEach(async () => {
    await signOut();
  });

  afterAll(async () => {
    await app.close();
  });
});
