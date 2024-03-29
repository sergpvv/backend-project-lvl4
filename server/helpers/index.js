// @ts-check

import i18next from 'i18next';
import _ from 'lodash';

export const getFullName = (user) => {
  if (!user) return '';
  const { firstName, lastName } = user;
  return `${firstName} ${lastName}`;
};

const isId = (id) => (typeof id === 'number') || (typeof id === 'string');

export const isEqual = (firstId = null, secondId = null) => {
  if (!isId(firstId) || !isId(secondId)) return null;
  return Number(firstId) === Number(secondId);
};

export default (app) => ({
  route(name) {
    return app.reverse(name);
  },
  t(key) {
    return i18next.t(key);
  },
  _,
  getAlertClass(type) {
    switch (type) {
      // case 'failure':
      //   return 'danger';
      case 'error':
        return 'danger';
      case 'success':
        return 'success';
      case 'info':
        return 'info';
      default:
        throw new Error(`Unknown flash type: '${type}'`);
    }
  },
  formatDate(str) {
    const date = new Date(str);
    return date.toLocaleString();
  },
  fn(user) {
    return getFullName(user);
  },
  eq(id1, id2) {
    return isEqual(id1, id2);
  },
});

export const parseId = (id) => {
  if (typeof id === 'number') return id;
  if (id === '') return 0;
  const result = parseInt(id, 10);
  if (Number.isNaN(result)) return null;
  return result;
};

export const arrayize = (value) => {
  if (typeof value === 'undefined') return [];
  if (Array.isArray(value)) return value;
  return [value];
};
