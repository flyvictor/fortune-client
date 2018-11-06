var when = require('when'),
    isomorphicClient = require('./isomorphic-http-client');

var sharedParams;

function prepareOauth(oauth, source) {
  if (oauth) {
    if (!oauth.consumer_key) throw new Error('consumer_key is required');
    if (!oauth.consumer_secret) throw new Error('consumer_secret is required');
    source.oauth = Object.assign({}, oauth);
  }
}

module.exports = function(host, options) {
  sharedParams = {};
  var objectParams = {}
  var oauth = options.oauth || host.oauth
  prepareOauth(options.oauth, objectParams)
  prepareOauth(host.oauth, sharedParams)

  if (host.headers) {
    sharedParams.headers = Object.assign({}, host.headers);
  }

  var callAction = function(resource, method, req){
    return callAnyAction(resource, method, req, false);
  };

  var callGenericAction = function(resource, method, req){
    return callAnyAction(resource, method, req, true);
  };

  var callAnyAction =  function(resource, method, req, isGeneric){
    const action = req.params && (req.params.key || req.params.action)
    if(!action) {
      return Promise.reject(Error("[remote-adapter] - callAction: req must contains action name."));
    }
    if(!isGeneric && !req.params.id) {
      return Promise.reject(Error("[remote-adapter] - callAction: req must contains parameters id."));
    }

    var params = Object.assign({
      method: method,
      uri: [url, resource, isGeneric ? 'action' : req.params.id, action].join('/'),
      json: true,
      body: req.body || null, 
      qs: req.query || null
    }, Object.assign({}, sharedParams, objectParams));

    return isomorphicClient[method.toLowerCase()](params);
  };


  var url = host.url || host;
  return {
    'get': function(resource, req) {
      var params = Object.assign({
        uri: [url, resource, (req.params || {}).id].join('/'),
        json: true,
        qs: req.query
      }, Object.assign({}, sharedParams, objectParams));
      return isomorphicClient.get(params);
    },
    'create': function(resource, req) {
      var params = Object.assign({
        uri: [url, resource].join('/'),
        json: true,
        body: req.body
      }, Object.assign({}, sharedParams, objectParams));
      return isomorphicClient.post(params);
    },
    'destroy': function(resource, req) {
      var params = Object.assign({
        uri: [url, resource, (req.params || {}).id].join('/'),
        json: true
      }, Object.assign({}, sharedParams, objectParams));
      return isomorphicClient.delete(params);
    },
    'replace': function(resource, req) {
      var params = Object.assign({
        uri: [url, resource, (req.params || {}).id].join('/'),
        json: true,
        body: req.body
      }, Object.assign({}, sharedParams, objectParams));
      return isomorphicClient.put(params);
    },
    'update': function(resource, req) {
      var params = Object.assign({
        uri: [url, resource, (req.params || {}).id].join('/'),
        json: true,
        body: req.body
      }, Object.assign({}, sharedParams, objectParams));
      return isomorphicClient.patch(params);
    },
    'callAction': callAction,
    'callGenericAction': callGenericAction,
  };
};

module.exports.changeHeader = function(name, value) {
  sharedParams.headers = sharedParams.headers || {};
  sharedParams.headers[name] = value;
};

module.exports.deleteHeader = function(name) {
  if (sharedParams.headers && sharedParams.headers[name])
    delete sharedParams.headers[name];
};
