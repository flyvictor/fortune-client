var when = require("when"),
  requesto = require("requesto"),
  request = require("request"),
  resourceLinker = require("./resource-linker"),
  deepFilter = require('./deep-filter'),
  crypto = require("crypto"),
  _ = require("lodash"),
  remoteAdapter = require("./remote-adapter");

module.exports = function(apps, options){
  options = options || {};
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
    deepFilter.setup(self, options.deepFilter);
    resourceLinker(router);
    router.onResponse(require('./denormalize').denormalize);

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

          router.registerResources(remoteAdapter(app), resources);

          return self.resources = _.union(self.resources, resources);
        });
      }else{
        throw new Error("App must be a function or an object, got " + typeof app);
      }
    })).then(function(){
      return _.extend(self,router.actions);
    }).catch(function(err){ console.trace(err); });
  }

  return self;
};
