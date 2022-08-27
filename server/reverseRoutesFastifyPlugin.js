import fp from 'fastify-plugin';
import pathToRegexp from 'path-to-regexp';

export const routes = new Map();

export function reverse(name, args, opts) {
  const toPath = routes.get(name);

  if (!toPath) {
    throw new Error(`Route with name ${name} is not registered`);
  }

  return toPath(args, opts);
}

/*
function handleOnRoute(routeOptions) {

  console.log('routeOptions:', JSON.stringify(routeOptions, null, '    '));
  if (routeOptions.name) {
    if (routes.has(routeOptions.name)) {

      // throw new Error(
      //   `Route with name ${routeOptions.name} already registered`,
      // );

      console.error(`Route with name ${routeOptions.name} already registered`);
      return;
    }

    routes.set(routeOptions.name, pathToRegexp.compile(routeOptions.url));
  }
}
*/

function plugin(fastify, _, next) {
  fastify.decorate('reverse', reverse);
  fastify.addHook('onRoute', ({ name, url }) => {
    if (name && !routes.has(name)) {
      routes.set(name, pathToRegexp.compile(url));
    }
  });
  // fastify.addHook('onRoute', handleOnRoute);
  next();
}

export default fp(plugin, {
  fastify: '>= 4.0.0',
  name: 'reverse',
});
