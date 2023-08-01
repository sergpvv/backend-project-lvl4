// @ts-check

import i18next from 'i18next';

export default (app) => {
  app
    .get('/users', { name: 'users' }, async (req, reply) => {
      const users = await app.objection.models.user.query();
      reply.render('users/index', { users });
      return reply;
    })
    .get('/users/new', { name: 'newUser' }, (req, reply) => {
      const user = new app.objection.models.user();
      reply.render('users/new', { user });
    })
    .post('/users', async (req, reply) => {
      const user = new app.objection.models.user();
      user.$set(req.body.data);
      console.log('!--->user: ', JSON.stringify(user, null, '  '));

      try {
        const validUser = await app.objection.models.user.fromJson(req.body.data);
        console.log('!--->validUser: ', JSON.stringify(validUser, null, '  '));
        await app.objection.models.user.query().insert(validUser);
        req.flash('info', i18next.t('flash.users.create.success'));
        reply.redirect(app.reverse('root'));
      } // catch ({ data }) {
      catch (e) {
        console.error('!--->error: ', JSON.stringify(e, null, '  '));
        const { data } = e;
        console.error('!------>data: ', JSON.stringify(data, null, '  '));
        req.flash('error', i18next.t('flash.users.create.error'));
        reply.render('users/new', { user, errors: data });
      }

      return reply;
    });
};
