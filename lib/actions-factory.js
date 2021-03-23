var util = require("./util"),
_ = require("lodash");

module.exports  = function(app, resources){
    var actions = {
        list:  {}
    };

    function wrapCall(method, resource, request, options, isGeneric){
        options = options || {};
        
        return function(cb){
        var dispatch = function(){
            return app[isGeneric ? "callGenericAction" : "callAction"](resource, method,request).then(function(result) {
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
                    
        var methodName = action.method ? action.method.toUpperCase() : "POST";
        var isGeneric = action.isGeneric === true;

        return function(id, data, options){
            var resourceId = id;

            //set query if get or delete action
            var query = null; 
            if(data && ['GET', 'DELETE'].indexOf(methodName) !== -1)
                query = data;

            // set data body if not query and data is defined
            var dataBody = null;
            if(query === null && data !== null) 
                var dataBody = data;

            var request = util.toDirectRequest(resourceId || null, options, null, null); 
            
            if([null, void 0].indexOf(request.params) !== -1) throw new Error("[action-factory] - makeAction: request.params cannot be null or undefined!"); 
            if(isGeneric) request.params.action = actionName; 
                else request.params.key = actionName;
            if(query !== null) request.query = query;
            if(dataBody !== null) request.body = dataBody;

            return wrapCall(methodName, resource.route, request, options, isGeneric);
        };
    }



    init();
    function init(){
        _.each(resources, function(resource){
            var resActions = resource.actions || {};
            _.each(resActions, function(resAction, key) {
                var listKey = "call" + util.toCapitalisedCamelCase(resource.name) + util.toCapitalisedCamelCase(key);
                actions.list[listKey] = function(){
                    return makeAction(resource, key, resAction).apply(actions, arguments);
                };

            });
        });
    }

    return actions; 
};