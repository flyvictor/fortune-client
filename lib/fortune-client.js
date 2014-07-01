var when = require("when"),
    requesto = require("requesto"),
    resourceLinker = require("./resource-linker"),
    _ = require("lodash");


module.exports = function(apps){
  var self = {
    resources: []
  };

  self.ready = initApps();

  function initApps(){
    var router = require("./router")();
    
    return when.all(_.map(apps, function(app){
      var resources,
          actions;
      
      
      if(_.isObject(app)){
        resources = app.resources();

        router.registerResources(app,resources);

        return when.resolve(self.resources = _.union(self.resources, resources));
      }else if(_.isString(app)){
        return requesto.get(app + "/resources").then(function(data){
          resources = JSON.parse(data.body).resources;
          
          return self.resources = _.union(self.resources, resources);
        });
      }else{
        throw new Error("App must be a function or an object, got " + typeof app);
      }
    })).then(function(){
      resourceLinker(router);
      _.extend(self,router.actions);
    }).catch(function(err){ console.trace(err); });
  }

  return self;
};
