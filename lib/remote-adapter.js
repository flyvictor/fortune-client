var when = require('when'),
    request = require('request');

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
      var params = Object.assign({
        uri: [url, resource, (req.params || {}).id].join('/'),
        json: true,
        qs: req.query
      }, sharedParams);
      request.get(params, function(err, data) {
        return err ? deferred.reject(err) : deferred.resolve({ body: data.body });
      });
      return deferred.promise;
    },
    'create': function(resource, req) {
      var deferred = when.defer();
      var params = Object.assign({
        uri: [url, resource].join('/'),
        json: true,
        body: req.body
      }, sharedParams);
      request.post(params, function(err, data) {
        return err ? deferred.reject(err) : deferred.resolve({ body: data.body });
      });
      return deferred.promise;
    },
    'destroy': function(resource, req) {
      var deferred = when.defer();

      var params = Object.assign({
        uri: [url, resource, (req.params || {}).id].join('/'),
        json: true
      }, sharedParams);
      request.delete(params, function(err, data) {
        return err ? deferred.reject(err) : deferred.resolve({ body: data.body });
      });
      return deferred.promise;
    },
    'replace': function(resource, req) {
      var deferred = when.defer();
      var params = Object.assign({
        uri: [url, resource, (req.params || {}).id].join('/'),
        json: true,
        body: req.body
      }, sharedParams);
      request.put(params, function(err, data) {
        return err ? deferred.reject(err) : deferred.resolve({ body: data.body });
      });
      return deferred.promise;
    },
    'update': function(resource, req) {
      var deferred = when.defer();
      var params = Object.assign({
        uri: [url, resource, (req.params || {}).id].join('/'),
        json: true,
        body: req.body
      }, sharedParams);
      request.patch(params, function(err, data) {
        return err ? deferred.reject(err) : deferred.resolve({ body: data.body });
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
