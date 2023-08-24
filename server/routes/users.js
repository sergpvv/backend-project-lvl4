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
    .post('/users', async (req, reply) => {
      try {
        const validUser = await app.objection.models.user.fromJson(req.body.data);
        await app.objection.models.user.query().insert(validUser).debug();
        req.flash('info', i18next.t('flash.users.create.success'));
        reply.redirect(app.reverse('root'));
      } catch ({ data }) {
        req.flash('error', i18next.t('flash.users.create.error'));
        reply.render('users/new', { user: req.body.data, errors: data });
      }
      return reply;
    })
    .patch('/users/:id', { preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;
      const currentUserId = req.session.get('userId');
      const user = await app.objection.models.user.query().findById(id);
      if (!isEqual(id, currentUserId)) {
        req.flash('error', i18next.t('flash.accessDenied'));
        reply.redirect(app.reverse('users'));
        return reply;
      }
      try {
        await user.$query().patch(req.body.data);
        req.flash('info', i18next.t('flash.users.edit.success'));
        reply.redirect(app.reverse('users'));
      } catch ({ data }) {
        user.$set(req.body.data);
        req.flash('error', i18next.t('flash.users.edit.error'));
        reply.render('users/edit', { user, errors: data });
      }
      return reply;
    })
    .delete('/users/:id', { preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;
      const currentUserId = req.session.get('userId');
      if (!isEqual(id, currentUserId)) {
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
