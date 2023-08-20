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
    .get('/statuses/:id/edit', { name: 'editTaskStatus', preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;
      const taskStatus = await app.objection.models.taskStatus.query().findById(id);
      reply.render('statuses/edit', { taskStatus });
      return reply;
    })
    .post('/statuses', { name: 'createTaskStatus', preValidation: app.authenticate }, async (req, reply) => {
      const taskStatus = new app.objection.models.taskStatus();
      taskStatus.$set(req.body.data);
      try {
        const validTaskStatus = await app.objection.models.taskStatus.fromJson(req.body.data);
        await app.objection.models.taskStatus.query().insert(validTaskStatus);
        req.flash('info', i18next.t('flash.statuses.create.success'));
        reply.redirect(app.reverse('statuses'));
      } catch ({ data }) {
        req.flash('error', i18next.t('flash.statuses.create.error'));
        reply.render('statuses/new', { taskStatus, errors: data });
      }
      return reply;
    })
    .patch('/statuses/:id', { name: 'patchTaskStatus', preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;
      try {
        const validTaskStatus = await app.objection.models.taskStatus.fromJson(req.body.data);
        const taskStatus = await app.objection.models.taskStatus.query().findById(id);
        await taskStatus.$query().patch(validTaskStatus);
        req.flash('info', i18next.t('flash.statuses.edit.success'));
        const statuses = await app.objection.models.taskStatus.query();
        reply.render('statuses/index', { statuses });
      } catch ({ data }) {
        const taskStatus = req.body.data;
        taskStatus.id = id;
        req.flash('error', i18next.t('flash.statuses.edit.error'));
        reply.render('statuses/edit', { taskStatus, errors: data });
      }
      return reply;
    })
    .delete('/statuses/:id', { name: 'deleteTaskStatus', preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;
      const relatedTask = await app.objection.models.task.query().findOne('statusId', id);
      if (relatedTask) {
        req.flash('error', i18next.t('flash.statuses.delete.error'));
        const statuses = await app.objection.models.taskStatus.query();
        reply.render('statuses/index', { statuses });
        return reply;
      }
      try {
        const taskStatus = await app.objection.models.taskStatus.query().findById(id);
        await taskStatus.$query().delete();
        req.flash('info', i18next.t('flash.statuses.delete.success'));
        const statuses = await app.objection.models.taskStatus.query();
        reply.render('statuses/index', { statuses });
      } catch ({ data }) {
        req.flash('error', i18next.t('flash.statuses.delete.error'));
        const statuses = await app.objection.models.taskStatus.query();
        reply.render('statuses/index', { statuses, errors: data });
      }
      return reply;
    });
};
