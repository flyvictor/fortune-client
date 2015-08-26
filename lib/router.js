var crudFactory = require("./crud-factory"),
    when = require("when"),
    _ = require("lodash"),
    pluralize = require("pluralize");

module.exports = function(){
  var onRequestFns = [],
      onResponseFns = [],
      simpleActions = {},
      fluentActions = [],
      actionNames = ["get", "create", "replace", "update", "destroy"];
  
  var self = {
    actions: {},

    registerResources: function(app,resources){
      var crud = crudFactory(app, resources,actionNames);


      _.each( resources, function( resource ){
        var name = resource.name;

        // Building the method
        self.actions[name] = {
          args: [ ],
          get: function( query ){
            // running the method
            this.method = 'get';
            this.args.push( query );
            return self.actions[name];
          },
          fields: function( fieldsArray ){
            this.args.push( { fields: fieldsArray } );
            return self.actions[name];
          },
          execute: function(){
            var route = simpleActions.get [ pluralize( name ) ];
            //return route.apply(route, _.rest(arguments))(actionPipeline);
            return route.apply(route, this.args)(actionPipeline);

          }
        };
      });

      _.each(crud.simple, function(resources,actionName){
        if(!simpleActions[actionName]) simpleActions[actionName] = {};

        _.extend(simpleActions[actionName], resources);
      });


      _.each(crud.fancy, function(action, name){
        self.actions[name] = function(){
          return action.apply(crud.fancy,arguments)(actionPipeline);
        };
      });
    },
    onRequest: function(cb){
      onRequestFns.push(cb);
    },
    onResponse: function(cb){
      onResponseFns.push(cb);
    }
  };

  function buildCallbackChain(callbacks){
    return function(){
      var args = arguments,
          chain = when.resolve();
      
      _.each(callbacks, function(cb){
        chain = chain.then(function(){ return cb.apply(null, args); });
      });
      
      return chain;
    };
  }

  function actionPipeline(config, dispatch){
    var response;
    //make truly private
    return buildCallbackChain(onRequestFns)(config).then(function(){
      return dispatch();
    }).then(function(res){
      response = res;
      return buildCallbackChain(onResponseFns)(config,response);
    }).then(function(){
      return response.body;
    });
  }


  _.each(actionNames, function(actionName){

    self.actions[actionName] = function(resource){
      var route = simpleActions[actionName][resource];
      return route.apply(route, _.rest(arguments))(actionPipeline);
    };
  });

  return self;
};
