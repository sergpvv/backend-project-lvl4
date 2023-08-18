import i18next from 'i18next';

export default (app) => {
  app
    .get('/labels', { name: 'labels', preValidation: app.authenticate }, async (req, reply) => {
      const labels = await app.objection.models.label.query();
      reply.render('labels/index', { labels });
      return reply;
    })
    .get('/labels/new', { name: 'newLabel', preValidation: app.authenticate }, (req, reply) => {
      const label = new app.objection.models.label();
      reply.render('labels/new', { label });
    })
    .get('/labels/:id/edit', { name: 'editLabel', preValidation: app.authenticate }, async (req, reply) => {
      const label = await app.objection.models.label.query().findById(req.params.id);
      reply.render('labels/edit', { label });
      return reply;
    })
    .post('/labels', { name: 'createLabel', preValidation: app.authenticate }, async (req, reply) => {
      const label = req.body.data;
      try {
        const validLabel = await app.objection.models.label.fromJson(label);
        await app.objection.models.label.query().insert(validLabel);
        req.flash('info', i18next.t('flash.labels.create.success'));
        reply.redirect(app.reverse('labels'));
      } catch ({ data }) {
        req.flash('error', i18next.t('flash.labels.create.error'));
        reply.render('labels/new', { label, errors: data });
      }
      return reply;
    })
    .patch('/labels/:id', { name: 'patchLabel', preValidation: app.authenticate }, async (req, reply) => {
      const label = await app.objection.models.label.query().findById(req.params.id);
      try {
        const validLabel = await app.objection.models.label.fromJson(req.body.data);
        await label.$query().patch(validLabel);
        req.flash('info', i18next.t('flash.labels.edit.success'));
        const labels = await app.objection.models.label.query();
        reply.render('labels/index', { labels });
      } catch ({ data }) {
        label.$set(req.body.data);
        req.flash('error', i18next.t('flash.labels.edit.error'));
        reply.render('labels/edit', { label, errors: data });
      }
      return reply;
    })
    .delete('/labels/:id', { name: 'deleteLabel', preValidation: app.authenticate }, async (req, reply) => {
      try {
        const label = await app.objection.models.label.query().findById(req.params.id);
        await label.$query().delete();
        req.flash('info', i18next.t('flash.labels.delete.success'));
        const labels = await app.objection.models.label.query();
        reply.render('labels/index', { labels });
      } catch ({ data }) {
        req.flash('error', i18next.t('flash.labels.delete.error'));
        const labels = await app.objection.models.label.query();
        reply.render('labels/index', { labels, errors: data });
      }
      return reply;
    });
};
