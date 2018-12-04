var when = require("when"),
  resourceLinker = require("./resource-linker"),
  isomorphicClient = require('./isomorphic-http-client'),
  deepFilter = require('./deep-filter'),
  crypto = require("crypto"),
  _ = require("lodash"),
  remoteAdapter = require("./remote-adapter"),  
  utils = require("./util");

module.exports = function(apps, options){
  options = options || {};
  var self = {
    resources: [],
    id: crypto.createHash("md5")
      .update(Math.random().toString()) //not really sure why would that matter, but keep compatible for now
      .update(new Date().getTime().toString())
      .update(_.uniqueId())
      .digest("hex"),
    onRequest: null,
    onResponse: null,
    utils: utils,
  };

  self.ready = initApps();

  function delay(ms) {
    return when.promise(resolve => { setTimeout(resolve, ms) })
  }

  function initApp(app, router, attempt) {
    return when.resolve().then(() => {
      var resources,
        actions;

      if(_.isObject(app) && app.resources){
        resources = app.resources();

        router.registerActions(app.direct, resources);
        router.registerResources(app.direct, resources);
        return when.resolve(self.resources = _.union(self.resources, resources));
      }else if(_.isObject(app) && app.url && app.oauth){
        const request = {
          uri: app.url + '/resources',
          oauth: {
            consumer_key: app.oauth.consumer_key,
            consumer_secret: app.oauth.consumer_secret,
          }
        }
        return isomorphicClient.get(request).then(function(data){
          if (data.statusCode !== 200) throw new Error('Can\'t fetch /resources')
          resources = data.body.resources;

          router.registerActions(remoteAdapter(app), resources);
          router.registerResources(remoteAdapter(app), resources);
          self.changeHeader = remoteAdapter.changeHeader;
          self.deleteHeader = remoteAdapter.deleteHeader;
          return self.resources = _.union(self.resources, resources);
        });
      } else if(_.isString(app)){
        const request = {
          uri: app + '/resources'
        };
        return isomorphicClient.get(request).then(function(data){
          if (data.statusCode !== 200) throw new Error('Can\'t fetch /resources')
          resources = data.body.resources;

          router.registerActions(remoteAdapter(app), resources);
          router.registerResources(remoteAdapter(app), resources);

          return self.resources = _.union(self.resources, resources);
        });
      }else{
        throw new Error("App must be a function or an object, got " + typeof app);
      }
    }).catch(err => {
      if (attempt < 100) {
        return delay(3000).then(() => initApp(app, router, attempt + 1))
      } else {
        throw err
      }
    })
  }


  function initApps(){
    var router = require("./router")();
    
    self.onRequest = router.onRequest;
    self.onResponse = router.onResponse;
    deepFilter.setup(self, options.deepFilter);
    resourceLinker(router);
    router.onResponse(require('./denormalize').denormalize);

    return when.all(_.map(apps, function(app){
      return initApp(app, router, 0)
    })).then(function(){
      return _.extend(self, router.actions);
    }).catch(function(err){ console.trace(err); });
  }

  return self;
};
