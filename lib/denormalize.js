'use strict';
const _ = require('lodash');

function getLinkedResources(primaryName, linkName, body){
  const path = primaryName + '.' + linkName;
  const type = body.links[path] && body.links[path].type;
  return type && body.linked && body.linked[type];
}

function rebaseLinks(links, top, next){
  return _.reduce(links, function(memo, value, key){
    if (key.indexOf(top) !== 0) return memo;
    if (key.substr(0, top.length + next.length + 1) !== top + '.' + next) return memo;
    const subtype = links[top + '.' + next].type;
    const subkey = key.replace(new RegExp(top + '.\\w+'), subtype);
    if (subkey.indexOf('.') !== -1) memo[subkey] = value;
    return memo;
  }, {});
}

exports._rebaseLinks = rebaseLinks;
exports._getLinkedResources = getLinkedResources;
exports.denormalize = function(config, res){
  const body = res.body;
  const primary = config.resource;
  const denormalizedLayers = {};
  if (config.request.denormalize){
    denormalizeLayer(body, primary);
    if (config.request.denormalizeCheckCircLinks)
      checkCircularLinks(body, primary);
  }
  function denormalizeLayer(body, primary){
    _.each(body[primary], function(primaryDoc){
      primaryDoc.links = _.reduce(_.keys(primaryDoc.links), function(memo, linkName){
        const linkedResources = getLinkedResources(primary, linkName, body);
        if (linkedResources){
          const denormalizedLayersKey = primary + '.' + linkName;
          if (!denormalizedLayers[denormalizedLayersKey]) {
            const rebased = exports._rebaseLinks(body.links, primary, linkName);
            if (!_.isEmpty(rebased)){
              //Supposed to pull out resource name 'one' from 'one.two.three', should also work for 'hell-lo' for 'hell-lo.two.three'
              const nextPrimary = _.keys(rebased)[0].match(/[\w-]+/)[0];
              const nextBody = {};
              nextBody.links = rebased;
              nextBody[nextPrimary] = body.linked[nextPrimary];
              nextBody.linked = _.extend({}, body.linked);
              nextBody.linked[primary] = body[primary];
              denormalizeLayer(nextBody, nextPrimary);
            }
            denormalizedLayers[denormalizedLayersKey] = true;
          }
          const match =  _.filter(linkedResources, function(r){
            const links = primaryDoc.links[linkName];
            const ids = _.isArray(links) ? _.map(links, function(doc){
              return (_.isObject(doc) && doc.id) ? doc.id : doc;
            }) : ((_.isObject(links) && links.id) ? links.id : links);
            //Even though ids might be a string for one-to-one refs .indexOf() will work fine here
            return ids && ids.indexOf && ids.indexOf(r.id) !== -1;
          });
          memo[linkName] = _.isArray(primaryDoc.links[linkName]) ? match : match[0];
        }else{
          memo[linkName] = primaryDoc.links[linkName];
        }
        return memo;
      }, {});
    });
  }
  
  function checkCircularLinks(body, primary) {
    _.each(body[primary], function (obj) {
      checkCircularLinksObj(obj, {});
    })

    function checkCircularLinksObj(obj, links) {
      if (!links[obj.id])
        links[obj.id] = [];
      for (let id in links) {
        if (id != obj.id)
          links[id].push(obj.id);
      }
      _.each(obj.links, function (link, key) {
        if (_.isArray(obj.links[key])) {
          for(let i=0;i<obj.links[key].length;i++) {
            if (isObjLink(obj.links[key][i])) {
              const childId = obj.links[key][i].id;
              if (_.contains(links[childId], obj.id)) {
                obj.links[key][i] = childId;
              } else {
                checkCircularLinksObj(obj.links[key][i], _.clone(links));
              }
            }
          }
        } else {
          if (isObjLink(obj.links[key])) {
            const childId = obj.links[key].id;
            if (_.contains(links[childId], obj.id)) {
              obj.links[key] = childId;
            } else {
              checkCircularLinksObj(obj.links[key], _.clone(links));
            }
          }
        }

      })
    }

    function isObjLink(data) {
      return _.isObject(data) && data.id;
    }
  }
};
