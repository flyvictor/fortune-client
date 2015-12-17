'use strict';
var setup = require("./setup"),
  should = require('should'),
  _ = require('lodash'),
  fortuneClient = require('../../lib/fortune-client');

module.exports = function(util){
  describe.only('fortune-client deep filtering', function(){
    var client, ids;
    beforeEach(function(done){
      client = fortuneClient([
        setup.apps.users.fortune,
        setup.apps.bands.fortune
      ]);

      client.ready.then(function(){
        ids = {};
        _.each(setup.apps, function(app){
          _.each(app.resources, function(documents, name){
            ids[name] = _.pluck(documents, "id");
          });
        });
        done();
      });
    });
    it('should be able to filter users by bands fields', function(done){
      client.updateUser(ids.users[0], [
        {op: 'replace', path: '/users/0/links/band', value: ids.bands[0]}
      ]).then(function(){
        return client.updateBand(ids.bands[0], [
          {op: 'replace', path: '/bands/0/links/users', value: [ids.users[0]]}
        ]);
      }).then(function(){
        return client.getUsers({band: {name: 'Schizophrenic Rabbits of Mordor'}})
          .then(function(res){
            console.log(res);
            res.users.length.should.equal(1);
            res.users[0].id.should.equal(ids.users[0]);
            done();
          });
      }).catch(done);
    });
  });
};