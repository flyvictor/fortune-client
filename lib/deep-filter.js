'use strict';
var _ = require('lodash');
var when = require("when");

exports.setup = function(fortuneClient, options){
  fortuneClient.onRequest(function(config){
    return exports.modifyFilter(config, fortuneClient, options);
  });
};

exports.modifyFilter = function (config, fortuneClient, options) {
  options = options || {
      virtualResources: {}
    };
  var resource = config.resource;
  var req = config.request;

  if (req.query.filter) {
    return resolveReferencesFilters(fortuneClient, req, resource, options)
      .then(function(rectifiedFilter){
        req.query.filter = rectifiedFilter;
      });
  }
};

function indexResources(array, prop){
  return _.reduce(array, function(memo, resource){
    memo[resource[prop]] = resource;
    return memo;
  }, {});
}

function isValidQueryKey(query){
  return _.intersection([
      'in','$in',
      'ne','$ne',
      'gt','$gte',
      'lt','$lte',
      'or','$or',
      'and','$and',
      'exists','$exists'
    ], _.keys(query)).length !== 0;
}

function resolveReferencesFilters(fortuneClient, req, resource, options) {
  var nextFilter = {};
  var filter = req.query.filter;
  var resources = indexResources(fortuneClient.resources, 'route');
  var currentResource = resource;
  if (options.virtualResources && options.virtualResources[currentResource]){
    currentResource =  options.virtualResources[currentResource]
  }
  if (!resources || !resources[currentResource] || !resources[currentResource].schema) {
    return when.resolve(filter);
  }

  var resourceSchema = resources[currentResource].schema;
  return when.all(_.map(filter, function(query, path) {
    if (isExternalLink(path, resourceSchema) && _.isObject(query) && !isValidQueryKey(query)) {
      var resourceRoute = indexResources(fortuneClient.resources, 'name')[getLinkedRouteName(resourceSchema, path)].route;
      return requestSubresource(fortuneClient, resourceRoute, query, req.user)
        .then(function(ids) {
          nextFilter[path] = { $in: ids };
        }).catch(function(err){
          console.error(err);
          throw err;
        });
    } else {
      nextFilter[path] = query;
    }
  })).then(function() {
    return nextFilter;
  });
}

function getLinkedRouteName(resourceSchema, path){
  return _.isArray(resourceSchema[path]) && resourceSchema[path][0] && resourceSchema[path][0].ref ||
    _.isObject(resourceSchema[path]) && resourceSchema[path].ref;
}

function isExternalLink(path, resourceSchema) {
  if (resourceSchema[path]) {
    if (resourceSchema[path].external) {
      return true;
    }
    if (resourceSchema[path][0] && resourceSchema[path][0].external) {
      return true;
    }
  }
  return false;
}

function requestSubresource(fortuneClient, resourceName, queryTerm, user) {
  var nextFilter = queryTerm;
  var nextOptions = {
    fields: "id",
    limit: 0,
    userAuthToken: user && user.authToken
  };

  return fortuneClient.get(resourceName, nextFilter, nextOptions)
    .then(function(response) {
      return _.pluck(response[resourceName], "id");
    });
}