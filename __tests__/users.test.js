// @ts-check

import _ from 'lodash';
import fastify from 'fastify';

import init from '../server/plugin.js';
import encrypt from '../server/lib/secure.js';
import { getTestData, prepareData, userPropertyNamesSheet } from './helpers/index.js';

describe('test users CRUD', () => {
  let app;
  let knex;
  let models;
  let cookie;
  let testData;
  let makeRequest;
  let signUp;
  let signIn;
  let makeAuthedRequest;
  let signOut;
  let findById;
  let findBy;
  let findByEmail;

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

    makeRequest = (method = 'get', url = 'users', data = null, cookies = null) => {
      const options = {
        method,
        url: url.startsWith('/') ? url : app.reverse(url),
      };
      if (data) options.payload = { data };
      if (cookies) options.cookies = cookies;
      return app.inject(options);
    };

    signUp = (user) => makeRequest('post', 'users', user);

    signIn = async (user = null) => {
      const response = await makeRequest('post', 'session', user ?? testData.users.existing);
      const [sessionCookie] = response.cookies;
      const { name, value } = sessionCookie;
      cookie = { [name]: value };
    };

    makeAuthedRequest = (method, url, data = null) => makeRequest(method, url, data, cookie);

    signOut = () => makeAuthedRequest('delete', 'session');

    findById = (id) => models.user.query().findById(id);

    findBy = (property) => models.user.query().findOne(property);

    findByEmail = (email) => findBy({ email });
/*
    console.log('!--->testData:', JSON.stringify(testData, null, '  '));
    const users = await models.user.query();
    console.log('!--->prepared users:', JSON.stringify(users, null, '  '));
    const tasks = await models.task.query();
    console.log('!--->prepared tasks:', JSON.stringify(tasks, null, '  '));
*/
  });

  it('index', async () => {
    const response = await makeRequest();
    expect(response.statusCode).toBe(200);
  });

  it('new', async () => {
    const response = await makeRequest('get', 'newUser');
    expect(response.statusCode).toBe(200);
  });

  it.each(userPropertyNamesSheet)('create user: incorrect %s', async (propertyName) => {
    const property = { [propertyName]: '' };
    const user = { ...testData.users.new, ...property };
    const response = await signUp(user);
    expect(response.statusCode).toBe(200);
    expect(await findByEmail(user.email)).not.toBeDefined();
  });

  it('create correct user', async () => {
    const user = testData.users.new;
    const response = await signUp(user);
    expect(response.statusCode).toBe(302);
    const expected = {
      ..._.omit(user, 'password'),
      passwordDigest: encrypt(user.password),
    };
    expect(await findByEmail(user.email)).toMatchObject(expected);
  });

  it('edit page', async () => {
    const { email } = testData.users.existing;
    const { id } = await findBy({ email });
    const url = `/users/${id}/edit`;
    let response = await makeRequest('get', url);
    expect(response.statusCode).toBe(302);

    await signIn();
    response = await makeAuthedRequest('get', url);
    expect(response.statusCode).toBe(200);
  });

  it.each(userPropertyNamesSheet)('edit user: %s', async (propertyName) => {
    const user = testData.users.existing;
    const { id } = await findByEmail(user.email);
    const url = `/users/${id}`;
    const newUser = testData.users.new;
    const property = { [propertyName]: newUser[propertyName] };

    let response = await makeRequest('patch', url, property);
    expect(response.statusCode).toBe(302);
    let patchedUser = await findById(id);
    const getExpected = (value) => (propertyName === 'password' ? encrypt(value) : value);
    const getPropertyValue = () => (propertyName === 'password'
      ? patchedUser.passwordDigest
      : patchedUser[propertyName]);
    expect(getPropertyValue()).toBe(getExpected(user[propertyName]));

    await signIn();
    response = await makeAuthedRequest('patch', url, { [propertyName]: '' });
    expect(response.statusCode).toBe(200);
    patchedUser = await findById(id);
    expect(getPropertyValue()).toBe(getExpected(user[propertyName]));

    response = await makeAuthedRequest('patch', url, property);
    expect(response.statusCode).toBe(302);
    patchedUser = await findById(id);
    expect(getPropertyValue()).toBe(getExpected(newUser[propertyName]));
  });

  it('delete', async () => {
    const user = testData.users.deletable;
    const { id } = await findByEmail(user.email);
    const options = ['delete', `/users/${id}`];
    let response = await makeRequest(...options);
    expect(response.statusCode).toBe(302);
    expect(await findById(id)).toBeDefined();

    await signIn();

    response = await makeAuthedRequest(...options);
    expect(response.statusCode).toBe(302);
    expect(await findById(id)).toBeDefined();

    const { id: existingId } = await findByEmail(testData.users.existing.email);
    response = await makeAuthedRequest('delete', `/users/${existingId}`);
    expect(response.statusCode).toBe(302);
    expect(await findById(existingId)).toBeDefined();

    await signOut();
    await signIn(user);

    response = await makeAuthedRequest(...options);
    expect(response.statusCode).toBe(302);
    expect(await findById(id)).not.toBeDefined();
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
