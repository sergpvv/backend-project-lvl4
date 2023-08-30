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
    .get('/labels/:id/edit', { preValidation: app.authenticate }, async (req, reply) => {
      const label = await app.objection.models.label.query().findById(req.params.id);
      reply.render('labels/edit', { label });
      return reply;
    })
    .post('/labels', { name: 'createLabel', preValidation: app.authenticate }, async (req, reply) => {
      const label = req.body.data;
      try {
        await app.objection.models.label.query().insert(label);
        req.flash('info', i18next.t('flash.labels.create.success'));
        reply.redirect(app.reverse('labels'));
      } catch (error) {
        console.log(error);
        req.flash('error', i18next.t('flash.labels.create.error'));
        reply.code(422).render('labels/new', { label, errors: error.data });
      }
      return reply;
    })
    .patch('/labels/:id', { preValidation: app.authenticate }, async (req, reply) => {
      const label = await app.objection.models.label.query().findById(req.params.id);
      try {
        await label.$query().patch(req.body.data);
        req.flash('info', i18next.t('flash.labels.edit.success'));
        reply.redirect(app.reverse('labels'));
      } catch (error) {
        console.log(error);
        label.$set(req.body.data);
        req.flash('error', i18next.t('flash.labels.edit.error'));
        reply.code(422).render('labels/edit', { label, errors: error.data });
      }
      return reply;
    })
    .delete('/labels/:id', { preValidation: app.authenticate }, async (req, reply) => {
      try {
        const label = await app.objection.models.label.query().findById(req.params.id);
        await label.$query().delete();
        req.flash('info', i18next.t('flash.labels.delete.success'));
      } catch (error) {
        console.log(error);
        req.flash('error', i18next.t('flash.labels.delete.error'));
      }
      reply.redirect(app.reverse('labels'));
      return reply;
    });
};
