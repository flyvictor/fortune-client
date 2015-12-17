'use strict';
var _ = require('lodash');
var when = require("when");

exports.setup = function(fortuneClient){
  fortuneClient.onRequest(function(config){
    return exports.modifyFilter(config, fortuneClient);
  });
};

exports.modifyFilter = function (config, fortuneClient) {
  var resource = config.resource;
  var req = config.request;

  if (req.query.filter) {
    return resolveReferencesFilters(fortuneClient, req, resource)
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

function resolveReferencesFilters(fortuneClient, req, resource) {
  var nextFilter = {};
  var filter = req.query.filter;
  var resources = indexResources(fortuneClient.resources, 'route');
  var currentResource = resource;
  if (currentResource === "empty-legs") {
    //TODO: it must come through some configuration option. Fortune-client does not know about specific resources
    currentResource = "movements";
  }
  if (!resources || !resources[currentResource] || !resources[currentResource].schema) {
    return when.resolve(filter);
  }

  var resourceSchema = resources[currentResource].schema;
  return when.all(_.each(filter, function(query, path) {
    if (isExternalLink(path, resourceSchema) && _.isObject(query) && !(query.in || query.$in)) {
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
  var nextQuery = {
    fields: "id",
    filter: queryTerm,
    limit: 0,
    userAuthToken: user && user.authToken
  };

  return fortuneClient.get(resourceName, nextQuery)
    .then(function(response) {
      return _.pluck(response[resourceName], "id");
    });
}