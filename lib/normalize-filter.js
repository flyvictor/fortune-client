'use strict';
var _ = require('lodash');
var qs =  require('qs');

exports.Middleware = function(){

  return function(req){
    if (req.qs && req.qs.filter && _.isObject(req.qs.filter)){
      exports.normalize(req.qs);
    }
    return req;
  };
};

exports.normalize = function(qsObject){
  if (qsObject && qsObject.filter && _.isObject(qsObject.filter)) {
    var filter = qsObject.filter;
    delete qsObject.filter;
    //No need to send it if empty
    if (_.isEmpty(filter)) return qsObject;

    var formatted = qs.stringify({filter: filter}, {encode: false, arrayFormat: 'indices'});
    var pairs = formatted.split('&').map(function (pair) {
      return pair.split('=');
    }).reduce(function (memo, pair) {
      memo[pair[0]] = pair[1];
      return memo;
    }, {});
    _.extend(qsObject, pairs);
    return qsObject;
  }else{
    return qsObject;
  }
};