var crudFactory = require("./crud-factory"),
    when = require("when"),
    _ = require("lodash");

module.exports = function(){
  var self = {
    actions: {},
    _onRequestFns: [],
    _onResponseFns: [],
    registerResources: function(app,resources){
      var crud = crudFactory(app, resources);
      
      _.each(crud, function(action, name){
        self.actions[name] = function(){
          return action.apply(crud,arguments)(function(config, dispatch){
            var response;
            return self._buildCallbackChain(self._onRequestFns)(config).then(function(){
              return dispatch();
            }).then(function(res){
              response = res;
              return self._buildCallbackChain(self._onResponseFns)(config,response);
            }).then(function(){
              return response.body;
            });
          });
        };
      });
    },
    onRequest: function(cb){
      self._onRequestFns.push(cb);
    },
    onResponse: function(cb){
      self._onResponseFns.push(cb);
    },
    _buildCallbackChain: function(callbacks){
      return function(){
        var args = arguments,
            chain = when.resolve();
        
        _.each(callbacks, function(cb){
          chain = chain.then(function(){ return cb.apply(null, args); });
        });
        
        return chain;
      };
    }
  };
  return self;
};
