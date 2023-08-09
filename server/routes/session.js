// @ts-check

import i18next from 'i18next';

export default (app) => {
  app
    .get('/session/new', { name: 'newSession' }, (req, reply) => {
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
        reply.render('session/new', { signInForm, errors });
        return reply;
      }
      await req.logIn(user);
      // console.log('!--->user:', JSON.stringify(user, null, '  '), '\n---logged in!');
      req.session.set('userId', user.id);
      req.flash('success', i18next.t('flash.session.create.success'));
      reply.redirect(app.reverse('root'));
      return reply;
    }))
    .delete('/session', (req, reply) => {
      req.logOut();
      req.session.delete();
      req.flash('info', i18next.t('flash.session.delete.success'));
      reply.redirect(app.reverse('root'));
    });
};
