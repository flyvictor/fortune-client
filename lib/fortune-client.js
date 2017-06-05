var when = require("when"),
  superagent = require("superagent"),
  resourceLinker = require("./resource-linker"),
  deepFilter = require('./deep-filter'),
  _ = require("lodash"),
  normalizeFilterMiddleware = require('./normalize-filter').Middleware,
  oauthMiddleware = require('./oauth-middleware').Middleware,
  remoteAdapter = require("./remote-adapter"),
  utils = require("./util");

module.exports = function(apps, options){
  options = options || {};
  var self = {
    resources: [],
    id: (process && process.pid && process.pid.toString() || '' ) + _.uniqueId(),
    onRequest: null,
    onResponse: null,
    utils: utils
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
            consumer_secret: app.oauth.consumer_secret
          }
        };

        function getResources(){
          return when.promise(function(resolve){
          superagent
            .get(request.url)
            .use(normalizeFilterMiddleware())
            .use(oauthMiddleware(request.oauth, {}))
            .end(function(err, response){
              if (err) {
                //retry in a second
                return setTimeout(function(){
                  resolve(getResources());
                }, 1000);
              }
              try {
                resources = JSON.parse(response.text).resources;

                router.registerResources(remoteAdapter(app), resources);
                self.changeHeader = remoteAdapter.changeHeader;
                self.deleteHeader = remoteAdapter.deleteHeader;
                self.resources = _.union(self.resources, resources);
                resolve();
              }catch(e){
                console.error(e);
                setTimeout(function() {
                  resolve(getResources());
                }, 1000);
              }
            });
          });
        }

        return getResources();

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
    }).catch(function(err){
      console.trace(err);
      throw err;
    });
  }

  return self;
};
