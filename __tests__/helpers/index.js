// @ts-check
/* eslint no-restricted-syntax: ["off", "ForOfStatement"] */
/* eslint-disable no-await-in-loop */

import { URL } from 'url';
import fs from 'fs';
import path from 'path';

const getFixturePath = (filename) => path.join('..', '..', '__fixtures__', filename);
const readFixture = (filename) => {
  const fileUrl = new URL(getFixturePath(filename), import.meta.url);
  return fs.readFileSync(fileUrl).toString();
};
const getFixtureData = (filename) => JSON.parse(readFixture(filename));

const createEntities = async (app, entitesData, url, cookies) => {
  for (const entityData of entitesData) {
    await app.inject({
      method: 'POST',
      url,
      cookies,
      payload: { data: entityData },
    });
  }
};

export const getUsers = () => getFixtureData('users.json');
export const getTaskStatuses = () => getFixtureData('taskStatuses.json');
export const getLabels = () => getFixtureData('labels.json');
export const getTestData = () => getFixtureData('testData.json');

export const signIn = async (app, user) => {
  const response = await app.inject({
    method: 'POST',
    url: '/session',
    payload: {
      data: user,
    },
  });

  const [sessionCookie] = response.cookies;
  const { name, value } = sessionCookie;
  return { [name]: value };
};

export const loadUsers = (app) => createEntities(app, getUsers(), '/users');
export const loadTaskStatuses = (app, cookie) => createEntities(app, getTaskStatuses(), '/statuses', cookie);
export const loadLabels = (app, cookie) => createEntities(app, getLabels(), '/labels', cookie);

export const runServer = async (app) => {
  await app.listen(3000, 'localhost');
};
