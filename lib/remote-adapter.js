var when = require('when'),
    request = require('superagent'),
    oauthMiddleware = require('./oauth-middleware').Middleware,
    normalizeFilterMiddleware = require('./normalize-filter').Middleware,
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

      request.get(uri)
        .set(sharedParams.headers || {})
        .query(req.query || {})
        .use(normalizeFilterMiddleware())
        .use(oauthMiddleware(sharedParams.oauth, req.query))
        .end(function(err, res) {
          if (err) return deferred.reject(err);
          try{
            var body = _.isString(res.text) ? JSON.parse(res.text) : res.text;
            deferred.resolve({ body: body });
          }catch(e){
            deferred.reject(e);
          }
        });
      return deferred.promise;
    },
    'create': function(resource, req) {
      var deferred = when.defer();
      var uri = [url, resource].join('/');
      request.post(uri)
        .set(sharedParams.headers || {})
        .set('Content-Type', 'application/json')
        .send(JSON.stringify(req.body))
        .use(normalizeFilterMiddleware())
        .use(oauthMiddleware(sharedParams.oauth))
        .end(function(err, res) {
          if (err) return deferred.reject(err);
          try{
            var body = _.isString(res.text) ? JSON.parse(res.text) : res.text;
            deferred.resolve({ body: body });
          }catch(e){
            deferred.reject(e);
          }
        });
      return deferred.promise;
    },
    'destroy': function(resource, req) {
      var deferred = when.defer();
      var uri = [url, resource, (req.params || {}).id].join('/');
      request.delete(uri)
        .set(sharedParams.headers || {})
        .use(normalizeFilterMiddleware())
        .use(oauthMiddleware(sharedParams.oauth))
        .end(function(err, res) {
          if (err) return deferred.reject(err);
          if (res.statusCode === 204) return deferred.resolve({});
          try {
            var body = _.isString(res.text) ? JSON.parse(res.text) : res.text;
            deferred.resolve({body: body});
          }catch(e){
            deferred.reject(e);
          }
        });
      return deferred.promise;
    },
    'replace': function(resource, req) {
      var deferred = when.defer();
      var uri = [url, resource, (req.params || {}).id].join('/');
      request.put(uri)
        .set(sharedParams.headers || {})
        .set('Content-Type', 'application/json')
        .send(JSON.stringify(req.body))
        .use(normalizeFilterMiddleware())
        .use(oauthMiddleware(sharedParams.oauth))
        .end(function(err, res) {
          if (err) return deferred.reject(err);
          try{
            var body = _.isString(res.text) ? JSON.parse(res.text) : res.text;
            deferred.resolve({ body: body });
          }catch(e){
            deferred.reject(err);
          }
        });
      return deferred.promise;
    },
    'update': function(resource, req) {
      var deferred = when.defer();
      var uri = [url, resource, (req.params || {}).id].join('/');
      request.patch(uri)
        .set(sharedParams.headers || {})
        .set('Content-Type', 'application/json')
        .send(JSON.stringify(req.body))
        .use(normalizeFilterMiddleware())
        .use(oauthMiddleware(sharedParams.oauth))
        .end(function(err, res) {
          if (err) return deferred.reject(err);
          try{
            var body = _.isString(res.text) ? JSON.parse(res.text) : res.text;
            deferred.resolve({ body: body });
          }catch(e){
            deferred.reject(e);
          }
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
