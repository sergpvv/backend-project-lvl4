// @ts-check

import i18next from 'i18next';
import _ from 'lodash';

export const getFullName = (user) => {
  if (!user) return '';
  const { firstName, lastName } = user;
  return `${firstName} ${lastName}`;
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
});

const isId = (id) => (typeof id === 'number') || (typeof id === 'string');

export const isEqual = (firstId = null, secondId = null) => {
  if (!isId(firstId) || !isId(secondId)) return null;
  return Number(firstId) === Number(secondId);
};
