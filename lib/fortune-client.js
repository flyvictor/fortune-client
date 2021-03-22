var when = require("when");
var resourceLinker = require("./resource-linker");
var isomorphicClient = require('./isomorphic-http-client');
var deepFilter = require('./deep-filter');
var CryptoJS = require("crypto-js");
var _ = require("lodash");
var remoteAdapter = require("./remote-adapter");
var utils = require("./util");


module.exports = function(apps, options){
  options = options || {};
  var self = {
    resources: [],
    id: createMd5Hash(),
    onRequest: null,
    onResponse: null,
    utils: utils,
    extendRequestQueryKeys: function(keys) {
      utils.queryKeys = utils.queryKeys.concat(keys);
    }
  };

  self.ready = initApps();

  function createMd5Hash() {
    var md5 = CryptoJS.algo.MD5.create();
    md5.update(Math.random().toString());
    md5.update(new Date().getTime().toString());
    md5.update(_.uniqueId());
    return "" + md5.finalize();
  }

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
    })).then(function(){
      return _.extend(self, router.actions);
    });
  }

  return self;
};
