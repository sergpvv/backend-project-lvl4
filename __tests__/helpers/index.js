// @ts-check

import { faker } from '@faker-js/faker';
import _ from 'lodash';
import encrypt from '../../server/lib/secure.js';

const numberOfTestUsers = 3;

export const getRandom = (n = numberOfTestUsers) => Math.floor(Math.random() * n);

const generateUser = () => ({
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  email: faker.internet.email(),
  password: faker.internet.password(),
});

const generateUsers = (length = numberOfTestUsers) => Array.from({ length })
  .map(() => generateUser());

const testUsers = generateUsers();

export const getTestData = () => ({
  users: {
    new: generateUser(),
    existing: testUsers[getRandom()],
  },
});

export const prepareData = async (app) => {
  const { knex } = app.objection;
  await knex('users').insert(testUsers.map((user) => ({
    ..._.omit(user, 'password'),
    passwordDigest: encrypt(user.password),
  })));
};
