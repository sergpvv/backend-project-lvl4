// @ts-check

import i18next from 'i18next';
import { isEqual } from '../helpers/index.js';

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
      if (!isEqual(id, req.session.get('userId'))) {
        req.flash('error', i18next.t('flash.accessDenied'));
        reply.redirect(app.reverse('users'));
        return reply;
      }
      const user = await app.objection.models.user.query().findById(id);
      reply.render('users/edit', { user });
      return reply;
    })
    .post('/users', async (req, reply) => {
      const { data: user } = req.body;
      try {
        const validUser = await app.objection.models.user.fromJson(user);
        await app.objection.models.user.query().insert(validUser);
        req.flash('info', i18next.t('flash.users.create.success'));
        reply.redirect(app.reverse('root'));
      } catch ({ data: errors }) {
        req.flash('error', i18next.t('flash.users.create.error'));
        reply.code(422).render('users/new', { user, errors });
      }
      return reply;
    })
    .patch('/users/:id', { preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;
      if (!isEqual(id, req.session.get('userId'))) {
        req.flash('error', i18next.t('flash.accessDenied'));
        reply.redirect(app.reverse('users'));
        return reply;
      }
      const { data: editedUser } = req.body;
      const user = await app.objection.models.user.query().findById(id);
      try {
        const validUser = await app.objection.models.user.fromJson(editedUser);
        await user.$query().patch(validUser);
        req.flash('info', i18next.t('flash.users.edit.success'));
        reply.redirect(app.reverse('users'));
      } catch ({ data: errors }) {
        user.$set(editedUser);
        req.flash('error', i18next.t('flash.users.edit.error'));
        reply.code(422).render('users/edit', { user, errors });
      }
      return reply;
    })
    .delete('/users/:id', { preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;
      if (!isEqual(id, req.session.get('userId'))) {
        req.flash('error', i18next.t('flash.accessDenied'));
        reply.redirect(app.reverse('users'));
        return reply;
      }
      const relatedTasks = await app.objection.models.task.query()
        .where('creatorId', id).orWhere('executorId', id);
      if (relatedTasks?.length > 0) {
        req.flash('error', i18next.t('flash.users.delete.error'));
        reply.redirect(app.reverse('users'));
        return reply;
      }
      try {
        req.logOut();
        await app.objection.models.user.query().findById(id).delete();
        req.flash('info', i18next.t('flash.users.delete.success'));
      } catch (_e) {
        req.flash('error', i18next.t('flash.users.delete.error'));
      }
      reply.redirect(app.reverse('users'));
      return reply;
    });
};
