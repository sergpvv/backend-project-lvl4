import i18next from 'i18next';
import { isEqual, parseId, arrayize } from '../helpers/index.js';

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
      const labels = arrayize(await task.$relatedQuery('labels'));
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
      const labels = await app.objection.models.label.query();
      const taskLabels = arrayize(await task.$relatedQuery('labels'));
      task.labels = labels.map(({ id, name }) => ({
        id,
        name,
        selected: taskLabels.some(({ id: labelId }) => id === labelId),
      }));
      task.statuses = await app.objection.models.taskStatus.query();
      task.users = await app.objection.models.user.query();
      reply.render('tasks/edit', { task });
      return reply;
    })
    .post('/tasks', { preValidation: app.authenticate }, async (req, reply) => {
      const {
        name, description, statusId, executorId, labels,
      } = req.body.data;
      const taskLabels = arrayize(labels);
      const newTaskData = {
        name,
        description,
        statusId: parseId(statusId),
        executorId: parseId(executorId) > 0 ? executorId : null,
        creatorId: parseId(req.session.get('userId')),
      };
      try {
        await app.objection.models.task.transaction(async (trx) => {
          const task = await app.objection.models.task.query(trx).insertAndFetch(newTaskData);
          if (taskLabels.length > 0) {
            const relateLabelsPromises = taskLabels
              .map((id) => task.$relatedQuery('labels', trx).relate(id));
            await Promise.all(relateLabelsPromises);
          }
        });
        req.flash('info', i18next.t('flash.tasks.create.success'));
        reply.redirect(app.reverse('tasks'));
      } catch (error) {
        console.log(error);
        const task = new app.objection.models.task();
        task.$set(req.body.data);
        task.labels = arrayize(await app.objection.models.label.query())
          .map((label) => ({
            ...label,
            selected: taskLabels.some((id) => isEqual(id, label.id)),
          }));
        task.statuses = await app.objection.models.taskStatus.query();
        task.users = await app.objection.models.user.query();
        req.flash('error', i18next.t('flash.tasks.create.error'));
        reply.code(422).render('tasks/new', { task, errors: error.data });
      }
      return reply;
    })
    .patch('/tasks/:id', { preValidation: app.authenticate }, async (req, reply) => {
      const task = await app.objection.models.task.query().findById(req.params.id);
      const {
        name, description, statusId, executorId, labels,
      } = req.body.data;
      const newLabels = arrayize(labels);
      const newTaskData = {
        name,
        description,
        statusId: parseId(statusId),
        executorId: parseId(executorId) > 0 ? executorId : null,
      };
      try {
        await app.objection.models.task.transaction(async (trx) => {
          await task.$query(trx).update(newTaskData);
          await task.$relatedQuery('labels', trx).unrelate();
          await Promise.all(newLabels.map((id) => task.$relatedQuery('labels', trx).relate(id)));
        });
        req.flash('info', i18next.t('flash.tasks.edit.success'));
        reply.redirect(app.reverse('tasks'));
      } catch ({ data }) {
        task.$set(req.body.data);
        task.statuses = await app.objection.models.taskStatus.query();
        task.users = await app.objection.models.user.query();
        task.labels = arrayize(await app.objection.models.label.query())
          .map((label) => ({
            ...label,
            selected: newLabels.some((id) => isEqual(id, label.id)),
          }));
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
        await app.objection.models.task.transaction(async (trx) => {
          await task.$relatedQuery('labels', trx).unrelate();
          await task.$query(trx).delete();
        });
        req.flash('info', i18next.t('flash.tasks.delete.success'));
      } catch (error) {
        console.log(error);
        req.flash('error', i18next.t('flash.tasks.delete.error'));
      }
      reply.redirect(app.reverse('tasks'));
      return reply;
    });
};
