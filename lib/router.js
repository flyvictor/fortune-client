const crudFactory = require("./crud-factory");
const actionsFactory = require("./actions-factory");
const _ = require("lodash");

module.exports = function(){
  const onRequestFns = [],
    onResponseFns = [],
    simpleActions = {},
    actionNames = ["get", "create", "replace", "update", "destroy"];
  let onErrorHook = null;

  const self = {
    actions: {},

    registerResources: function(app,resources){
      const crud = crudFactory(app, resources,actionNames);

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

    registerActions: function(app,resources){
      const myActions = actionsFactory(app, resources);

      _.each(myActions.list, function(action, name){
        self.actions[name] = function(){
          return action.apply(myActions.list,arguments)(actionPipeline);
        };
      });
    },

    onRequest: function(cb){
      onRequestFns.push(cb);
    },
    onResponse: function(cb){
      onResponseFns.push(cb);
    },
    onErrorHook: function(cb){
      if (!!onErrorHook) throw new Error('On error hook is already defined');
      onErrorHook = cb;
    },
  };

  function buildCallbackChain(callbacks){
    return function(){
      const args = arguments;
      let chain = Promise.resolve();

      _.each(callbacks, function(cb){
        chain = chain.then(function(){ return cb.apply(null, args); });
      });

      return chain;
    };
  }

  function actionPipeline(config, dispatch){
    let response;

    const wrappedDispatch = () => {
      return dispatch().catch(err => {
        const continueWithError = () => {
          throw err;
        }
        if (onErrorHook) {
          return onErrorHook(err, wrappedDispatch, continueWithError);
        }
        continueWithError();
      });
    }

    //make truly private
    return buildCallbackChain(onRequestFns)(config).then(function(){
      return wrappedDispatch();
    }).then(function(res){
      response = res;
      return buildCallbackChain(onResponseFns)(config,response);
    }).then(function(){
      return response.body;
    });
  }

  _.each(actionNames, function(actionName){
    self.actions[actionName] = function(resource){
      const route = simpleActions[actionName][resource];
      return route.apply(route, _.tail(arguments))(actionPipeline);
    };
  });

  return self;
};
