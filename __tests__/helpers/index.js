// @ts-check

import { faker } from '@faker-js/faker';
// import _ from 'lodash';
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

const existingId = getRandom();

const testData = {
  users: {
    new: generateUser(),
    existing: testUsers[existingId],
    deletable: testUsers[(existingId + 1) % length],
  },
  statuses: {
    new: generateStatus(),
    existing: testStatuses[getRandom()],
  },
  tasks: {},
};

export const userPropertyNamesSheet = Object.keys(testData.users.new).map((p) => [p]);

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

  testData.tasks.new = generateTask(status.id, user.id, user.id);
  testData.tasks.existing = generateTask(status.id, user.id, user.id);
  await insert('tasks', testData.tasks.existing);
};
