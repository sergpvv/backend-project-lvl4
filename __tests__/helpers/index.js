// @ts-check

import { faker } from '@faker-js/faker';
import _ from 'lodash';
import encrypt from '../../server/lib/secure.js';

const length = 4; // number of test entities

export const getRandom = () => Math.floor(Math.random() * length);

const generateEntities = (generateEntity) => Array.from({ length }).map(generateEntity);

const generateUser = () => ({
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  email: faker.internet.email(),
  password: faker.internet.password(),
});

const generateStatus = () => ({ name: _.uniqueId(faker.word.adjective()) });

const generateTask = (statusId, executorId, creatorId) => ({
  name: _.uniqueId(faker.hacker.noun()),
  description: faker.lorem.sentence(),
  statusId,
  executorId,
  creatorId,
});

const generateLabel = () => ({ name: _.uniqueId(faker.hacker.verb()) });

const testUsers = generateEntities(generateUser);

const testStatuses = generateEntities(generateStatus);

const testLabels = generateEntities(generateLabel);

const isUnique = (entity, unique, testEntities) => _.filter(
  testEntities,
  ({ [unique]: value }) => entity[unique] === value,
).length === 0;

const generateNewEntity = (generateEntity, unique, testEntities) => {
  let result = generateEntity();
  let counter = 42;
  while ((counter > 0)
    && !isUnique(result, unique, testEntities)) {
    result = generateEntity();
    counter -= 1;
  }
  return result;
};

const generateNewUser = () => generateNewEntity(generateUser, 'email', testUsers);

const generateNewStatus = () => generateNewEntity(generateStatus, 'name', testStatuses);

const generateNewLabel = () => generateNewEntity(generateLabel, 'name', testLabels);

const testData = {
  users: {
    new: generateNewUser(),
    editing: generateNewUser(),
    existing: testUsers[0],
    deletable: testUsers[1],
    unsuitable: testUsers[2],
    taskEditing: testUsers[3],
  },
  statuses: {
    new: generateNewStatus(),
    editing: generateNewStatus(),
    existing: testStatuses[0],
    deletable: testStatuses[1],
    unsuitable: testStatuses[2],
    taskEditing: testStatuses[3],
  },
  labels: {
    new: generateNewLabel(),
    editing: generateNewLabel(),
    existing: testLabels[0],
    deletable: testLabels[1],
    unsuitable: testLabels[2],
    taskEditing: testLabels[3],
  },
  tasks: {},
};

export const isPassword = (propertyName) => propertyName === 'password';

export const userPropertyNames = _.keys(testData.users.new);

export const userPropertySheet = _.chunk(userPropertyNames);

export const userPropertySheetExceptPassword = _.chunk(_.reject(userPropertyNames, isPassword));

export const getTestData = () => testData;

export const prepareData = async (app) => {
  const insert = (table, data) => app.objection.knex(table).insert(data);

  await insert('users', testUsers.map(({ password, ...properties }) => ({
    ...properties,
    passwordDigest: encrypt(password),
  })));

  const { id: userId } = await app.objection.models.user.query()
    .findOne({ email: testData.users.existing.email });
  testData.users.existingId = userId;

  await insert('statuses', testStatuses);
  const { id: statusId } = await app.objection.models.taskStatus.query()
    .findOne({ name: testData.statuses.existing.name });
  testData.statuses.existingId = statusId;

  testData.tasks.new = generateTask(statusId, userId, userId);
  testData.tasks.existing = generateTask(statusId, userId, userId);

  const existingTask = await app.objection.models.task.query()
    .insertAndFetch(testData.tasks.existing);
  testData.tasks.existingId = existingTask.id;

  const { id: taskEditingUserId } = await app.objection.models.user.query()
    .findOne({ email: testData.users.taskEditing.email });
  const { id: taskEditingStatusId } = await app.objection.models.taskStatus.query()
    .findOne({ name: testData.statuses.taskEditing.name });
  testData.tasks.editing = generateTask(taskEditingStatusId, taskEditingUserId, userId);

  await insert('labels', testLabels);
  const { id: existingLabelId } = await app.objection.models.label.query()
    .findOne({ name: testData.labels.existing.name });
  testData.labels.existingId = existingLabelId;
  await existingTask.$relatedQuery('labels').relate(existingLabelId);

  const { id: unsuitableStatusId } = await app.objection.models.taskStatus.query()
    .findOne({ name: testData.statuses.unsuitable.name });
  const { id } = await app.objection.models.user.query()
    .findOne({ email: testData.users.unsuitable.email });
  const unsuitableTask = await app.objection.models.task.query()
    .insertAndFetch(generateTask(unsuitableStatusId, id, id));
  testData.tasks.unsuitable = unsuitableTask;
  const { id: unsuitableLabelId } = await app.objection.models.label.query()
    .findOne({ name: testData.labels.unsuitable.name });
  await unsuitableTask.$relatedQuery('labels').relate(unsuitableLabelId);
};

export const getRegExp = (str) => new RegExp(`<td>${str}`);
