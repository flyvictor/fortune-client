var util = require("./util"),
    _ = require("lodash"),
    when = require("when");

module.exports = function(app, resources, fortuneClient){
  var crud = {};
  
  if(_.isObject(app)){
    initWithLocalFortune();
  }else{
    initWithRemoteFortune();
  }

  function isCollectionQuery(query){
    return ((query === null) || (query === undefined) || _.isPlainObject(query));
  };

  function wrapDirectCall(method, route, options){
    return function(cb){
      var dispatch = function(){
        return app.direct[method](route, options);
      };

      if(!cb){
        return dispatch();
      }else{
        return cb({
          route: route,
          method: method,
          options: options
        }, dispatch);
      }
    };
  };

  function toDirectOptions(query, options, route, data){
    options = _.extend({query: {}, params: {}}, options);
    
    if(isCollectionQuery(query)){
      if(query) options.query.filter = query;
    }else{
      options.params.id = _.isArray(query) ? query.join(",") : query;
    }
    
    if(data){
      data =  _.isArray(data) ? data : [data];
      
      if(route){
        (options.body = {})[route] = data;
      }else{
        options.body = data;
      }
    }

    _.each(["include", "fields"], function(keyword){
      if(options[keyword]){
        options.query[keyword] = options[keyword];
        delete options[keyword];
      }

      var kArgs = options.query[keyword];

      if(kArgs && _.isArray(kArgs)){
        options.query[keyword] = kArgs.join(",");
      }
    });

    if (fortuneClient){
      options.security = options.security || {};
      options.security.requestedWith = fortuneClient.id;
    }

    return options;
  }

  function initWithLocalFortune(){
    //TODO: improve update syntax
    //TODO: create singular/plural versions of these (?)
    //TODO: wrap responses as models
    _.each(resources, function(resource){
      crud["get" + util.toCapitalisedCamelCase(resource.route)] = function(query,options){
        return wrapDirectCall("get", resource.route, toDirectOptions(query, options));
      };
      crud["create" + util.toCapitalisedCamelCase(resource.route)] = function(data, options){
        options = toDirectOptions(null,options,resource.route,data);
        return wrapDirectCall("create", resource.route, options);
      };
      crud["destroy" + util.toCapitalisedCamelCase(resource.route)] = function(query,options){
        return wrapDirectCall("destroy", resource.route, toDirectOptions(query,options));
      };
      crud["replace" + util.toCapitalisedCamelCase(resource.route)] = function(id, data, options){
        options = toDirectOptions(id,options,resource.route,data);

        return wrapDirectCall("replace", resource.route, options);
      };
      crud["update" + util.toCapitalisedCamelCase(resource.route)] = function(id, data, options){
        options = toDirectOptions(id,options,null,data);

        return wrapDirectCall("update", resource.route, options);
      };
    });
  }

  function initWithRemoteFortune(){
    throw new Error("initWithRemoteFortune not implemented");
  }

  return crud;
};
