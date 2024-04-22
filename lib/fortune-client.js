const resourceLinker = require('./resource-linker');
const isomorphicClient = require('./isomorphic-http-client');
const deepFilter = require('./deep-filter');
const CryptoJS = require('crypto-js');
const _ = require('lodash');
const remoteAdapterConstructor = require('./remote-adapter');
const utils = require('./util');

module.exports = function (apps, options) {
  options = options || {};
  const self = {
    resources: [],
    id: createMd5Hash(),
    onRequest: null,
    onResponse: null,
    onErrorHook: null,
    utils: utils,
    extendRequestQueryKeys: function (keys) {
      utils.queryKeys = utils.queryKeys.concat(keys);
    },
  };

  self.ready = initApps();

  function createMd5Hash () {
    const md5 = CryptoJS.algo.MD5.create();
    md5.update(Math.random().toString());
    md5.update(new Date().getTime().toString());
    md5.update(_.uniqueId());
    return `${md5.finalize()}`;
  }

  function initApps () {
    const router = require('./router')();

    self.onRequest = router.onRequest;
    self.onResponse = router.onResponse;
    self.onErrorHook = router.onErrorHook;
    deepFilter.setup(self, options.deepFilter);
    resourceLinker(router);
    router.onResponse(require('./denormalize').denormalize);

    return Promise.all(
      _.map(apps, function (app) {
        let resources;

        if (_.isObject(app) && app.resources) {
          resources = app.resources();

          router.registerActions(app.direct, resources);
          router.registerResources(app.direct, resources);
          return Promise.resolve(
            (self.resources = _.union(self.resources, resources)),
          );
        } else if (_.isObject(app)) {
          if (!app.url)
            throw new Error('`app.url` is a required field to init resources.');

          const request = {
            uri: `${app.url}/resources`,
          };

          if (app.oauth) {
            request.oauth = {
              consumer_key: app.oauth.consumer_key,
              consumer_secret: app.oauth.consumer_secret,
            };
          }

          if (app.headers) request.headers = app.headers;

          return isomorphicClient.get(request).then(function (data) {
            if (data.statusCode !== 200)
              throw new Error('Can\'t fetch /resources');
            resources = data.body.resources;

            const {
              remoteAdapter,
              changeHeader,
              deleteHeader,
              getHeader,
              changeUrl,
            } = remoteAdapterConstructor();
            router.registerActions(remoteAdapter(app), resources);
            router.registerResources(remoteAdapter(app), resources);

            self.changeHeader = changeHeader;
            self.deleteHeader = deleteHeader;
            self.getHeader = getHeader;
            self.changeUrl = changeUrl;

            return (self.resources = _.union(self.resources, resources));
          });
        } else if (_.isString(app)) {
          const request = {
            uri: `${app}/resources`,
          };
          return isomorphicClient.get(request).then(function (data) {
            if (data.statusCode !== 200)
              throw new Error('Can\'t fetch /resources');
            resources = data.body.resources;

            const {
              remoteAdapter,
              changeHeader,
              deleteHeader,
              getHeader,
              changeUrl,
            } = remoteAdapterConstructor();
            router.registerActions(remoteAdapter(app), resources);
            router.registerResources(remoteAdapter(app), resources);

            self.changeHeader = changeHeader;
            self.deleteHeader = deleteHeader;
            self.getHeader = getHeader;
            self.changeUrl = changeUrl;

            return (self.resources = _.union(self.resources, resources));
          });
        } else {
          throw new Error(
            `App must be a function or an object, got ${typeof app}`,
          );
        }
      }),
    ).then(function () {
      return _.extend(self, router.actions);
    });
  }

  return self;
};
