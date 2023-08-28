// @ts-check

import { faker } from '@faker-js/faker';
import _ from 'lodash';
import encrypt from '../../server/lib/secure.js';

const length = 2; // number of test entities

export const getRandom = () => Math.floor(Math.random() * length);

const generateEntities = (generateEntity) => Array.from({ length }).map(generateEntity);

const generateUser = () => ({
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  email: faker.internet.email(),
  password: faker.internet.password(),
});

const generateStatus = () => ({ name: faker.word.adjective() });

const generateTask = (statusId, executorId, creatorId) => ({
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

const getDeletable = (testEntities) => testEntities[(existingId + 1) % length];

const testData = {
  users: {
    new: generateUser(),
    editing: generateUser(),
    existing: testUsers[existingId],
    deletable: getDeletable(testUsers),
  },
  statuses: {
    new: generateStatus(),
    editing: generateStatus(),
    existing: testStatuses[existingId],
    deletable: getDeletable(testStatuses),
  },
  tasks: {},
};

export const isPassword = (propertyName) => propertyName === 'password';

export const userPropertyNames = _.keys(testData.users.new);

export const userPropertySheet = _.chunk(userPropertyNames);

export const userPropertySheetExceptPassword = _.chunk(_.reject(userPropertyNames, isPassword));

export const getTestData = () => testData;

const getId = () => getRandom() + 1;

export const prepareData = async (app) => {
  const insert = (table, data) => app.objection.knex(table).insert(data);

  await insert('users', testUsers.map(({ password, ...properties }) => ({
    ...properties,
    passwordDigest: encrypt(password),
  })));

  const { email } = testData.users.existing;
  const user = await app.objection.models.user.query().findOne({ email });
  testData.users.existingId = user.id;

  await insert('statuses', testStatuses);
  const { name } = testData.statuses.existing;
  const status = await app.objection.models.taskStatus.query().findOne({ name });
  testData.statuses.existingId = status.id;

  testData.tasks.new = generateTask(status.id, user.id, user.id);
  testData.tasks.existing = generateTask(status.id, user.id, user.id);
  testData.tasks.editing = generateTask(getId(), getId(), user.id);
  await insert('tasks', testData.tasks.existing);
  const task = await app.objection.models.task.query()
    .findOne({ name: testData.tasks.existing.name });
  testData.tasks.existingId = task.id;
};
