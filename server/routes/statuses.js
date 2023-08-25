// @ts-check

import i18next from 'i18next';

export default (app) => {
  app
    .get('/statuses', { name: 'statuses', preValidation: app.authenticate }, async (req, reply) => {
      const statuses = await app.objection.models.taskStatus.query();
      reply.render('statuses/index', { statuses });
      return reply;
    })
    .get('/statuses/new', { name: 'newTaskStatus', preValidation: app.authenticate }, (req, reply) => {
      const taskStatus = new app.objection.models.taskStatus();
      reply.render('statuses/new', { taskStatus });
    })
    .get('/statuses/:id/edit', { preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;
      const taskStatus = await app.objection.models.taskStatus.query().findById(id);
      reply.render('statuses/edit', { taskStatus });
      return reply;
    })
    .post('/statuses', { name: 'createTaskStatus', preValidation: app.authenticate }, async (req, reply) => {
      const taskStatus = req.body.data;
      try {
        const validTaskStatus = await app.objection.models.taskStatus.fromJson(taskStatus);
        await app.objection.models.taskStatus.query().insert(validTaskStatus);
        req.flash('info', i18next.t('flash.statuses.create.success'));
        reply.redirect(app.reverse('statuses'));
      } catch ({ data }) {
        req.flash('error', i18next.t('flash.statuses.create.error'));
        reply.render('statuses/new', { taskStatus, errors: data });
      }
      return reply;
    })
    .patch('/statuses/:id', { preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;
      const { data } = req.body;
      const taskStatus = await app.objection.models.taskStatus.query().findById(id);
      try {
        await taskStatus.$query().patch(data);
        req.flash('info', i18next.t('flash.statuses.edit.success'));
        reply.redirect(app.reverse('statuses'));
      } catch ({ data: errors }) {
        taskStatus.$set(data);
        req.flash('error', i18next.t('flash.statuses.edit.error'));
        reply.render('statuses/edit', { taskStatus, errors });
      }
      return reply;
    })
    .delete('/statuses/:id', { preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;
      const relatedTasks = await app.objection.models.task.query().findOne({ statusId: id });
      if (relatedTasks?.length > 0) {
        req.flash('error', i18next.t('flash.statuses.delete.error'));
        reply.redirect(app.reverse('statuses'));
        return reply;
      }
      try {
        await app.objection.models.taskStatus.query().findById(id).delete();
        req.flash('info', i18next.t('flash.statuses.delete.success'));
      } catch (_e) {
        req.flash('error', i18next.t('flash.statuses.delete.error'));
      }
      reply.redirect(app.reverse('statuses'));
      return reply;
    });
};
