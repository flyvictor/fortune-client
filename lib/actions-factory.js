var util = require("./util"),
_ = require("lodash"),
when = require("when");

module.exports  = function(app, resources){
    var actions = {
        list:  {}
    };

    function wrapCall(method, resource, request, options){
        options = options || {};
        
        return function(cb){
        var dispatch = function(){
            return app["callAction"](resource, method,request).then(function(result) {
            if(result && result.error) throw new Error(result.detail || result.error);
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

    function makeAction(resource, actionName, action){

        return function(resourceId, data, options){
            
            var methodName = action.method ? action.method.toUpperCase() : "POST";
            var dataBody = data && data.body;

            var request = util.toDirectRequest(resourceId || null, options, null, dataBody); 
            
            if([null, void 0].indexOf(request.params) !== -1) throw new Error("[action-factory] - makeAction: request.params cannot be null or undefined!"); 
            request.params.key = actionName; 
            request.body = dataBody;

            return wrapCall(methodName, resource.route, request, options);
        };
    }

    init();
    function init(){
        _.each(resources, function(resource){
            var resActions = resource.actions || {};

            _.each(resActions, function(resAction, key) {
                var listKey = "call" + util.toCapitalisedCamelCase(resource.name) + util.toCapitalisedCamelCase(key);
                actions.list[listKey] = makeAction(resource, key, resAction);
            });
        });
    }

    return actions; 
};