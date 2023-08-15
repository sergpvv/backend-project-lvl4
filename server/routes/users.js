// @ts-check

import i18next from 'i18next';
import isEqual from '../helpers/isEqual.js';

export default (app) => {
  app
    .get('/users', { name: 'users' }, async (req, reply) => {
      const users = await app.objection.models.user.query();
      reply.render('users/index', { users });
      return reply;
    })
    .get('/users/new', { name: 'newUser' }, (req, reply) => {
      const user = new app.objection.models.user();
      reply.render('users/new', { user });
    })
    .get('/users/:id/edit', { name: 'editUser', preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;
      const currentUserId = req.session.get('userId');
      if (!isEqual(id, currentUserId)) {
        req.flash('error', i18next.t('flash.accessDenied'));
        const users = await app.objection.models.user.query();
        reply.render('users/index', { users });
        return reply;
      }
      const user = await app.objection.models.user.query().findById(id);
      reply.render('users/edit', { user });
      return reply;
    })
    .post('/users', { name: 'createNewUser' }, async (req, reply) => {
      const user = new app.objection.models.user();
      user.$set(req.body.data);
      try {
        const validUser = await app.objection.models.user.fromJson(req.body.data);
        await app.objection.models.user.query().insert(validUser).debug();
        req.flash('info', i18next.t('flash.users.create.success'));
        reply.redirect(app.reverse('root'));
      } catch ({ data }) {
        req.flash('error', i18next.t('flash.users.create.error'));
        reply.render('users/new', { user, errors: data });
      }
      return reply;
    })
    .patch('/users/:id', { name: 'patchUser', preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;
      const currentUserId = req.session.get('userId');
      if (!isEqual(id, currentUserId)) {
        req.flash('error', i18next.t('flash.accessDenied'));
        const users = await app.objection.models.user.query();
        reply.render('users/index', { users });
        return reply;
      }
      const user = new app.objection.models.user();
      user.$set(req.body.data);
      try {
        const userInstance = await app.objection.models.user.query().findById(id);
        await userInstance.$query().patch(user);
        req.flash('info', i18next.t('flash.users.edit.success'));
        const users = await app.objection.models.user.query();
        reply.render('users/index', { users });
      } catch ({ data }) {
        req.flash('error', i18next.t('flash.users.edit.error'));
        reply.render('users/edit', { user, errors: data });
      }
      return reply;
    })
    .delete('/users/:id', { name: 'deleteUser', preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;
      const currentUserId = req.session.get('userId');
      if (!isEqual(id, currentUserId)) {
        req.flash('error', i18next.t('flash.accessDenied'));
        const users = await app.objection.models.user.query();
        reply.render('users/index', { users });
        return reply;
      }
      try {
        req.logOut();
        const userInstance = await app.objection.models.user.query().findById(id);
        await userInstance.$query().delete();
        req.flash('info', i18next.t('flash.users.delete.success'));
        const users = await app.objection.models.user.query();
        reply.render('users/index', { users });
      } catch ({ data }) {
        req.flash('error', i18next.t('flash.users.delete.error'));
        const users = await app.objection.models.user.query();
        reply.render('users/index', { users, errors: data });
      }
      return reply;
    });
};
