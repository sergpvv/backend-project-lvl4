import i18next from 'i18next';
import { isEqual, parseId } from '../helpers/index.js';

export default (app) => {
  app
    .get('/tasks', { name: 'tasks', preValidation: app.authenticate }, async (req, reply) => {
      const taskList = await app.objection.models.task.query();
      const tasks = await Promise.all(taskList.map(async (task) => {
        const { name: status } = await task.$relatedQuery('status');
        const creator = await task.$relatedQuery('creator');
        const executor = await task.$relatedQuery('executor');
        return ({
          ...task,
          status,
          creator,
          executor,
        });
      }));
      const statuses = await app.objection.models.taskStatus.query();
      const users = await app.objection.models.user.query();
      const labels = await app.objection.models.label.query();
      reply.render('tasks/index', {
        tasks, statuses, users, labels,
      });
      return reply;
    })
    .get('/tasks/new', { name: 'newTask', preValidation: app.authenticate }, async (req, reply) => {
      const task = new app.objection.models.task();
      task.labels = await app.objection.models.label.query();
      task.statuses = await app.objection.models.taskStatus.query();
      task.users = await app.objection.models.user.query();
      reply.render('tasks/new', { task });
      return reply;
    })
    .get('/tasks/:id', { preValidation: app.authenticate }, async (req, reply) => {
      const task = await app.objection.models.task.query().findById(req.params.id);
      const labels = await app.objection.models.label.query();
      const { name: status } = await task.$relatedQuery('status');
      const creator = await task.$relatedQuery('creator');
      const executor = await task.$relatedQuery('executor');
      reply.render('tasks/card', {
        task: {
          ...task,
          labels,
          status,
          creator,
          executor,
        },
      });
      return reply;
    })
    .get('/tasks/:id/edit', { preValidation: app.authenticate }, async (req, reply) => {
      const task = await app.objection.models.task.query().findById(req.params.id);
      task.labels = await app.objection.models.label.query();
      task.statuses = await app.objection.models.taskStatus.query();
      task.users = await app.objection.models.user.query();
      reply.render('tasks/edit', { task });
      return reply;
    })
    .post('/tasks', { preValidation: app.authenticate }, async (req, reply) => {
      const task = new app.objection.models.task();
      const {
        name, description, statusId, executorId,
      } = req.body.data;
      const newTaskData = {
        name,
        description,
        statusId: parseId(statusId),
        executorId: parseId(executorId) > 0 ? executorId : null,
        creatorId: parseId(req.session.get('userId')),
      };
      try {
        await app.objection.models.task.query().insert(newTaskData).debug();
        req.flash('info', i18next.t('flash.tasks.create.success'));
        reply.redirect(app.reverse('tasks'));
      } catch ({ data }) {
        task.$set(req.body.data);
        task.labels = await app.objection.models.label.query();
        task.statuses = await app.objection.models.taskStatus.query();
        task.users = await app.objection.models.user.query();
        req.flash('error', i18next.t('flash.tasks.create.error'));
        reply.code(422).render('tasks/new', { task, errors: data });
      }
      return reply;
    })
    .patch('/tasks/:id', { preValidation: app.authenticate }, async (req, reply) => {
      // console.log('!----------->req.body.data:', req.body.data);
      const task = await app.objection.models.task.query().findById(req.params.id);
      const {
        name, description, statusId, executorId,
      } = req.body.data;
      const newTaskData = {
        name,
        description,
        statusId: parseId(statusId),
        executorId: parseId(executorId) > 0 ? executorId : null,
      };
      // console.log('!----------->newTaskData', newTaskData);
      try {
        await task.$query().update(newTaskData);
        req.flash('info', i18next.t('flash.tasks.edit.success'));
        reply.redirect(app.reverse('tasks'));
      } catch ({ data }) {
        task.$set(req.body.data);
        task.statuses = await app.objection.models.taskStatus.query();
        task.users = await app.objection.models.user.query();
        task.labels = await app.objection.models.label.query();
        req.flash('error', i18next.t('flash.tasks.edit.error'));
        reply.code(422).render('tasks/edit', { task, errors: data });
      }
      return reply;
    })
    .delete('/tasks/:id', { preValidation: app.authenticate }, async (req, reply) => {
      const task = await app.objection.models.task.query().findById(req.params.id);
      if (!isEqual(task.creatorId, req.session.get('userId'))) {
        req.flash('error', i18next.t('flash.tasks.delete.accessDenied'));
        reply.redirect(app.reverse('tasks'));
        return reply;
      }
      try {
        await task.$query().delete();
        req.flash('info', i18next.t('flash.tasks.delete.success'));
      } catch ({ data }) {
        req.flash('error', i18next.t('flash.tasks.delete.error'));
      }
      reply.redirect(app.reverse('tasks'));
      return reply;
    });
};
