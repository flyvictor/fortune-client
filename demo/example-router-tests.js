'use strict';
var request = require('supertest');
var should = require('should');
var _ = require('lodash');

function shouldNotFail(res) {
  res.statusCode.should.equal(200);
  should.not.exists(res.body.error, res.text); // fortune-client currently doesn't handle errors RESTfully, should implement later
}

describe('fortune-router', function(){
  var baseUrl;

  beforeEach(function(){
    baseUrl = "localhost:3004";
  });

  it('should allow creating a single user, retrieve it and delete it', function(done){
    request(baseUrl).post('/users')
      .set('content-type', 'application/json')
      .send(JSON.stringify({
        email: 'syd.barrett@pinkfloyd.com', 
        name: 'Syd Barrett'
      }))
      .end(function(err, res){
        should.not.exist(err);
        shouldNotFail(res);

        request(baseUrl).get('/users').end(function(err, res){
          should.not.exist(err);
          var matches = _.filter(res.body.users, function(p){ return p.email === 'syd.barrett@pinkfloyd.com'});
          matches.length.should.equal(1);

          request(baseUrl).delete('/users/syd.barrett@pinkfloyd.com').end(function(err, res){
            request(baseUrl).get('/users').end(function(err, res){
              var matches = _.filter(res.body.users, function(p){ return p.email === 'syd.barrett@pinkfloyd.com'});
              matches.length.should.equal(0);
              done();
              
            })
            
          })

        });
      });
  });

  it('should allow creating a single user with instruments', function(done){
    var instruments = [
      {name: "Hammond B3"},
      {name: "Moog Modular Synthesizer"},
      {name: "Piano"}
    ];

    request(baseUrl).post('/instruments').send(instruments).end(function(err, res){
      should.exist(res.body);
      should.exist(res.body.instruments);
      res.body.instruments.length.should.equal(3);
      _.filter(res.body.instruments, function(p){ return p.name === 'Moog Modular Synthesizer'}).length.should.equal(1);

      var instrumentIds = _.map(res.body.instruments, function(e){ return e.id });

      request(baseUrl).post('/users').set('content-type', 'application/json').send(JSON.stringify({
          email: 'keith.emerson@elp.com', 
          name: 'Keith Emerson',
          links: {
            instruments: instrumentIds
          }
        }))
        .end(function(err, res){
          should.not.exist(err);
          shouldNotFail(res);

          request(baseUrl).get('/users/keith.emerson@elp.com?include=instruments').end(function(err, res){
            should.not.exist(err);

            should.exist(res.body.users);
            res.body.users.length.should.equal(1);
            var keithEmerson = res.body.users[0];
            
            should.exist(keithEmerson.links);
            should.exist(keithEmerson.links.instruments);
            keithEmerson.links.instruments.length.should.equal(3);

            should.exist(res.body.linked);
            should.exist(res.body.linked.instruments);
            var instruments = res.body.linked.instruments;

            instruments.length.should.equal(3);

            var emersonInstruments = _.map(keithEmerson.links.instruments, function(e){ 
              return _.find(instruments, function(p){ return p.id == e }) 
            });

            should.exists(_.find(emersonInstruments, function(p){ return p.name === 'Piano' }));
            should.not.exists(_.find(emersonInstruments, function(p){ return p.name === 'Drums' }));

            done();

          });

        });

    });

  });


});