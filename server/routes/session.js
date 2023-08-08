// @ts-check

import i18next from 'i18next';

export default (app) => {
  app
    .get('/session/new', { name: 'newSession' }, (req, reply) => {
      // if session cookie exist
      const user = req.session.get('data');
      if (user) {
        console.log('!------->request.session.get(\'data\'):', JSON.stringify(user, null, '  '));
        return reply.redirect(app.reverse('users'));
      }

      const signInForm = {};
      return reply.render('session/new', { signInForm });
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
      console.log('!--->user:', JSON.stringify(user, null, '  '));
      console.log('!--->try req.session.set(\'data\', user)');
      try {
        req.session.set('data', user);
        req.flash('success', i18next.t('flash.session.create.success'));
        return reply.redirect(app.reverse('root'));
      } catch (e) {
        console.log('!--->req.session.set(\'data\', user) failure:', JSON.stringify(e, null, '  '));
        return reply.redirect(app.reverse('root'));
      }
    }))
    .delete('/session', (req, reply) => {
      req.logOut();
      req.session.delete();
      req.flash('info', i18next.t('flash.session.delete.success'));
      reply.redirect(app.reverse('root'));
    });
};
