// @ts-check

import { faker } from '@faker-js/faker';
import _ from 'lodash';
import encrypt from '../../server/lib/secure.js';

const length = 3; // number of test entities

export const getRandom = () => Math.floor(Math.random() * length);

const generateEntities = (generateEntity) => Array.from({ length }).map(generateEntity);

const generateUser = () => ({
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  email: faker.internet.email(),
  password: faker.internet.password(),
});

const generateStatus = () => ({ name: faker.word.adjective() });

const generateTask = (statusId = 0, executorId = 0, creatorId = 0) => ({
  name: faker.hacker.noun(),
  description: faker.lorem.sentence(),
  statusId,
  executorId,
  creatorId,
});

const testUsers = generateEntities(generateUser);

const testStatuses = generateEntities(generateStatus);

// const tasks = generateEntities(generateTask);

const testData = {
  users: {
    new: generateUser(),
    existing: testUsers[getRandom()],
  },
  statuses: {
    new: generateStatus(),
    existing: testStatuses[getRandom()],
  },
};

export const getTestData = () => testData;

export const prepareData = async (app) => {
  const insert = (table, data) => app.objection.knex(table).insert(data);

  await insert('users', testUsers.map(({ password, ...properties }) => ({
    ...properties,
    passwordDigest: encrypt(password),
  })));

  const { email } = testData.users.existing;
  const user = await app.objection.models.user.query().findOne({ email });

  await insert('statuses', testStatuses);
  const { name } = testData.statuses.existing;
  const status = await app.objection.models.taskStatus.query().findOne({ name });

  await insert('tasks', generateTask(status.id, user.id, user.id));
/*
await Promise.all(_.entries({
    users: users.map(({ password, ...properties }) => ({
      ...properties,
      passwordDigest: encrypt(password),
    })),
    statuses,
    tasks,
  })
    .map(async ([table, data]) => await app.objection.knex(table).insert(data)));

const { knex } = app.objection;
  await knex('users').insert(testUsers.map((user) => ({
    ..._.omit(user, 'password'),
    passwordDigest: encrypt(user.password),
  })));
  await knex('statuses').insert(testStatuses);
  await knex('tasks').insert(testTasks);
  */
};
