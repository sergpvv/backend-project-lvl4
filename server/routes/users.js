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
      // return reply;
    })
    .get('/users/:id/edit', { name: 'editUser' }, async (req, reply) => {
      const { id } = req.params;
      const user = await app.objection.models.user.query().findById(id);
      // console.log('!------------->user:', JSON.stringify(user, '  ', null));
      reply.render('users/edit', { user });
      return reply;
    })
    .post('/users', { name: 'createUser' }, async (req, reply) => {
      const user = new app.objection.models.user();
      user.$set(req.body.data);
      try {
        const validUser = await app.objection.models.user.fromJson(req.body.data);
        await app.objection.models.user.query().insert(validUser);
        req.flash('info', i18next.t('flash.users.create.success'));
        reply.redirect(app.reverse('root'));
      } catch ({ data }) {
        req.flash('error', i18next.t('flash.users.create.error'));
        reply.render('users/new', { user, errors: data });
      }
      return reply;
    })
    .post('/users/:id', { name: 'patchUser' }, async (req, reply) => {
      const { id } = req.params;
      const {
        body, query, params, headers,
      } = req;
      const request = {
        body, query, params, headers,
      };
      const {
        firstName, lastName, email, password,
      } = req.body.data;
      const user = {
        firstName, lastName, email, password,
      };
      console.log('!----------->request:', JSON.stringify(request, '  ', null));
      // const user = await app.objection.models.user.query().findById(id);
      try {
        const validUser = await app.objection.models.user.fromJson(req.body.data);
        await app.objection.models.user.query().findById(id).patch(validUser);
        req.flash('info', i18next.t('flash.users.edit.success'));
        reply.redirect(app.reverse('/users'));
      // } catch ({ data }) {
      } catch (e) {
        const { data } = e;
        console.error('!----------->error:', JSON.stringify(e, '  ', null));
        req.flash('error', i18next.t('flash.users.edit.error'));
        reply.render('users/edit', { user, errors: data });
      }
      return reply;
    /* })

    .all('/users/:id', (req, reply) => {
      const {
        body, query, params, headers,
      } = req;
      const request = {
        body, query, params, headers,
      };
      console.log('!----------->request:', JSON.stringify(request, '  ', null));
      reply.render('/'); */
    });
};
