var util = require("./util"),
    _ = require("lodash"),
    when = require("when");

module.exports = function(app, resources){
  var crud = {};
  
  if(_.isObject(app)){
    initWithLocalFortune();
  }else{
    initWithRemoteFortune();
  }

  function isCollectionQuery(query){
    return ((query === null) || (query === undefined) || _.isPlainObject(query));
  };

  var wrapDirectCall = function(method, route, options){
    return function(cb){
      var dispatch = function(){ return app.direct[method](route, options); };

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

  function initWithLocalFortune(){
    //TODO: improve update syntax
    //TODO: create singular/plural versions of these (?)
    //TODO: wrap responses as models
    _.each(resources, function(resource){
      crud["get" + util.capitalise(resource.route)] = function(query,options){
        options = options || {};
        options[isCollectionQuery(query) ? "query" : "id"] = query;

        return wrapDirectCall("get", resource.route, options);
      };
      crud["create" + util.capitalise(resource.route)] = function(data, options){
        options = options || {};
        options.body = {};
        options.body[resource.route] = _.isArray(data) ? data : [data];

        return wrapDirectCall("create", resource.route, options);
      };
      crud["destroy" + util.capitalise(resource.route)] = function(query,options){
        options = options || {};
        options[isCollectionQuery(query) ?  "query" : "id"] = query;

        return wrapDirectCall("destroy", resource.route, options);
      };
      crud["replace" + util.capitalise(resource.route)] = function(id, data, options){
        options = _.extend({}, { id: id, body: {} }, options);
        options.body[resource.route] = _.isArray(data) ? data : [data];

        return wrapDirectCall("replace", resource.route, options);
      };
      crud["update" + util.capitalise(resource.route)] = function(id, data, options){
        options = _.extend({}, { id: id, body: _.isArray(data) ? data : [data] }, options);

        return wrapDirectCall("update", resource.route, options);
      };
    });
  }

  function initWithRemoteFortune(){
    throw new Error("initWithRemoteFortune not implemented");
  }

  return crud;
};
