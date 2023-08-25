// @ts-check

import _ from 'lodash';
import fastify from 'fastify';

import init from '../server/plugin.js';
import encrypt from '../server/lib/secure.js';
import {
  getTestData, prepareData, userPropertySheet, userPropertySheetExceptPassword,
} from './helpers/index.js';

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
  });

  it('index', async () => {
    const response = await makeRequest();
    expect(response.statusCode).toBe(200);
  });

  it('new', async () => {
    const response = await makeRequest('get', 'newUser');
    expect(response.statusCode).toBe(200);
  });

  it.each(userPropertySheet)('create user: incorrect %s', async (propertyName) => {
    const user = { ...testData.users.new, [propertyName]: '' };
    const response = await signUp(user);
    expect(response.statusCode).toBe(422);
    expect(await findByEmail(user.email)).not.toBeDefined();
  });

  it('create user: existing email', async () => {
    const user = { ...testData.users.new, email: testData.users.existing.email };
    const response = await signUp(user);
    expect(response.statusCode).toBe(422);
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
    const id = testData.users.existingId;
    const url = `/users/${id}/edit`;
    let response = await makeRequest('get', url);
    expect(response.statusCode).toBe(302);

    await signIn();
    response = await makeAuthedRequest('get', url);
    expect(response.statusCode).toBe(200);
  });

  it.each(userPropertySheetExceptPassword)('edit user: %s', async (propertyName) => {
    const user = testData.users.existing;
    const id = testData.users.existingId;
    const url = `/users/${id}`;
    const toEditUser = testData.users.editing;
    const userPropertyValue = _.get(user, propertyName);

    let response = await makeRequest('patch', url, toEditUser);
    expect(response.statusCode).toBe(302);
    let patchedUser = await findById(id);
    expect(_.get(patchedUser, propertyName)).toBe(userPropertyValue);

    await signIn();
    response = await makeAuthedRequest('patch', url, { ...user, [propertyName]: '' });
    expect(response.statusCode).toBe(422);
    patchedUser = await findById(id);
    expect(_.get(patchedUser, propertyName)).toBe(userPropertyValue);
    response = await makeAuthedRequest('patch', url, {
      ...user,
      [propertyName]: _.get(toEditUser, propertyName),
    });
    expect(response.statusCode).toBe(302);
    patchedUser = await findById(id);
    expect(_.get(patchedUser, propertyName)).toBe(_.get(toEditUser, propertyName));
  });

  it('edit user: password', async () => {
    const user = testData.users.existing;
    const { password } = user;
    const passwordDigest = encrypt(password);
    const id = testData.users.existingId;
    const url = `/users/${id}`;
    const toEditUser = {
      ...testData.users.editing,
      password,
    };

    let response = await makeRequest('patch', url, toEditUser);
    expect(response.statusCode).toBe(302);
    let patchedUser = await findById(id);
    expect(_.get(patchedUser, 'passwordDigest')).toBe(passwordDigest);

    response = await makeAuthedRequest('patch', url, { ...user, passowrd: '' });
    expect(response.statusCode).toBe(422);
    patchedUser = await findById(id);
    expect(_.get(patchedUser, 'passwordDigest')).toBe(passwordDigest);

    response = await makeAuthedRequest('patch', url, { ...user, passowrd: '42' });
    expect(response.statusCode).toBe(422);
    patchedUser = await findById(id);
    expect(_.get(patchedUser, 'passwordDigest')).toBe(passwordDigest);

    response = await makeAuthedRequest('patch', url, toEditUser);
    expect(response.statusCode).toBe(302);
    patchedUser = await findById(id);
    expect(_.get(patchedUser, 'passwordDigest')).toBe(encrypt(toEditUser.password));
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

    const { existingId } = testData.users;
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
