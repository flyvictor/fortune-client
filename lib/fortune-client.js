var when = require("when"),
    requesto = require("requesto"),
    _ = require("lodash"),
    crud = require("./crud"),
    resourceLinker = require("./resource-linker");

module.exports = function(apps){
  var self = {
    resources: []
  };

  self.ready = initApps();

  function initApps(){
    return when.all(_.map(apps, function(app){
      var resources,
          actions;
      
      if(_.isObject(app)){
        resources = app.resources();

        actions = crud(app, resources);

        _.each(actions, function(action, name){
          crud[name] = function(){
            var result = action.apply(actions, arguments);

            return result.then(function(body){
              return resourceLinker(self, result.req, result.res, body);
            });
          };
        });

        _.extend(self,crud);

        return when.resolve(self.resources = _.union(self.resources, resources));
      }else if(_.isString(app)){
        return requesto.get(app + "/resources").then(function(data){
          resources = JSON.parse(data.body).resources;
          
          //TODO: _.extend(self, crud(app, resources));
          
          return self.resources = _.union(self.resources, resources);
        });
      }else{
        throw new Error("App must be a function or an object, got " + typeof app);
      }
      
    }));
  }

  return self;
};
