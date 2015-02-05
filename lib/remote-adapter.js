var when = require("when"),
    request = require("request");

module.exports = function(host) {
  return {
    'get': function(resource, req) {
      var deferred = when.defer();
      request({
        method: "GET",
        uri: [host, resource, (req.params || {}).id].join('/'),
        qs: req.query
      }, function(err, data) {
        return err ? deferred.reject(err) : deferred.resolve({ body: JSON.parse(data.body) });
      });
      return deferred.promise;
    },
    'create': function(resource, req) {
      var deferred = when.defer();
      request({
        method: "POST",
        uri: [host, resource].join('/'),
        json: true,
        body: req.body
      }, function(err, data) {
        return err ? deferred.reject(err) : deferred.resolve({ body: data.body });
      });
      return deferred.promise;
    },
    'destroy': function(resource, req) {
      var deferred = when.defer();

      request({
        method: "DELETE",
        uri: [host, resource, (req.params || {}).id].join('/'),
        json: true
      }, function(err, data) {
        return err ? deferred.reject(err) : deferred.resolve({ body: data.body });
      });
      return deferred.promise;
    },
    'replace': function(resource, req) {
      var deferred = when.defer();
      request({
        method: "PUT",
        uri: [host, resource, (req.params || {}).id].join('/'),
        json: true,
        body: req.body
      }, function(err, data) {
        return err ? deferred.reject(err) : deferred.resolve({ body: data.body });
      });
      return deferred.promise;
    },
    'update': function(resource, req) {
      var deferred = when.defer();
      request({
        method: "PATCH",
        uri: [host, resource, (req.params || {}).id].join('/'),
        json: true,
        body: req.body
      }, function(err, data) {
        return err ? deferred.reject(err) : deferred.resolve({ body: data.body });
      });
      return deferred.promise;
    }
  };
};
