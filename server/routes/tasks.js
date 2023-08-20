import i18next from 'i18next';
import isEqual from '../helpers/isEqual.js';

const getFullName = ({ firstName, lastName }) => `${firstName} ${lastName}`;

export default (app) => {
  app
    .get('/tasks', { name: 'tasks', preValidation: app.authenticate }, async (req, reply) => {
      const taskList = await app.objection.models.task.query();
      const tasks = await Promise.all(taskList.map(async (task) => {
        const {
          id,
          name,
          /*
          description,
          statusId,
          creatorId,
          executorId,
        */
          createdAt,
        } = task;
        const taskStatus = await task.$relatedQuery('status');
        const taskCreator = await task.$relatedQuery('creator');
        const taskExecutor = await task.$relatedQuery('executor');
        return ({
          id,
          name,
          // description,
          status: taskStatus.name,
          creator: getFullName(taskCreator),
          executor: getFullName(taskExecutor),
          createdAt,
        });
      }));
      // console.log('!--->tasks:', JSON.stringify(tasks, null, '  '));
      reply.render('tasks/index', { tasks });
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
    .get('/tasks/:id', { name: 'taskCard', preValidation: app.authenticate }, async (req, reply) => {
      const task = await app.objection.models.task.query().findById(req.params.id);
      task.labels = await app.objection.models.label.query();
      const taskStatus = await task.$relatedQuery('status');
      const taskCreator = await task.$relatedQuery('creator');
      const taskExecutor = await task.$relatedQuery('executor');
      task.status = taskStatus.name;
      task.creator = getFullName(taskCreator);
      task.executor = getFullName(taskExecutor);
      reply.render('tasks/card', { task });
      return reply;
    })
    .get('/tasks/:id/edit', { name: 'editTask', preValidation: app.authenticate }, async (req, reply) => {
      const task = await app.objection.models.task.query().findById(req.params.id);
      task.labels = await app.objection.models.label.query();
      task.statuses = await app.objection.models.taskStatus.query();
      task.users = await app.objection.models.user.query();
      reply.render('tasks/edit', { task });
      return reply;
    })
    .post('/tasks', { name: 'createNewTask', preValidation: app.authenticate }, async (req, reply) => {
      const task = new app.objection.models.task();
      task.$set(req.body.data);
      const statusId = parseInt(task.statusId, 10);
      const executorId = parseInt(task.executorId, 10);
      const creatorId = parseInt(req.session.get('userId'), 10);
      task.$set({ statusId, creatorId, executorId });
      try {
        const { labels, ...newTask } = task;
        await app.objection.models.task.query().insert(newTask);
        req.flash('info', i18next.t('flash.tasks.create.success'));
        reply.redirect(app.reverse('tasks'));
      } catch ({ data }) {
        task.labels = await app.objection.models.label.query();
        task.statuses = await app.objection.models.taskStatus.query();
        task.users = await app.objection.models.user.query();
        req.flash('error', i18next.t('flash.tasks.create.error'));
        reply.render('tasks/new', { task, errors: data });
      }
      return reply;
    })
    .patch('/tasks/:id', { name: 'patchTask', preValidation: app.authenticate }, async (req, reply) => {
      const task = await app.objection.models.task.query().findById(req.params.id);
      const statusId = parseInt(req.body.data.statusId, 10);
      const executorId = parseInt(req.body.data.executorId, 10);
      try {
        await task.$query().patch({
          name: req.body.data.name,
          description: req.body.data.description,
          statusId,
          executorId,
        });
        req.flash('info', i18next.t('flash.tasks.edit.success'));
        reply.redirect(app.reverse('tasks'));
      } catch ({ data }) {
        const { labels, ...editedTask } = req.body.data;
        task.$set(editedTask);
        task.$set({ statusId, executorId });
        task.statuses = await app.objection.models.taskStatus.query();
        task.users = await app.objection.models.user.query();
        task.labels = await app.objection.models.label.query();
        req.flash('error', i18next.t('flash.tasks.edit.error'));
        reply.render('tasks/edit', { task, errors: data });
      }
      return reply;
    })
    .delete('/tasks/:id', { name: 'deleteTask', preValidation: app.authenticate }, async (req, reply) => {
      const task = await app.objection.models.task.query().findById(req.params.id);
      const { creatorId } = task;
      if (!isEqual(creatorId, req.session.get('userId'))) {
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
