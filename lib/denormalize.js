'use strict';
var _ = require('lodash');

function getLinkedResources(primaryName, linkName, body){
  var path = primaryName + '.' + linkName;
  var type = body.links[path] && body.links[path].type;
  var concat = body[type] || [];
  return (type && body.linked && body.linked[type] || []).concat(concat);
}

function rebaseLinks(links, top, next){
  return _.reduce(links, function(memo, value, key){
    if (key.indexOf(top) !== 0) return memo;
    if (key.substr(0, top.length + next.length + 1) !== top + '.' + next) return memo;
    var subtype = links[top + '.' + next].type;
    var subkey = key.replace(new RegExp(top + '.\\w+'), subtype);
    if (subkey.indexOf('.') !== -1) memo[subkey] = value;
    return memo;
  }, {});
}

exports._rebaseLinks = rebaseLinks;
exports._getLinkedResources = getLinkedResources;
exports.denormalize = function(config, res){
  var body = res.body;
  var primary = config.resource;
  if (config.request.denormalize){
    denormalizeLayer(body, primary);
  }
  function denormalizeLayer(body, primary){
    _.each(body[primary], function(primaryDoc){
      primaryDoc.links = _.reduce(_.keys(primaryDoc.links), function(memo, linkName){
        var linkedResources = getLinkedResources(primary, linkName, body);
        if (linkedResources){
          var rebased = rebaseLinks(body.links, primary, linkName);
          if (!_.isEmpty(rebased)){
            //Supposed to pull out resource name 'one' from 'one.two.three', should also work for 'hell-lo' for 'hell-lo.two.three'
            var nextPrimary = _.keys(rebased)[0].match(/[\w-]+/)[0];
            var nextBody = {};
            nextBody.links = rebased;
            nextBody[nextPrimary] = body.linked[nextPrimary];
            nextBody.linked = _.extend({}, body.linked);
            nextBody.linked[primary] = body[primary];
            denormalizeLayer(nextBody, nextPrimary);
          }
          var match =  _.filter(linkedResources, function(r){
            var ids = _.isArray(primaryDoc.links[linkName]) ? _.map(primaryDoc.links[linkName], function(doc){
              return (_.isObject(doc) && doc.id) ? doc.id : doc;
            }) : primaryDoc.links[linkName];
            //Even though ids might be a string for one-to-one refs .indexOf() will work fine here
            return ids.indexOf && ids.indexOf(r.id) !== -1;
          });
          memo[linkName] = _.isArray(primaryDoc.links[linkName]) ? match : match[0];
        }else{
          memo[linkName] = primaryDoc.links[linkName];
        }
        return memo;
      }, {});
    });
  }
};
