// @ts-check

import i18next from 'i18next';

export default (app) => {
  app
    .get('/session/new', { name: 'newSession' }, (req, reply) => {
      // if session cookie exist
      const data = req.session.get('data');
      if (data) {
        console.log('!------->request.session.get(\'data\'):', JSON.stringify(data, null, '  '));
        reply.redirect(app.reverse('users'));
        return reply;
      }

      const signInForm = {};
      reply.render('session/new', { signInForm });
    })
    .post('/session', { name: 'session' }, app.fp.authenticate('form', async (req, reply, err, user) => {
      if (err) {
        return app.httpErrors.internalServerError(err);
      }
      if (!user) {
        const signInForm = req.body.data;
        const errors = {
          email: [{ message: i18next.t('flash.session.create.error') }],
        };
        return reply.render('session/new', { signInForm, errors });
      }
      await req.logIn(user);

      // setup session cookie
      console.log('!---> req.session.set(\'data\', req.body) <---!\n!--->req.body:', JSON.stringify(req.body, null, '  '));
      try {
        req.session.set('data', req.body);
      } catch (err) {
        console.log('!--->req.session.set(\'data\', req.body) failure with err:', JSON.stringify(err, null, '  '));
        return reply.redirect(app.reverse('root'));
      }

      req.flash('success', i18next.t('flash.session.create.success'));
      return reply.redirect(app.reverse('root'));
    }))
    .delete('/session', (req, reply) => {
      req.logOut();
      req.session.delete();
      req.flash('info', i18next.t('flash.session.delete.success'));
      reply.redirect(app.reverse('root'));
    });
};
