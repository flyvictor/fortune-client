'use strict';
var sinon = require('sinon');
var should = require('should');
var factory = require('../../lib/oauth-middleware');

describe('oauth middleware', function(){
  var fn;
  beforeEach(function(){
    sinon.stub(factory, 'getNonce');
    sinon.stub(factory, 'getTimestamp');
  });
  afterEach(function(){
    factory.getNonce.restore();
    factory.getTimestamp.restore();
  });
  it('should build correct signature for plain request with no parameters', function(){
    fn = factory.Middleware({consumer_key: 'key', consumer_secret: 'secret'});
    factory.getTimestamp.returns('1488465600');
    factory.getNonce.returns('eNVVS5K');
    var result = fn({method: 'GET', url: 'http://localhost:3012/resources', header: {}}).header.Authorization;
    var match =result.match(/signature=(.+)$/)[1];
    match.should.equal(encodeURIComponent('u2z9Jl/y8CqEQN6ZyJUCIfxwSqM='));
  });
  it('should build correct signature for request with query', function(){
    fn = factory.Middleware({consumer_key: 'key', consumer_secret: 'secret'}, {
      hello:'world',
      'one{two][three]': 'four'
    });
    factory.getTimestamp.returns('1488465645');
    factory.getNonce.returns('2SsYPgD');

    var result = fn({method: 'GET', url: 'http://localhost:3012/resources', header: {}, qs: {}}).header.Authorization;
    var match = result.match(/signature=(.+)$/)[1];
    match.should.equal(encodeURIComponent('xc7beYSzMKN4+5K/+uvsPAHR2f4='));
  });
  it('should build correct signature for JS filter objects', function(){
    fn = factory.Middleware({consumer_key: 'key', consumer_secret: 'secret'}, {
      filter: {a: {b: {c: 1}}},
      include: 'link'
    });
    factory.getTimestamp.returns('1488542821');
    factory.getNonce.returns('0KhAzz');

    var result = fn({method: 'GET', url: 'http://localhost:3012/resources', header: {}, qs: {}}).header.Authorization;
    var match = result.match(/signature=(.+)$/)[1];
    match.should.equal(encodeURIComponent('kIc3ml6PqjfivhNJxe4EfyVQ0Kk='));
  });
});