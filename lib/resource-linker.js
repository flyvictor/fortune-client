var _ = require("lodash"),
    when = require("when"),
    util = require("./util");

module.exports = function(router) {
  router.onResponse(function(config,res){
    if(!res.body) {
      return when.resolve();
    } else {
      return fetchExternals(config.request, res.body).catch(function(err) {
        console.trace(err);
      });
    }
  });

  return {
    groupIncludes: groupIncludes,
    fetchExternals: fetchExternals
  };

  /**
   * Returns the root name of the resource.
   *
   * @param {Object} The body data from the response.
   * @api private
   */
  function rootName(body) {
    return _.first(_.without(_.keys(body), "links", "linked", "meta"));
  }

  /**
   * Returns an array of resource properties to be included from the querystring.
   *
   * @param {Object} The http request object.
   * @api private
   */
  function parseIncludes(req) {
    return (req.query || {}).include && req.query.include.split(",");
  }

  /**
   * Returns the id(s) to lookup from the 'links' section of the resource.
   *
   * @param {Object} The resource.
   * @param {String} The link key.
   * @api private
   */
  function linkedIds(resource, linksKey) {
    return _.compact(_.flatten(_.map(resource, function(obj) {
      return obj.links && obj.links[linksKey];
    })));
  }

  /**
   * Returns the resource data for the external resource.
   *
   * @param {String} The type of resource to lookup.
   * @param {Array} The link id(s) of the resource to be looked up.
   * @param {Object} The http request object.
   * @param {Array} The include url params.
   * @api private
   */
  function fetchAncestor(type, ids, includePath, req) {
    return router.actions["get" + util.toCapitalisedCamelCase(type)](ids, {include: includePath, parentRequest: req});
  }

  /**
   * Replaces the target linked property with the external data.
   *
   * @param {Object} The source from the external lookup.
   * @param {Object} The target resource.
   * @param {Object} The include properties.
   * @param {Object} The lookup resource type.
   * @api private
   */
  function mergeLinked(source, target, pathArr, ancestorType) {
    var linked, type, res;

    if (pathArr.length) {
      // the external is referenced by the ancestor
      if (source.links && source.linked && source.links[ancestorType + "." + pathArr.join(".")]) {
        type = source.links[ancestorType + "." + pathArr.join(".")].type;
        linked = source.linked[type];
      }
    } else {
      // ancestor is the sought external
      type = ancestorType;
      linked = source[ancestorType] || [];
    }

    target.linked[type] = _.isArray(res = target.linked[type]) ? _.uniq(res.concat(linked), function(i){ return i.id}) : linked;
  }

  /**
   * Append meta data of included type to the links section of root resource.
   *
   * @param {Object} The source from the external lookup.
   * @param {Object} The target resource.
   * @param {Object} The include properties.
   * @param {Object} The lookup resource type.
   * @api private
   */
  function mergeLinks(source, target, pathArr, ancestorType) {
    var refType = ancestorType + ((pathArr.length > 1) ? "." + _.rest(pathArr).join(".") : "");

    var link = source.links && source.links[refType];

    if (link) target.links[rootName(target) + "." + pathArr.join(".")] = link;
  }

  /**
   * Combines the original target resource with the external resource data.
   *
   * @param {Object} The target resource.
   * @param {Object} The include properties.
   * @param {Object} The lookup resource type.
   * @param {Object} The source from the external lookup.
   * @api private
   */
  function mergeAncestorData(target, pathArr, type, source) {
    mergeLinked(source, target, _.rest(pathArr), type);
    mergeLinks(source, target , pathArr, type);
  }



  /**
   * Batches together the includes by type, as to avoid multiple requests.
   *
   * @param {Object} The resource body.
   * @api private
   */

  function groupIncludes(includes, body) {
    var root = rootName(body);
    var requestsByType = {};

    _.each(includes, function(include) {
      var type = ((body.links && body.links[root + "." + include]) || {}).type,
        split = include.split(".");

      if (_.isUndefined(body.links) || _.isUndefined(body.links[root + "." + split[0]])) {
        return;
      }

      if (type && body.linked[type] && body.linked[type] !== "external") {
        // The type exists but is not an external reference exit.
        return;
      }

      var ancestorType = body.links[root + "." + split[0]].type;
      var ids = linkedIds(body[root], split[0]);
      if (ids.length) {
        var requestData = requestsByType[ancestorType] || {ids: [], includes: []};
        requestData.ids = requestData.ids.concat(ids);
        requestData.includes.push(split);
        requestsByType[ancestorType] = requestData;
      }
    });

    return requestsByType;
  }


  /**
   * Reads the resource object and attaches data via external http calls
   * the properties marked as "external".
   *
   * @param {Object} The http request object.
   * @param {Object} The body data from the response.
   * @api private
   */
  function fetchExternals(request, body) {

    var includes = parseIncludes(request);
    var user = request.user;
    var requestsByType = groupIncludes(includes, body);

    return when.all(_.map(requestsByType, function(requestData, ancestorType) {
        var ids = _.uniq(requestData.ids);
        return fetchAncestor(ancestorType, ids, _.compact(_.map(requestData.includes, function(i) { return _.rest(i).join("."); })).join(","), request)
          .then(function(response){
            return response;
          })
          .then(function(data) {
            _.each(requestData.includes, function(split) {
              mergeAncestorData(body, split, ancestorType, data);
            });
          })
          .catch(function(err) { console.trace(err.stack || err); });
      })).then(function() {
        return body;
      });
  }
};
