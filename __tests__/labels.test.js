// @ts-check

import fastify from 'fastify';

import init from '../server/plugin.js';
import { getTestData, prepareData } from './helpers/index.js';

describe('test labels CRUD', () => {
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

    makeRequest = (method = 'get', url = 'labels', data = null, cookies = null) => {
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

    findById = (id) => models.label.query().findById(id);

    findBy = (property) => models.label.query().findOne(property);

    findByName = (name) => models.label.query().findOne({ name });
  });

  it('index', async () => {
    let response = await makeRequest();
    expect(response.statusCode).toBe(302);

    await signIn();
    response = await makeAuthedRequest();
    expect(response.statusCode).toBe(200);
  });

  it('new', async () => {
    let response = await makeRequest('get', 'newLabel');
    expect(response.statusCode).toBe(302);

    await signIn();
    response = await makeAuthedRequest('get', 'newLabel');
    expect(response.statusCode).toBe(200);
  });

  it('create', async () => {
    const newLabel = testData.labels.new;
    let response = await makeRequest('post', 'createLabel', newLabel);
    expect(response.statusCode).toBe(302);
    expect(await findBy(newLabel)).not.toBeDefined();

    await signIn();
    response = await makeAuthedRequest('post', 'createLabel', { name: '' });
    expect(response.statusCode).toBe(422);
    expect(await findByName('')).not.toBeDefined();

    response = await makeAuthedRequest('post', 'createLabel', newLabel);
    expect(response.statusCode).toBe(302);
    expect(await findBy(newLabel)).toMatchObject(newLabel);
  });

  it('edit', async () => {
    const label = testData.labels.existing;
    const id = testData.labels.existingId;
    const urlEdit = `/labels/${id}/edit`;
    let response = await makeRequest('get', urlEdit);
    expect(response.statusCode).toBe(302);

    const editedLabel = testData.labels.editing;
    const urlPatch = `/labels/${id}`;
    response = await makeRequest('patch', urlPatch, editedLabel);
    expect(response.statusCode).toBe(302);
    expect(await findById(id)).toMatchObject(label);

    await signIn();
    response = await makeAuthedRequest('get', urlEdit);
    expect(response.statusCode).toBe(200);

    response = await makeAuthedRequest('patch', urlPatch, { name: '' });
    expect(response.statusCode).toBe(422);
    expect(await findById(id)).toMatchObject(label);

    response = await makeAuthedRequest('patch', urlPatch, editedLabel);
    expect(response.statusCode).toBe(302);
    expect(await findById(id)).toMatchObject(editedLabel);
  });

  it('delete', async () => {
    const { id } = await findBy(testData.labels.deletable);
    let response = await makeRequest('delete', `/labels/${id}`);
    expect(response.statusCode).toBe(302);
    expect(await findById(id)).toBeDefined();

    await signIn();
    response = await makeAuthedRequest('delete', `/labels/${id}`);
    expect(response.statusCode).toBe(302);
    expect(await findById(id)).not.toBeDefined();

    const { existingId } = testData.labels;
    response = await makeAuthedRequest('delete', `/labels/${existingId}`);
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
