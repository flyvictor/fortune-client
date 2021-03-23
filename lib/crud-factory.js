var util = require("./util"),
    _ = require("lodash");

module.exports = function(app, resources,actionNames){
  var crud = {
    fancy: {},
    simple: {},
  };

  init();


  function wrapCall(method, resource, request, options){
    options = options || {};
    return function(cb){
      var dispatch = function(){
        return app[method](resource, request).then(function(result) {
          if(result && result.error) throw new Error(result.detail || result.error);
          if(result && result.body && result.body.error) throw new Error(result.body.detail || result.body.error);
          return result;
        });
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
  }

  function makeAction(name, resource){
    return {
      get: function(query,options){
        return wrapCall(name, resource.route, util.toDirectRequest(query,options),options);
      },
      destroy: function(query,options){
        return wrapCall(name, resource.route, util.toDirectRequest(query,options),options);
      },
      create: function(data, options){
        if(!(_.isPlainObject(data)||_.isArray(data))){
          throw new Error("First argument must be an object or an array.");
        }
        return wrapCall(name,
                              resource.route,
                              util.toDirectRequest(null, options, resource.route,data),
                              options);
      },
      replace: function(id, data, options){
        if(util.isCollectionQuery(id)) throw new Error("Collection queries not allowed in replace!");

        return wrapCall(name,
                              resource.route,
                              util.toDirectRequest(id,options,resource.route, data),
                              options);
      },
      update: function(id, data, options){
        if(util.isCollectionQuery(id)) throw new Error("Collection queries not allowed in update!");
        return wrapCall(name, resource.route, util.toDirectRequest(id,options,null,data),options);
      }
    }[name];
  }

  function makePluralAction(name, resource){
    var action = makeAction(name,resource);

    return function(query){
      if(util.isSingleDocQuery(query)){
        console.warn("Single document operations with pluralised actions are deprecated. Use the singularised form. Method = " + name + ", Resource = " + resource.route + ", Query = " + query);
      }
      return action.apply(null,arguments);
    };
  }

  function makeSingularAction(name,resource){
    var action = makeAction(name, resource);

    return function(query){
      if(!util.isSingleDocQuery(query,name)){
        throw new Error("Operating on a collection with a singularised action. Use the pluralised form.");
      }

      return action.apply(null,arguments);
    };
  }

  function init(){
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

  return crud;
};
