var util = require("./util"),
    _ = require("lodash"),
    when = require("when");

module.exports = function(app, resources){
  var self = {};
  
  if(_.isObject(app)){
    initWithLocalFortune();
  }else{
    initWithRemoteFortune();
  }

  function initWithLocalFortune(){
    //TODO: improve update syntax
    //TODO: create singular/plural versions of these (?)
    //TODO: wrap responses as models
    _.each(resources, function(resource){
      self["get" + util.capitalise(resource.route)] = function(query,options){
        return app.direct.get(resource.route, query, options);
      };
      self["create" + util.capitalise(resource.route)] = function(data, options){
        return app.direct.create(resource.route, data, options);
      };
      self["destroy" + util.capitalise(resource.route)] = function(query,options){
        return app.direct.destroy(resource.route, query, options);
      };
      self["replace" + util.capitalise(resource.route)] = function(id, data, options){
        return app.direct.replace(resource.route, id, data, options);
      };
      self["update" + util.capitalise(resource.route)] = function(id, data, options){
        return app.direct.update(resource.route, id, data, options);
      };
    });
  }

  function initWithRemoteFortune(){
    throw new Error("initWithRemoteFortune not implemented");
  }

  return self;
};
