import i18next from 'i18next';
import { isEqual, parseId, arrayize } from '../helpers/index.js';

export default (app) => {
  app
    .get('/tasks', { name: 'tasks', preValidation: app.authenticate }, async (req, reply) => {
      const {
        status = null, executor = null, label = null, isCreatorUser = null,
      } = req.query;
      const creator = isCreatorUser === 'on' ? req.session.get('userId') : null;
      let tasksFilteredByLabel;
      if (label) {
        const filterLabel = await app.objection.models.label.query().findById(label);
        tasksFilteredByLabel = filterLabel.$relatedQuery('tasks');
      }
      const taskListQuery = tasksFilteredByLabel ?? app.objection.models.task.query();
      Object.entries({ status, executor, creator }).filter(([, id]) => id)
        .forEach(([modifier, id]) => taskListQuery.modify(modifier, id));
      const taskList = await taskListQuery.withGraphJoined('[status, creator, executor]');
      const tasks = arrayize(taskList);
      const statuses = await app.objection.models.taskStatus.query();
      const users = await app.objection.models.user.query();
      const labels = await app.objection.models.label.query();
      const filter = {
        status, executor, label, isCreatorUser,
      };
      reply.render('tasks/index', {
        tasks, statuses, users, labels, filter,
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
      const task = await app.objection.models.task.query().findById(req.params.id)
        .withGraphJoined('[status, creator, executor]');
      task.labels = arrayize(await task.$relatedQuery('labels'));
      reply.render('tasks/card', { task });
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
      const selectedLabels = arrayize(labels);
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
          if (selectedLabels.length > 0) {
            await Promise.all(selectedLabels
              .map((id) => task.$relatedQuery('labels', trx).relate(id)));
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
            selected: selectedLabels.some((id) => isEqual(id, label.id)),
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
      const selectedLabels = arrayize(labels);
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
          await Promise.all(selectedLabels
            .map((id) => task.$relatedQuery('labels', trx).relate(id)));
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
            selected: selectedLabels.some((id) => isEqual(id, label.id)),
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
