const fetch = require('cross-fetch');
const crypto = require('crypto');
const qs = require('qs');

exports.get = function(params){
  return exports._send(exports._makeBaseRequest(params, 'GET'), params.requestPostProcessor);
};

exports.post = function(params){
  return exports._send(exports._makeBaseRequest(params, 'POST'), params.requestPostProcessor);
};

exports.delete = function(params){
  return exports._send(exports._makeBaseRequest(params, 'DELETE'), params.requestPostProcessor);
};

exports.put = function(params){
  return exports._send(exports._makeBaseRequest(params, 'PUT'), params.requestPostProcessor);
};

exports.patch = function(params){
  return exports._send(exports._makeBaseRequest(params, 'PATCH'), params.requestPostProcessor);
};

function shouldOverwriteSignature(newSignature, headers){
  return newSignature && !/^Bearer/.test(headers.Authorization || '');
}

exports._makeBaseRequest = function(params, method){
  let oauthHeader = null;
  params.method = method;
  if (params.oauth) {
    oauthHeader = exports._createOAuthHeader(params, params.oauth.consumer_key, params.oauth.consumer_secret);
  }
  const headers = params.headers || {};
  if (shouldOverwriteSignature(oauthHeader, headers)) headers.Authorization = oauthHeader;
  if (params.body) headers['content-type'] = 'application/json';
  const fullUrl = [params.uri].concat(exports._querystringStringify(params.qs)).join('?');

  const result = {
    fullUrl: fullUrl,
    method: params.method,
    headers: headers
  };
  if (params.body) result.body = params.body;

  return result;
};

exports._send = function(params, requestPostProcessor){
  const fetchOptions = {
    method: params.method,
    headers: params.headers
  };
  if (params.body) fetchOptions.body = JSON.stringify(params.body);
  return fetch(params.fullUrl, fetchOptions)
    .then(function(res){ return Promise.all([
        res,
        //delete doesn't send back any content
        fetchOptions.method === 'DELETE' ? null : res.json()
      ])
    })
    .then(function(result) {
      return {
        statusCode: result[0].statusCode || result[0].status,
        body: result[1]
      }
    }).then(result => requestPostProcessor && typeof requestPostProcessor === 'function' ? requestPostProcessor(result) : result);
};

exports._querystringStringify = function(query){
  //TODO: optimise, it doesn't have to use qs there.. Was taking too much time
  return qs.stringify(query, {encode: false, indices: true});
};

exports._createOAuthHeader = function(reqParams, clientKey, clientSecret){
  const oauth = makeOauthParams(clientKey, clientSecret);
  const signature = exports._createOAuthSignature(reqParams, oauth);
  const authHeaderParts = {
    realm: "",
    oauth_consumer_key: oauth.consumer_key,
    oauth_token: "",
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: oauth.timestamp,
    oauth_nonce: oauth.nonce,
    oauth_version: "1.0",
    oauth_signature: encode(signature)
  };
  return "OAuth " + Object.keys(authHeaderParts).map(function(k){
    return k + "=" + authHeaderParts[k];
  }).join(",");
};

exports._createOAuthSignature = function(reqParams, oauth){
  return buildSignature(reqParams, oauth);
};

function makeOauthParams(clientKey, clientSecret){
  return {
    consumer_key: clientKey,
    consumer_secret: clientSecret,
    nonce: makeNonce(),
    timestamp: makeTimestamp()
  };
}

function makeTimestamp(){
  return Math.round(new Date().getTime() / 1000);
}

function makeNonce(){
  const symbols = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split("");
  let result = "";
  for (let i = 0; i < 7; i++){
    result += symbols[Math.floor(Math.random() * symbols.length)];
  }
  return result;
}

function buildSignature(config, oauth){
  const signingKey = encode(oauth.consumer_secret) + '&';
  const baseString = exports._createBaseString(config, oauth);
  return crypto.createHmac('sha1', signingKey).update(baseString).digest('base64');
}

exports._createBaseString = function createBaseString(config, oauth){
  const params = {
    oauth_nonce: oauth.nonce,
    oauth_consumer_key: oauth.consumer_key,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: oauth.timestamp,
    oauth_token: '',
    oauth_version: '1.0'
  };

  if (config.method === 'GET'){
    const pairs = exports._querystringStringify(config.qs, {})
      .split('&')
      .filter(function(s) { return s !== ''})
      .map(function(kv) { return kv.split('=')});
    pairs.forEach(function(pair){
      params[pair[0]] = pair[1];
    });
  }

  const encodedParams = Object.keys(params).reduce(function(memo, key){
    memo[encode(key)] = encode(params[key]);
    return memo;
  }, {});
  const sortedKeys = Object.keys(encodedParams).sort();
  const baseParams = sortedKeys.map(function(k) {
    return k + '=' + encodedParams[k];
  });
  const baseParamsString = baseParams.join('&');
  const baseUrl = config.uri;
  return config.method.toUpperCase() + '&' + encode(baseUrl) + '&' + encode(baseParamsString);
}

function encode(str){
  return encodeURIComponent(str)
       .replace(/[!'()]/g, escape)
       .replace(/\*/g, "%2A");
}
