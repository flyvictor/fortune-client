var _ = require("lodash"),
    when = require("when"),
    util = require("./util");

//REFACTOR: tight coupling with the client
module.exports = function(client, req,res,data) {
  if(!data) {
    return when.resolve();
  } else {
    return fetchExternals(req,data).catch(function(err) {
      console.trace(err);
    });
  }

  /**
   * Returns the base url of the request.
   *
   * @param {Object} The http request object.
   * @api private
   */
  function baseUrl(req) {
    return req.protocol + "://" + req.get("host");
  }

  /**
   * Returns the user auth token (if present) from request header or querystring.
   *
   * @param {Object} The http request object.
   * @api private
   */
  function userAuthToken(req) {
    return (req.query || {}).userAuthToken || (req.headers || {}).userauthtoken;
  }

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
  function includes(req) {
    return req.query.include && req.query.include.split(",");
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
  function fetchAncestor(type, ids, req, includeArr) {
    var query = includeArr.length && {include: inlcludeArr.join(".")};
    return client["get" + util.capitalise(type)](ids, query);
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

    target.linked[type] = _.isArray(res = target.linked[type]) ? res.concat(linked) : linked;
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
   * Reads the resource object and attaches data via external http calls
   * the properties marked as "external".
   *
   * @param {Object} The http request object.
   * @param {Object} The body data from the response.
   * @api private
   */
  function fetchExternals(req, body) {
    var root = rootName(body);

    return when.all(_.map(includes(req), function(include) {

      var type = ((body.links && body.links[root + "." + include]) || {}).type,
          split = include.split(".");

      if (_.isUndefined(body.links[root + "." + split[0]])) {
        // The ancestor section of the include does not exist in root resource.
        return when.resolve();
      }
      
      if (type && body.linked[type] && body.linked[type] !== "external") {
        // The type exists but is not an external reference exit.
        return when.resolve();
      }

      var ancestorType = body.links[root + "." + split[0]].type;
      var ids = linkedIds(body[root], split[0]);

      if (ids.length) {
        return fetchAncestor(ancestorType, ids, req, _.rest(split))
        //.then(function(response){ return JSON.parse(response.body); })
          .then(_.partial(mergeAncestorData, body, split, ancestorType))
          .catch(function(err) { console.trace(err); });
      } else {
        return when.resolve();
      }
    })).then(function() {
      return body;
    });
  }
};
