var _ = require("lodash");
var when = require("when");
var keys = require("when/keys");
var util = require("./util");
var client;

var services = {};

exports.requestSubresource = function(resourceName, query, user){
  return client["get" + util.toCapitalisedCamelCase(resourceName)](query, {
    fields: "id",
    limit: 0,
    user: user
  }).then(function(res){
    return _.pluck(res[resourceName], "id");
  });
};


exports.unwrapOrFilter = function(resourceName, orQuery, user){
  return when.all(_.map(orQuery, function(term){
    return exports.requestSubresource(resourceName, term, user);
  })).then(function(arrayOfIdsArrays){
    return {$in: _.union.apply(null, arrayOfIdsArrays)};
  });
};

exports.resolveSubquery = function(query){

};

exports.resolveReferencesFilters = function(config){
  var currentResource = config.route;
  var resourceSchema = services[currentResource];
  var filter = config.request.query.filter;
  var dropId = false;
  var hash = {};
  if (resourceSchema){
    _.each(filter, function(query, path) {
      if (path === "$or" || path === "$and") {
        if (filter.id) {
          //Preserve initial id filter wrapped in $and query
          hash.$and = hash.$and || [];
          hash.$and = when.all(hash.$and.concat([
            {id: filter.id},
            keys.all({id: exports.unwrapOrFilter(currentResource, query, config.request.user)})
          ]));
          dropId = true;
        } else {
          hash.id = exports.unwrapOrFilter(currentResource, query, config.request.user);
        }
      } else if (resourceSchema[path] && _.isObject(query) && !(query.in || query.$in)) {
        //Define if path is a ref to external resource
        var externalResourceName = resourceSchema[path].name;
        hash[path] = exports.requestSubresource(externalResourceName, query, config.request.user)
          .then(function (ids) {
            return {$in: ids};
          });
      }else{
        hash[path] = query;
      }
    });
  }else{
    hash = filter;
  }

  return keys.all(dropId ? _.omit(hash, "id") : hash);
};

exports.inspectRequest = function(config){
  if (!config.request.query.filter) return when.resolve();
  return exports.resolveReferencesFilters(config).then(function(rectifiedFilter){
    config.request.query.filter = rectifiedFilter;
    return when.resolve();
  });
};

function getRouteName(resourceName, client){
  return _.find(client.resources, function(resource){
    return resource.name === resourceName;
  }).route;
}

exports.init = function(fortuneClient, router){
  client = fortuneClient;
  _.each(client.resources, function(resource){
    var resourceName = resource.route;
    services[resourceName] = {};
    _.each(resource.schema, function(params, path){
      if (_.isArray(params)){
        if (params[0].external){
          services[resourceName][path] = {
            name: getRouteName(params[0].ref, client),
            isArray: true
          };
        }
      }else{
        if (params.external){
          services[resourceName][path] = {
            name: getRouteName(params.ref, client),
            isArray: false
          };
        }
      }
    });
  });
  router.onRequest(function(config){
    return exports.inspectRequest(config);
  });
};
