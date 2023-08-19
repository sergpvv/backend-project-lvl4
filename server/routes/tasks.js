import i18next from 'i18next';
import isEqual from '../helpers/isEqual.js';

export default (app) => {
  app
    .get('/tasks', { name: 'tasks', preValidation: app.authenticate }, async (req, reply) => {
      const tasks = await app.objection.models.task.query();
      reply.render('tasks/index', { tasks });
      return reply;
    })
    .get('/tasks/new', { name: 'newTask', preValidation: app.authenticate }, async (req, reply) => {
      const task = new app.objection.models.task();
      task.labels = await app.objection.models.label.query();
      task.statuses = await app.objection.models.taskStatus.query();
      task.users = await app.objection.models.user.query();
      // console.log('!------------->task:', JSON.stringify(task, null, '  '));
      reply.render('tasks/new', { task });
      return reply;
    })
    .get('/tasks/:id/edit', { name: 'editTask', preValidation: app.authenticate }, async (req, reply) => {
      const task = await app.objection.models.task.query().findById(req.params.id);
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
        console.log('!------------->task:', JSON.stringify(task, null, '  '));
        const validTask = await app.objection.models.task.fromJson(task);
        console.log('!------------->validTask:', JSON.stringify(validTask, null, '  '));
        await app.objection.models.task.query().insert(validTask);
        req.flash('info', i18next.t('flash.tasks.create.success'));
        reply.render(app.reverse('tasks'));
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
      try {
        const validTask = await app.objection.models.task.fromJson(req.body.data);
        await task.$query().patch(validTask);
        req.flash('info', i18next.t('flash.tasks.edit.success'));
        const tasks = await app.objection.models.task.query();
        reply.render('tasks/index', { tasks });
      } catch ({ data }) {
        task.$set(req.body.data);
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
        const tasks = await app.objection.models.task.query();
        reply.render('tasks/index', { tasks });
        return reply;
      }
      try {
        await task.$query().delete();
        req.flash('info', i18next.t('flash.tasks.delete.success'));
        const tasks = await app.objection.models.task.query();
        reply.render('tasks/index', { tasks });
      } catch ({ data }) {
        req.flash('error', i18next.t('flash.tasks.delete.error'));
        const tasks = await app.objection.models.task.query();
        reply.render('tasks/index', { tasks, errors: data });
      }
      return reply;
    });
};
