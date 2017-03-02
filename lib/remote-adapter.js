var when = require('when'),
    request = require('superagent'),
    oauthMiddleware = require('./oauth-middleware').Middleware,
    _ = require('lodash');

var sharedParams;

module.exports = function(host) {
  sharedParams = {};
  if (host.oauth) {
    sharedParams.oauth = Object.assign({}, host.oauth);
  }
  if (host.headers) {
    sharedParams.headers = Object.assign({}, host.headers);
  }
  var url = host.url || host;
  return {
    'get': function(resource, req) {
      var deferred = when.defer();
      var uri = [url, resource, (req.params || {}).id].join('/');
      // var params = Object.assign({
      //   uri: [url, resource, (req.params || {}).id].join('/'),
      //   json: true,
      //   qs: req.query
      // }, sharedParams);
      request.get(uri)
        .set(sharedParams.headers || {})
        .query(req.query || {})
        .use(oauthMiddleware(sharedParams.oauth))
        .end(function(err, data) {
          var body = _.isString(data.text) ? JSON.parse(data.text) : data.text;
          return err ? deferred.reject(err) : deferred.resolve({ body: body });
        });
      return deferred.promise;
    },
    'create': function(resource, req) {
      var deferred = when.defer();
      var uri = [url, resource].join('/');
      // var params = Object.assign({
      //   uri:
      //   json: true,
      //   body: req.body
      // }, sharedParams);
      request.post(uri)
        .set(sharedParams.headers || {})
        .set('Content-type', 'application/json')
        .send(JSON.stringify(req.body))
        .use(oauthMiddleware(sharedParams.oauth))
        .end(function(err, data) {
          var body = _.isString(data.body) ? JSON.parse(data.body) : data.body;
          return err ? deferred.reject(err) : deferred.resolve({ body: body });
        });
      return deferred.promise;
    },
    'destroy': function(resource, req) {
      var deferred = when.defer();
      var uri = [url, resource, (req.params || {}).id].join('/');
      // var params = Object.assign({
      //   uri: [url, resource, (req.params || {}).id].join('/'),
      //   json: true
      // }, sharedParams);
      request.delete(uri)
        .set(sharedParams.headers || {})
        .send(JSON.stringify(req.body))
        .use(oauthMiddleware(sharedParams.oauth))
        .end(function(err, data) {
          var body = _.isString(data.body) ? JSON.parse(data.body) : data.body;
          return err ? deferred.reject(err) : deferred.resolve({ body: body });
        });
      return deferred.promise;
    },
    'replace': function(resource, req) {
      var deferred = when.defer();
      var uri = [url, resource, (req.params || {}).id].join('/');
      // var params = Object.assign({
      //   uri: [url, resource, (req.params || {}).id].join('/'),
      //   json: true,
      //   body: req.body
      // }, sharedParams);
      request.put(uri)
        .set(sharedParams.headers || {})
        .set('Content-type', 'application/json')
        .send(JSON.stringify(req.body))
        .use(oauthMiddleware(sharedParams.oauth))
        .end(function(err, data) {
          var body = _.isString(data.body) ? JSON.parse(data.body) : data.body;
          return err ? deferred.reject(err) : deferred.resolve({ body: body });
        });
      return deferred.promise;
    },
    'update': function(resource, req) {
      var deferred = when.defer();
      var uri = [url, resource, (req.params || {}).id].join('/');
      // var params = Object.assign({
      //   uri: [url, resource, (req.params || {}).id].join('/'),
      //   json: true,
      //   body: req.body
      // }, sharedParams);
      request.patch(uri)
        .set(sharedParams.headers || {})
        .set('Content-type', 'application/json')
        .send(JSON.stringify(req.body))
        .use(oauthMiddleware(sharedParams.oauth))
        .end(function(err, data) {
          var body = _.isString(data.body) ? JSON.parse(data.body) : data.body;
          return err ? deferred.reject(err) : deferred.resolve({ body: body });
        });
      return deferred.promise;
    }
  };
};

module.exports.changeHeader = function(name, value) {
  sharedParams.headers = sharedParams.headers || {};
  sharedParams.headers[name] = value;
};

module.exports.deleteHeader = function(name) {
  if (sharedParams.headers && sharedParams.headers[name])
    delete sharedParams.headers[name];
};
