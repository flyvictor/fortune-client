var when = require("when"),
  superagent = require("superagent"),
  resourceLinker = require("./resource-linker"),
  deepFilter = require('./deep-filter'),
  _ = require("lodash"),
  remoteAdapter = require("./remote-adapter");

module.exports = function(apps, options){
  options = options || {};
  var self = {
    resources: [],
    id: process.pid.toString() + _.uniqueId(),
    onRequest: null,
    onResponse: null
  };

  self.ready = initApps();


  function initApps(){
    var router = require("./router")();
    self.onRequest = router.onRequest;
    self.onResponse = router.onResponse;
    deepFilter.setup(self, options.deepFilter);
    resourceLinker(router);
    router.onResponse(require('./denormalize').denormalize);

    return when.all(_.map(apps, function(app){
      var resources,
        actions;

      if(_.isObject(app) && app.resources){
        resources = app.resources();

        router.registerResources(app.direct, resources);

        return when.resolve(self.resources = _.union(self.resources, resources));
      }else if(_.isObject(app) && app.url && app.oauth){
        var request = {
          url: app.url + '/resources',
          oauth: {
            consumer_key: app.oauth.consumer_key,
            consumer_secret: app.oauth.consumer_secret,
          }
        }
        return request.get(request).then(function(data){
          resources = JSON.parse(data.body).resources;

          router.registerResources(remoteAdapter(app), resources);
          self.changeHeader = remoteAdapter.changeHeader;
          self.deleteHeader = remoteAdapter.deleteHeader;
          return self.resources = _.union(self.resources, resources);
        });
      } else if(_.isString(app)){
        var deferred = when.defer();
        superagent.get(app + "/resources").end(function(err, data) {
          if (err) return deferred.reject(err);
          resources = JSON.parse(data.text).resources;
          router.registerResources(remoteAdapter(app), resources);

          self.resources = _.union(self.resources, resources);
          deferred.resolve(self.resources);
        });
        return deferred.promise;
      }else{
        throw new Error("App must be a function or an object, got " + typeof app);
      }
    })).then(function(){
      return _.extend(self,router.actions);
    }).catch(function(err){ console.trace(err); });
  }

  return self;
};
