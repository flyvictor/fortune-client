'use strict';
var setup = require("./setup");
var should = require("should");
var when = require("when");
var fortuneClient = require('../../lib/fortune-client');
var _ = require('lodash');


module.exports = function(util){
  describe('resource linking', function(){
    var client, resourceNames, ids = {};
    beforeEach(function(done){
      util.client = client = fortuneClient([setup.apps.users.fortune,
        setup.apps.bands.fortune]);

      client.ready.then(function(){
        resourceNames = _.pluck(_.union.apply(_,_.map(setup.apps, function(app){
          return app.fortune.resources();
        })), "name");

        _.each(setup.apps, function(app){
          _.each(app.resources, function(documents, name){
            ids[name] = _.pluck(documents, "id");
          });
        });
        util.ids = ids;
        return when.all(ids.users.map(function(userId, index){
          return client.updateUser(userId, [{
            op: 'replace', path: '/users/0/links/band', value: ids.bands[index]
          }]).then(function(){
            return client.updateBand(ids.bands[index], [
              {op: 'replace', path: '/bands/0/links/members', value: [userId]}
            ]);
          });
        }));
      }).then(function(){
        console.log('refs are created');
        done();
      });
    });
    describe('plain', function(){
      it('should link to-one refs', function(done){
        client.getUsers({}, {include: 'band'}).then(function(res){
          res.linked.bands.should.be.an.Array;
          res.linked.bands.should.not.be.empty;
          done();
        });
      });
      it('should link to-many refs', function(done){
        client.getBands({}, {include: 'members'}).then(function(res){
          res.linked.users.should.be.an.Array;
          res.linked.users.should.not.be.empty;
          done();
        });
      });
    });
    describe('denormalized', function(){
      it('should link to-one refs', function(done){
        client.getUsers({}, {include: 'band', denormalize: true}).then(function(res){
          res.linked.bands.should.be.an.Array;
          res.linked.bands.should.not.be.empty;
          res.users[0].links.band.should.be.an.Object;
          done();
        }).catch(done);
      });
      it('should link to-many refs', function(done){
        client.getBands({}, {include: 'members', denormalize: true}).then(function(res){
          res.linked.users.should.be.an.Array;
          res.linked.users.should.not.be.empty;
          res.bands[0].links.members[0].should.be.an.Object;
          done();
        }).catch(done);
      });
      it('should properly handle -s in  resource names', function(done){
        client.updateUser(ids.users[0], [
          {op: 'replace', path: '/users/0/links/nanananas', value: ids['na-na-na-nas']}
        ]).then(function(){
          client.getNaNaNaNas({}, {include: 'users,users.nanananas,users.nanananas.users', denormalize: true}).then(function(res){
            res['na-na-na-nas'][0].links.users[0].links.nanananas[0].id.should.equal(ids['na-na-na-nas'][0]);
            res['na-na-na-nas'][0].links.users[0].links.nanananas[0].links.users[0].id.should.equal(ids.users[0]);
            done();
          });
        });
      });
    });
    describe('deep links', function(){
      beforeEach(function(done){
        client.updateBand(ids.bands[0], [
          {op: 'replace', path: '/bands/0/links/genres', value: [ids.genres[0]]}
        ]).then(function(){
          return client.updateGenre(ids.genres[0], [
            {op: 'replace', path: '/genres/0/links/instruments', value: [ids.instruments[0]]}
          ])
        }).then(function(){
          return client.updateInstrument(ids.instruments[0], [
            {op: 'replace', path: '/instruments/0/links/genre', value: ids.genres[0]},
            {op: 'replace', path: '/instruments/0/links/owner', value: ids.users[0]}
          ])
        }).then(function(){done()}).catch(done);
      });
      it('should correctly handle deep external links', function(done){
        client.getUser(ids.users[0],{include: 'band,band.genres,band.genres.instruments,band.genres.instruments.owner'})
          .then(function(res){
            res.linked.bands.should.be.an.Array;
            res.linked.bands.should.not.be.empty;
            res.linked.genres.should.be.an.Array;
            res.linked.genres.should.not.be.empty;
            res.linked.instruments.should.be.an.Array;
            res.linked.instruments.should.not.be.empty;
            res.linked.users.should.be.an.Array;
            res.linked.users.should.not.be.empty;
            done();
          }).catch(done);
      });
      it('should correctly denormalize deep external links', function(done){
        client.getUser(ids.users[0],{
          include: 'band,band.genres,band.genres.instruments,band.genres.instruments.owner',
          denormalize: true
        })
          .then(function(res){
            res.linked.bands.should.be.an.Array;
            res.linked.bands.should.not.be.empty;
            res.linked.genres.should.be.an.Array;
            res.linked.genres.should.not.be.empty;
            res.linked.instruments.should.be.an.Array;
            res.linked.instruments.should.not.be.empty;
            res.linked.users.should.be.an.Array;
            res.linked.users.should.not.be.empty;

            res.users[0].links.band.id.should.equal(ids.bands[0]);
            res.users[0].links.band.links.genres[0].id.should.equal(ids.genres[0]);
            res.users[0].links.band.links.genres[0].links.instruments[0].id.should.equal(ids.instruments[0]);
            res.users[0].links.band.links.genres[0].links.instruments[0].links.owner.id.should.equal(ids.users[0]);
            done();
          }).catch(done);
      });
    });
  });
};