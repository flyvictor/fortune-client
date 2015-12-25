'use strict';
var setup = require("./setup"),
  should = require('should'),
  _ = require('lodash'),
  fortuneClient = require('../../lib/fortune-client');

module.exports = function(util){
  describe('fortune-client deep filtering', function(){
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
            res.users.length.should.equal(1);
            res.users[0].id.should.equal(ids.users[0]);
            done();
          });
      }).catch(done);
    });
    it('should correctly handle $or queries', function(done){
      client.updateUser(ids.users[0],[
        {op: 'replace', path: '/users/0/links/band', value: ids.bands[0]}
      ]).then(function(){
        return client.updateUser(ids.users[1],[
          {op: 'replace', path: '/users/0/links/band', value: ids.bands[1]}
        ])
      }).then(function(){
        return client.getUsers({$or: [
          {band: ids.bands[0]},
          {band: ids.bands[1]}
        ]});
      }).then(function(res){
        res.users.length.should.equal(2);
        done();
      });
    });
    it('should correctly handle $in queries', function(done){
      client.updateGenre(ids.genres[0], [
        {op: 'replace', path: '/genres/0/links/instruments', value: ids.instruments}
      ]).then(function(){
        return client.getGenres({instruments: {$in: [ids.instruments[0]]}})
      }).then(function(res){
        res.genres.length.should.equal(1);
        done();
      });
    });
    it('should correctly handle $ne queries', function(done){
      client.updateUser(ids.users[0],[
        {op: 'replace', path: '/users/0/links/band', value: ids.bands[0]}
      ]).then(function(){
        return client.updateUser(ids.users[1],[
          {op: 'replace', path: '/users/0/links/band', value: ids.bands[1]}
        ])
      }).then(function(){
        return client.getUsers({band: {$ne: ids.bands[0]}});
      }).then(function(res){
        res.users.length.should.equal(2);
        done();
      });
    });

  });
};