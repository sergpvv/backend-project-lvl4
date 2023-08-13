// @ts-check

import { URL } from 'url';
import fs from 'fs';
import path from 'path';

// TODO: использовать для фикстур https://github.com/viglucci/simple-knex-fixtures

const getFixturePath = (filename) => path.join('..', '..', '__fixtures__', filename);
const readFixture = (filename) => fs.readFileSync(new URL(getFixturePath(filename), import.meta.url), 'utf-8').trim();
const getFixtureData = (filename) => {
  const result = JSON.parse(readFixture(filename));
  // console.log(`!--->readFixture(${filename}) return:`, JSON.stringify(result, null, '  '));
  return result;
};

export const getTestData = () => getFixtureData('testData.json');

export const prepareData = async (app) => {
  const { knex } = app.objection;

  // получаем данные из фикстур и заполняем БД
  await knex('users').insert(getFixtureData('users.json'));
/*    .on('query-response', (response, obj, builder) => {
      console.log('!--->insert(getFixtureData(\'users.json\')):');
      console.log(`  response:${JSON.stringify(response, null, '  ')}`);
      console.log(`  obj: ${JSON.stringify(obj, null, '  ')}`);
      console.log(`  builder: ${builder}`);
    })
    .debug();
*/
};
