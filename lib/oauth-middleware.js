'use strict';
var _ = require('lodash');
var Crypto = require('cryptojs').Crypto;
if (!Crypto && window) Crypto = window.Crypto;

var normalize = require('./normalize-filter').normalize;

function encode(str){
  return encodeURIComponent(str)
    .replace(/[!'()]/g, escape)
    .replace(/\*/g, "%2A");
}

function createBaseString(config, generated){
  var params = {
    /* jshint camelcase: false */
    oauth_nonce: generated.nonce,
    oauth_consumer_key: generated.appToken,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: generated.timestamp,
    oauth_token: "",
    oauth_version: "1.0"
  };
  var encodedParams = {};
  if (config.method === "GET"){
    params = _.extend(params, config.qs);
  }
  _.each(params, function(v, k){
    encodedParams[encode(k)] = encode(v);
  });
  var sortedKeys = _.keys(encodedParams).sort();
  var baseParams = _.map(sortedKeys, function(k){
    return k + "=" + encodedParams[k];
  });
  var baseParamsString = baseParams.join("&");
  var baseUrl = config.url;
  var baseString = config.method.toUpperCase() + "&" + encode(baseUrl) + "&" + encode(baseParamsString);
  return baseString;
}

function buildSignature(httpConfig, params){
  var signingKey = encode(params.appSecret) + "&";
  var baseString = createBaseString(httpConfig, params);
  return Crypto.util.bytesToBase64(Crypto.HMAC(Crypto.SHA1, baseString, signingKey, {asBytes: true}));
}

exports.Middleware = function(oauth, query){
  oauth = oauth || {};

  return function(req){

    var signatureData = {
      nonce: exports.getNonce(),
      timestamp: exports.getTimestamp()
    };
    signatureData.appToken = oauth.consumer_key;
    signatureData.appSecret = oauth.consumer_secret;

    req.header.Authorization = "OAuth " + _.map({
        oauth_consumer_key: signatureData.appToken,
        oauth_token: "",
        oauth_signature_method: "HMAC-SHA1",
        oauth_timestamp: signatureData.timestamp,
        oauth_nonce: signatureData.nonce,
        oauth_version: "1.0",
        oauth_signature: encode(buildSignature({
          url: req.url,
          method: req.method,
          qs: normalize(query)
        }, signatureData))
      },function(v,k){
        return k + "=" + v;
      }).join(",");

    return req;
  }
};

exports.getTimestamp = function(){
  return Math.round(new Date().getTime() / 1000);
};
exports.getNonce = function(){
  var symbols = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split("");
  var result = "";
  for (var i = 0; i < 7; i++){
    result += symbols[Math.floor(Math.random() * symbols.length)];
  }
  return result;
};