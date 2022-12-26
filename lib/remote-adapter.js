const isomorphicClient = require('./isomorphic-http-client');
let sharedParams;

module.exports = function (host) {
  sharedParams = {};
  if (host.oauth) {
    if (!host.oauth.consumer_key) throw new Error('consumer_key is required');
    if (!host.oauth.consumer_secret)
      throw new Error('consumer_secret is required');
    sharedParams.oauth = Object.assign({}, host.oauth);
  }
  if (host.headers) {
    sharedParams.headers = Object.assign({}, host.headers);
  }

  const callAction = function (resource, method, req) {
    return callAnyAction(resource, method, req, false);
  };

  const callGenericAction = function (resource, method, req) {
    return callAnyAction(resource, method, req, true);
  };

  const callAnyAction = function (resource, method, req, isGeneric) {
    const paramsName = isGeneric ? 'action' : 'key';
    if (!req.params || !req.params[paramsName]) {
      return Promise.reject(
        Error(
          `[remote-adapter] - callAction: req must contains parameter ${
            paramsName}`,
        ),
      );
    }
    if (!isGeneric && !req.params.id) {
      return Promise.reject(
        Error(
          '[remote-adapter] - callAction: req must contains parameters id.',
        ),
      );
    }

    const params = Object.assign(
      {
        method: method,
        uri: [
          url,
          resource,
          isGeneric ? 'action' : req.params.id,
          req.params[paramsName],
        ].join('/'),
        json: true,
        body: req.body || null,
        qs: req.query || null,
      },
      sharedParams,
    );

    return isomorphicClient[method.toLowerCase()](params);
  };

  const url = host.url || host;
  return {
    get: function (resource, req) {
      const params = Object.assign(
        {
          uri: [url, resource, (req.params || {}).id].join('/'),
          json: true,
          qs: req.query,
        },
        sharedParams,
      );
      return isomorphicClient.get(params);
    },
    create: function (resource, req) {
      const params = Object.assign(
        {
          uri: [url, resource].join('/'),
          json: true,
          body: req.body,
          qs: req.query || null,
        },
        sharedParams,
      );
      return isomorphicClient.post(params);
    },
    destroy: function (resource, req) {
      const params = Object.assign(
        {
          uri: [url, resource, (req.params || {}).id].join('/'),
          json: true,
        },
        sharedParams,
      );
      return isomorphicClient.delete(params);
    },
    replace: function (resource, req) {
      const params = Object.assign(
        {
          uri: [url, resource, (req.params || {}).id].join('/'),
          json: true,
          body: req.body,
        },
        sharedParams,
      );
      return isomorphicClient.put(params);
    },
    update: function (resource, req) {
      const params = Object.assign(
        {
          uri: [url, resource, (req.params || {}).id].join('/'),
          json: true,
          body: req.body,
        },
        sharedParams,
      );
      return isomorphicClient.patch(params);
    },
    callAction: callAction,
    callGenericAction: callGenericAction,
  };
};

module.exports.changeHeader = function (name, value) {
  sharedParams.headers = sharedParams.headers || {};
  sharedParams.headers[name] = value;
};

module.exports.deleteHeader = function (name) {
  if (sharedParams.headers && sharedParams.headers[name])
    delete sharedParams.headers[name];
};

module.exports.getHeader = function (name) {
  if (sharedParams.headers && sharedParams.headers[name])
    return sharedParams.headers[name];
  return null;
};
