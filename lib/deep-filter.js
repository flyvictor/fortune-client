'use strict';
var _ = require('lodash');
var when = require("when");

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

function resolveReferencesFilters(fortuneClient, req, resource) {
  var filter = req.query.filter;
  var currentResource = resource;
  if (currentResource === "empty-legs") {
    currentResource = "movements";
  }
  if (!fortuneClient.resources || !fortuneClient.resources[currentResource] || !fortuneClient.resources[currentResource].schema) {
    return when.resolve(filter);
  }

  var resourceSchema = fortuneClient.resources[currentResource].schema;
  return when.all(_.each(filter, function(query, path) {
    if (isExternalLink(path, resourceSchema) && _.isObject(query) && !(query.in || query.$in)) {
      return requestSubresource(fortuneClient, path, query, req.user)
        .then(function(ids) {
          filter[path] = { $in: ids };
        });
    } else {
      filter[path] = query;
      return when.resolve();
    }
  })).then(function() {
    return filter;
  });
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
  console.log(resourceName);
  console.log(nextQuery)

  return fortuneClient.get(resourceName, nextQuery)
    .then(function(response) {
      return _.pluck(response[resourceName], "id");
    });
}