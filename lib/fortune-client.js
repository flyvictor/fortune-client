var when = require("when"),
    requesto = require("requesto"),
    request = require("request"),
    resourceLinker = require("./resource-linker"),
    crypto = require("crypto"),
    _ = require("lodash"),
    querystring = require('querystring');

module.exports = function(apps){
  var self = {
    resources: [],
    id: crypto.createHash("md5")
      .update(process.pid.toString())
      .update(new Date().getTime().toString())
      .update(_.uniqueId())
      .digest("hex"),
    onRequest: null,
    onResponse: null
  };

  self.ready = initApps();

  function initApps(){
    var router = require("./router")();
    self.onRequest = router.onRequest;
    self.onResponse = router.onResponse;

    return when.all(_.map(apps, function(app){
      var resources,
          actions;
      
      if(_.isObject(app)){
        resources = app.resources();

        router.registerResources(app.direct, resources);

        return when.resolve(self.resources = _.union(self.resources, resources));
      }else if(_.isString(app)){
        return requesto.get(app + "/resources").then(function(data){
          resources = JSON.parse(data.body).resources;

          newApp = {
            'get': function(resource, req) {
              var deferred = when.defer();
              request({
                method: "GET",
                uri: [app, resource, (req.params || {}).id].join('/'),
                qs: req.query
              }, function(err, data) {
                return err ? deferred.reject(err) : deferred.resolve({ body: JSON.parse(data.body) });
              })
              return deferred.promise;
            },
            'create': function(resource, req) {
              var deferred = when.defer();
              request({
                method: "POST",
                uri: [app, resource].join('/'),
                json: true,
                body: req.body
              }, function(err, data) {
                return err ? deferred.reject(err) : deferred.resolve({ body: data.body });
              })
              return deferred.promise;
            },
            'destroy': function(resource, req) {
              var deferred = when.defer();

              request({
                method: "DELETE",
                uri: [app, resource, (req.params || {}).id].join('/'),
                json: true
              }, function(err, data) {
                return err ? deferred.reject(err) : deferred.resolve({ body: data.body });
              })
              return deferred.promise;
            },
            'replace': function(resource, req) {
              var deferred = when.defer();
              request({
                method: "PUT",
                uri: [app, resource, (req.params || {}).id].join('/'),
                json: true,
                body: req.body
              }, function(err, data) {
                return err ? deferred.reject(err) : deferred.resolve({ body: data.body });
              })
              return deferred.promise;
            },
            'update': function(resource, req) {
              var deferred = when.defer();
              request({
                method: "PATCH",
                uri: [app, resource, (req.params || {}).id].join('/'),
                json: true,
                body: req.body
              }, function(err, data) {
                return err ? deferred.reject(err) : deferred.resolve({ body: data.body });
              })
              return deferred.promise;
            },
          }
          
          router.registerResources(newApp, resources);

          return self.resources = _.union(self.resources, resources);
        });
      }else{
        throw new Error("App must be a function or an object, got " + typeof app);
      }
    })).then(function(){
      resourceLinker(router);
      return _.extend(self,router.actions);
    }).catch(function(err){ console.trace(err); });
  }

  return self;
};
