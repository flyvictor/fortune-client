var util = require("./util"),
    _ = require("lodash"),
    when = require("when");


//TODO: break down into local/remote cruds

var actionNames = ["get", "create", "replace", "update", "destroy"];

module.exports = function(app, resources){
  var crud = {};
  
  if(_.isObject(app)){
    initWithLocalFortune();
  }else{
    initWithRemoteFortune();
  }

  //check if the query is for a whole, possibly filtered collection
  function isCollectionQuery(query){
    return ((query === null) || (query === undefined) || _.isPlainObject(query));
  };

  //check if the query is for a single document only
  function isSingleDocQuery(query,name){
    if(name === "create"){
      return !_.isArray(query);
    }else{
      return _.isString(query) || _.isNumber(query);
    }
  }

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

  function toDirectOptions(query, options, resourceName, data){
    options = _.extend({query: {}, params: {}}, options);
    
    if(isCollectionQuery(query)){
      if(query) options.query.filter = query;
    }else{
      options.params.id = _.isArray(query) ? query.join(",") : query;
    }
    
    if(data){
      data =  _.isArray(data) ? data : [data];
      
      if(resourceName){
        (options.body = {})[resourceName] = data;
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

    return options;
  }

  function makeAction(name, resource){
    return {
      get: function(query,options){
        return wrapDirectCall(name, resource.route, toDirectOptions(query,options));
      },
      destroy: function(query,options){
        return wrapDirectCall(name, resource.route, toDirectOptions(query,options));
      },
      create: function(data, options){
        if(!(_.isPlainObject(data)||_.isArray(data))){
          throw new Error("First argument must be an object or an array.");
        }
        return wrapDirectCall(name, resource.route, toDirectOptions(null, options, resource.route,
                                                                    data));
      },
      replace: function(id, data, options){
        if(isCollectionQuery(id)) throw new Error("Collection queries not allowed in replace!");

        return wrapDirectCall(name, resource.route,
                              toDirectOptions(id,options,resource.route, data));
      },
      update: function(id, data, options){
        if(isCollectionQuery(id)) throw new Error("Collection queries not allowed in update!");
        return wrapDirectCall(name, resource.route, toDirectOptions(id,options,null,data));
      }
    }[name];
  }

  function makePluralAction(name, resource){
    var action = makeAction(name,resource);

    return function(query){
      if(isSingleDocQuery(query)){
        console.warn("Single document operations with pluralised actions are deprecated. "
                     + "Use the singularised form.");
      }
      return action.apply(null,arguments);
    };
  };

  function makeSingularAction(name,resource){
    var action = makeAction(name, resource);

    return function(query){
      if(!isSingleDocQuery(query,name)){
        throw new Error("Operating on a collection with a singularised action. "
                        + "Use the pluralised form.");
      } 

      return action.apply(null,arguments);
    };
  }

  function initWithLocalFortune(){
    //TODO: improve update syntax
    //TODO: wrap responses as models
    _.each(resources, function(resource){
      var plural = util.toCapitalisedCamelCase(resource.route),
          singular = util.toCapitalisedCamelCase(resource.name);
      
      _.each(actionNames, function(name){
        if(plural !== singular){
          crud[name + plural] = makePluralAction(name,resource);
          crud[name + singular] = makeSingularAction(name,resource);
        }else{
          crud[name + plural] = makeAction(name,resource);
        }
      });
    });
  }

  function initWithRemoteFortune(){
    throw new Error("initWithRemoteFortune not implemented");
  }

  return crud;
};
