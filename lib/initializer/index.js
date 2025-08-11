const resourceLinker = require('../resource-linker');
const deepFilter = require('../deep-filter');
const _ = require('lodash');
const routerFactory = require('../router');
const denormalize = require('../denormalize').denormalize;
const initializeByFortuneApp = require('./initialize-by-fortune-app');
const initializeByHttpRequest = require('./initialize-by-http-request');

function shouldInitAppByHttpRequest(app) {
  return _.isString(app) || _.isObject(app);
}

/**
 * If the app is an object the app has a `fortune.resources` method.
 *
 * @param {*} app
 * @returns
 */
function shouldInitAppByFortune(app) {
  return _.isObject(app) && _.isFunction(app.resources);
}

function firstAppsInit({ context, apps, options, router }) {
  context.onRequest = router.onRequest;
  context.onResponse = router.onResponse;
  context.onErrorHook = router.onErrorHook;
  deepFilter.setup(context, options.deepFilter);
  resourceLinker(router);
  router.onResponse(denormalize);

  return initApps({ context, apps, router, cache: options.persistentCache });
}

async function initApps({ context, apps, router, cache, skipCache = false }) {
  await Promise.all(
    _.map(apps, async function (app) {
      let resources;

      if (shouldInitAppByFortune(app)) {
        resources = initializeByFortuneApp.init({ router, app });
      } else if (shouldInitAppByHttpRequest(app)) {
        resources = await initializeByHttpRequest.init({
          router,
          app,
          context,
          cache,
          skipCache,
        });
      } else {
        throw new Error(
          `App must be a function or an object, got ${typeof app}`,
        );
      }
      context.resources = _.uniq(
        _.union(context.resources, resources),
        'route',
      );
    }),
  );

  return _.extend(context, router.actions);
}

function initGetResources(apps) {
  const fetchResourcesCbs = apps.map(function (app) {
    if (shouldInitAppByFortune(app)) {
      return () => initializeByFortuneApp.getResources(app);
    } else if (shouldInitAppByHttpRequest(app)) {
      return () => initializeByHttpRequest.getResources(app);
    } else {
      throw new Error(`App must be a function or an object, got ${typeof app}`);
    }
  });

  return async () => {
    const result = await Promise.all(_.map(fetchResourcesCbs, (cb) => cb()));
    return _.flatten(result);
  };
}

module.exports = (context, apps, options) => {
  const router = routerFactory();

  context.getResources = initGetResources(apps);
  context.ready = firstAppsInit({ context, apps, options, router });

  const proxiedContext = new Proxy(context, {
    get: (target, prop) => {
      if (prop === 'then' || prop === 'catch' || prop === 'finally') {
        return target[prop];
      }

      if (target[prop] === undefined) {
        return async (...args) => {
          context.ready = initApps({
            context,
            apps,
            router,
            cache: options.persistentCache,
            skipCache: true,
          });

          await context.ready;

          if (target[prop] === undefined) {
            console.log(context);
            throw new Error(
              `Method ${prop} is not defined on Fortune client context.`,
            );
          }

          return target[prop](...args);
        };
      }
      return target[prop];
    },
  });

  return proxiedContext;
};
