import i18next from 'i18next';
import isEqual from '../helpers/isEqual.js';

export default (app) => {
  app
    .get('/tasks', { name: 'tasks' }, async (req, reply) => {
      const tasks = await app.objection.models.task.query();
      reply.render('tasks/index', { tasks });
      return reply;
    })
    .get('/tasks/new', { name: 'newTask' }, (req, reply) => {
      const task = new app.objection.models.task();
      reply.render('tasks/new', { task });
    })
    .get('/tasks/:id/edit', { name: 'editTask', preValidation: app.authenticate }, async (req, reply) => {
      const task = await app.objection.models.task.query().findById(req.params.id);
      reply.render('tasks/edit', { task });
      return reply;
    })
    .post('/tasks', { name: 'createNewTask' }, async (req, reply) => {
      try {
        const validTask = await app.objection.models.task.fromJson({
          creatorId: req.session.get('userId'),
          ...req.body.data,
        });
        await app.objection.models.task.query().insert(validTask);
        req.flash('info', i18next.t('flash.tasks.create.success'));
        reply.render(app.reverse('tasks'));
      } catch ({ data }) {
        req.flash('error', i18next.t('flash.tasks.create.error'));
        reply.render('tasks/new', { task: req.body.data, errors: data });
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
