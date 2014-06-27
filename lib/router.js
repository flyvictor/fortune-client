var crudFactory = require("./crud-factory"),
    _ = require("lodash");

module.exports = function(){
  var self = {
    actions: {},
    registerResources: function(app,resources){
      var crud = crudFactory(app, resources);
      
      _.each(crud, function(action, name){
        self.actions[name] = function(){
          return action.apply(crud,arguments)(function(request, dispatch){
            return dispatch().then(function(res){
              return res.body;
            });
          });
        };
      });
    }
  };
  return self;
};
