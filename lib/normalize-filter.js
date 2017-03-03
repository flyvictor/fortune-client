'use strict';
var _ = require('lodash');
var qs =  require('qs');

exports.Middleware = function(){

  return function(req){
    if (req.qs && req.qs.filter && _.isObject(req.qs.filter)){
      var filter = req.qs.filter;
      delete req.qs.filter;
      var formatted = qs.stringify({filter: filter}, {encode: false, arrayFormat: 'indices'});
      var pairs = formatted.split('&').map(function(pair){
        return pair.split('=');
      }).reduce(function(memo, pair){
        memo[pair[0]] = pair[1];
        return memo;
      }, {});
      _.extend(req.qs, pairs);
    }
    return req;
  };
};