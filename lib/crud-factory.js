var util = require("./util"),
    _ = require("lodash"),
    when = require("when");


//TODO: break down into local/remote cruds

module.exports = function(app, resources,actionNames){
  var crud = {
    fancy: {},
    simple: {}
  };
  
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

  function wrapDirectCall(method, resource, request, options){
    options = options || {};
    return function(cb){
      var dispatch = function(){
        return app[method](resource, request);
      };

      if(!cb){
        return dispatch();
      }else{
        return cb({
          resource: resource,
          method: method,
          request: request,
          parentRequest: options.parentRequest
        }, dispatch);
      }
    };
  };

  function toDirectRequest(query, options, resourceName, data){
    options = options || {};
    //REFACTOR: bit ugly this extend...
    var request = _.extend({query: {}, params: {}}, _.omit(options, "linked"));
    
    if(isCollectionQuery(query)){
      if(query) request.query.filter = query;
    }else{
      request.params.id = _.isArray(query) ? query.join(",") : query;
    }
    
    if(data){
      data =  _.isArray(data) ? data : [data];
      
      if(resourceName){
        (request.body = {})[resourceName] = data;
      }else{
        request.body = data;
      }

      if(options.linked) request.body.linked = options.linked;
    }

    if (!_.isUndefined(request.includeDeleted)){
      request.query.includeDeleted = true;
    }
    if (!_.isUndefined(request.destroy)){
      request.query.destroy = true;
    }

    _.each(["include", "fields", "sort", "limit"], function(keyword){
      if(request[keyword]){
        request.query[keyword] = request[keyword];
        delete request[keyword];
      }

      var kArgs = request.query[keyword];

      if(kArgs && _.isArray(kArgs)){
        request.query[keyword] = kArgs.join(",");
      }
    });

    return request;
  }

  function makeAction(name, resource){
    /*NOTE: in all of these, 'options' should thought of as fortune-client settings rather than
     * something that is meant to go through directly into fortune direct calls
     */
    return {
      get: function(query,options){
        return wrapDirectCall(name, resource.route, toDirectRequest(query,options),options);
      },
      destroy: function(query,options){
        return wrapDirectCall(name, resource.route, toDirectRequest(query,options),options);
      },
      create: function(data, options){
        if(!(_.isPlainObject(data)||_.isArray(data))){
          throw new Error("First argument must be an object or an array.");
        }
        return wrapDirectCall(name,
                              resource.route,
                              toDirectRequest(null, options, resource.route,data),
                              options);
      },
      replace: function(id, data, options){
        if(isCollectionQuery(id)) throw new Error("Collection queries not allowed in replace!");

        return wrapDirectCall(name,
                              resource.route,
                              toDirectRequest(id,options,resource.route, data),
                              options);
      },
      update: function(id, data, options){
        if(isCollectionQuery(id)) throw new Error("Collection queries not allowed in update!");
        return wrapDirectCall(name, resource.route, toDirectRequest(id,options,null,data),options);
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
    _.each(resources, function(resource){
      var plural = util.toCapitalisedCamelCase(resource.route),
          singular = util.toCapitalisedCamelCase(resource.name);

      _.each(actionNames, function(name){
        (crud.simple[name] = crud.simple[name] || {})[resource.route] = makeAction(name,resource);
        
        if(plural !== singular){
          crud.fancy[name + plural] = makePluralAction(name,resource);
          crud.fancy[name + singular] = makeSingularAction(name,resource);
        }else{
          crud.fancy[name + plural] = crud.simple[name][resource.route];
        }
      });
    });

    //OPTIMISE: calling makeAction on every request looks suboptimal
    
    _.each(actionNames, function(name){
      crud[name] = function(route){
        return makeAction(name, {route: route}).apply(crud, _.rest(arguments));
      };
    });
  }

  function initWithRemoteFortune(){
    throw new Error("initWithRemoteFortune not implemented");
  }

  return crud;
};
