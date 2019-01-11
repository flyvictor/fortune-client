var _ = require("lodash");


//check if the query is for a whole, possibly filtered collection
var isCollectionQuery = function (query) {
  return ((query === null) || (query === undefined) || _.isPlainObject(query));
};

//check if the query is for a single document only
var isSingleDocQuery = function (query,name) {
    if(name === "create"){
      return !_.isArray(query);
    }else{
      return (_.isString(query) && query !== '') || _.isNumber(query);
    }
};

var toDirectRequest = function (query, options, resourceName, data) {
  options = options || {};
  //REFACTOR: bit ugly this extend...
  var request = _.extend({query: {}, params: {}}, _.omit(options, "linked"));
  
  if(isCollectionQuery(query)){
    if(query) request.query.filter = query;
  }else{
    request.params.id = _.isArray(query) ? query.join(",") : query;
  }
  
  if(data){
    data =  _.isArray(data) ? data : [data];
    
    if(resourceName){
      (request.body = {})[resourceName] = data;
    }else{
      request.body = data;
    }

    if(options.linked) request.body.linked = options.linked;
  }

  if (!_.isUndefined(request.includeDeleted)){
    request.query.includeDeleted = true;
  }
  if (!_.isUndefined(request.destroy)){
    request.query.destroy = true;
  }

  _.each(this.queryKeys, function(keyword){
    if(request[keyword]){
      request.query[keyword] = request[keyword];
      delete request[keyword];
    }

    var kArgs = request.query[keyword];

    if(kArgs && _.isArray(kArgs)){
      request.query[keyword] = kArgs.join(",");
    }
  });

  return request;
};

var util = module.exports = {
  queryKeys: ["include", "fields", "omitFields", "sort", "limit", "page", "pageSize", "includeMeta", "extraFields"],
  toCapitalisedCamelCase: function(str){
    return _.map(str.split("-"), function(substr,i){
      return util.capitalise(substr);
    }).join("");
  },
  capitalise: function(str){
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },
  toCamelCase: function( str ) {
    return _.map( str.split( /[-\ ]/ ), function( substr, i ){
      if( i === 0 ) return substr.toLowerCase();
      return util.capitalise( substr );
    }).join("");
  }, 
  isCollectionQuery: isCollectionQuery, 
  isSingleDocQuery: isSingleDocQuery, 
  toDirectRequest: toDirectRequest,
};
