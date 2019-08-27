var when = require('when'),
    isomorphicClient = require('./isomorphic-http-client');

var sharedParams;

module.exports = function(host) {
  sharedParams = {};
  if (host.oauth) {
    if (!host.oauth.consumer_key) throw new Error('consumer_key is required');
    if (!host.oauth.consumer_secret) throw new Error('consumer_secret is required');
    sharedParams.oauth = Object.assign({}, host.oauth);
  }
  if (host.headers) {
    sharedParams.headers = Object.assign({}, host.headers);
  }
  if (host.requestPostProcessor) {
    sharedParams.requestPostProcessor = host.requestPostProcessor;
  }

  var callAction = function(resource, method, req){
    return callAnyAction(resource, method, req, false);
  };

  var callGenericAction = function(resource, method, req){
    return callAnyAction(resource, method, req, true);
  };

  var callAnyAction =  function(resource, method, req, isGeneric){
    var paramsName = isGeneric ? 'action' : 'key';
    if(!req.params || !req.params[paramsName]) {
      return Promise.reject(Error("[remote-adapter] - callAction: req must contains parameter " + paramsName));
    }
    if(!isGeneric && !req.params.id) {
      return Promise.reject(Error("[remote-adapter] - callAction: req must contains parameters id."));
    }

    var params = Object.assign({
      method: method,
      uri: [url, resource, isGeneric ? 'action' : req.params.id, req.params[paramsName]].join('/'),
      json: true,
      body: req.body || null, 
      qs: req.query || null
    }, sharedParams);

    return isomorphicClient[method.toLowerCase()](params);
  };


  var url = host.url || host;
  return {
    'get': function(resource, req) {
      var params = Object.assign({
        uri: [url, resource, (req.params || {}).id].join('/'),
        json: true,
        qs: req.query
      }, sharedParams);
      return isomorphicClient.get(params);
    },
    'create': function(resource, req) {
      var params = Object.assign({
        uri: [url, resource].join('/'),
        json: true,
        body: req.body
      }, sharedParams);
      return isomorphicClient.post(params);
    },
    'destroy': function(resource, req) {
      var params = Object.assign({
        uri: [url, resource, (req.params || {}).id].join('/'),
        json: true
      }, sharedParams);
      return isomorphicClient.delete(params);
    },
    'replace': function(resource, req) {
      var params = Object.assign({
        uri: [url, resource, (req.params || {}).id].join('/'),
        json: true,
        body: req.body
      }, sharedParams);
      return isomorphicClient.put(params);
    },
    'update': function(resource, req) {
      var params = Object.assign({
        uri: [url, resource, (req.params || {}).id].join('/'),
        json: true,
        body: req.body
      }, sharedParams);
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
